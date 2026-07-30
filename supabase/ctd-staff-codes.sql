-- =========================================================================
--  ConnectHub — per-person sign-in codes. Run after ctd-provision.sql.
--  Safe to re-run.
--
--  Replaces the single shared STAFF_CODE. Each staffer types their own code
--  ("Connie-88"), and the server answers with BOTH a session and who they are.
--  That matters beyond convenience: until now the app asked people to pick
--  their own name off a list, so "these are Shannon's tasks" was a claim the
--  browser made about itself. Now it's the server's answer to a code only
--  Shannon has.
-- =========================================================================

-- ── 1. The codes ─────────────────────────────────────────────────────────
--
-- Stored readable, on purpose. The office has to be able to answer "what's
-- Rayne's code again?" without resetting it — that question comes up far more
-- often than any attack does, and a hash would make it unanswerable.
--
-- What protects them is reach, not hashing: every privilege is revoked below,
-- so this table does not exist as far as the Data API is concerned. A
-- signed-in staffer querying it gets nothing — not even their own row. Only
-- the service-role key, which lives in the Netlify functions and never reaches
-- a browser, can read it.
create table if not exists public.ctd_staff_codes (
  member_id  uuid primary key references public.ctd_members(id) on delete cascade,
  code       text not null,
  updated_at timestamptz not null default now()
);

-- Codes are matched case-insensitively, so uniqueness has to agree or
-- "Kelly-99" and "kelly-99" become two different people's codes.
create unique index if not exists ctd_staff_codes_code_key
  on public.ctd_staff_codes (lower(trim(code)));

alter table public.ctd_staff_codes enable row level security;
revoke all on public.ctd_staff_codes from anon, authenticated;

-- ── 2. The throttle ──────────────────────────────────────────────────────
--
-- A name-and-year code is memorable precisely because it is guessable: there
-- are only ~60 plausible years, and for an alumna the real one is often on the
-- school's own website. Sixty guesses is nothing. So the code is not asked to
-- carry the weight alone — this table makes guessing slow enough not to work.
--
-- Keyed on the NAME half of the attempt, not the whole code. Someone working
-- through shannon-01, shannon-02, shannon-03 submits a different string every
-- time, so a per-code counter would never see the same value twice and would
-- never trip. Counting "attempts against Shannon" is what actually catches it.
create table if not exists public.ctd_login_throttle (
  name_key     text primary key,
  fails        integer     not null default 0,
  locked_until timestamptz,
  updated_at   timestamptz not null default now()
);

alter table public.ctd_login_throttle enable row level security;
revoke all on public.ctd_login_throttle from anon, authenticated;

-- Record a failed attempt and return the lockout, if this one trips it.
-- Escalating, so an honest typo costs a moment and a grinding attack costs
-- the rest of the day: 5 wrong -> 1 min, 10 -> 15 min, 15 -> 12 hours.
create or replace function public.ctd_note_login_failure(p_name text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fails integer;
  v_until timestamptz;
begin
  insert into public.ctd_login_throttle (name_key, fails, updated_at)
       values (lower(trim(p_name)), 1, now())
  on conflict (name_key) do update
          set fails      = public.ctd_login_throttle.fails + 1,
              updated_at = now()
    returning fails into v_fails;

  v_until := case
    when v_fails >= 15 then now() + interval '12 hours'
    when v_fails >= 10 then now() + interval '15 minutes'
    when v_fails >= 5  then now() + interval '1 minute'
    else null
  end;

  if v_until is not null then
    update public.ctd_login_throttle
       set locked_until = v_until
     where name_key = lower(trim(p_name));
  end if;

  return v_until;
end;
$$;

-- A correct code clears the slate, so a staffer who fumbles twice and then
-- gets it right isn't carrying those failures toward a lockout later.
create or replace function public.ctd_clear_login_failures(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ctd_login_throttle where name_key = lower(trim(p_name));
end;
$$;

-- Neither helper is for the browser to call: staff-login reaches them with the
-- service-role key. Left callable by `authenticated` they would let any
-- signed-in staffer clear a lockout they had just triggered.
revoke execute on function public.ctd_note_login_failure(text)   from authenticated, anon;
revoke execute on function public.ctd_clear_login_failures(text) from authenticated, anon;

-- Look a code up and answer with the person it belongs to.
--
-- Deliberately an RPC rather than a PostgREST filter. Matching case- and
-- whitespace-insensitively over the wire would mean `code=ilike.<input>`, and
-- ilike reads % and _ as wildcards — so a code of "%-88" would match Connie's
-- row and sign the caller in as the Head of School. Comparing inside SQL takes
-- the input as a value, never as a pattern.
--
-- Archived staff are excluded: taking someone off the roster has to end their
-- ability to sign in, or "removing" a person is only cosmetic.
create or replace function public.ctd_lookup_staff_code(p_code text)
returns table (member_id uuid, member_name text)
language sql
security definer
set search_path = public
as $$
  select m.id, m.name
    from public.ctd_staff_codes c
    join public.ctd_members m on m.id = c.member_id
   where lower(trim(c.code)) = lower(trim(p_code))
     and coalesce(m.archived, false) = false
   limit 1;
$$;

revoke execute on function public.ctd_lookup_staff_code(text) from authenticated, anon;

-- ── 3. The roster ────────────────────────────────────────────────────────
--
-- The eight people who plan events, with the codes they sign in with. Names
-- and years are as the school's own directory lists them.
insert into public.ctd_members (name, title, sort_order)
values
  ('Connie Dantagnan',  'Head of School',                      1),
  ('Maria Eaton',       'Director of Advancement',             2),
  ('Shannon Impastato', 'Director of Alumnae',                 3),
  ('Kacey Pierce',      'Director of Admissions',              4),
  ('Rayne Morehead',    'Advancement Coordinator',             5),
  ('Tanya Dempster',    'Director of Community Events',        6),
  ('Jamie Larmeu',      'Director of Marketing & PR',          7),
  ('Kelly Claverie',    'Claverie Creative',                   8)
on conflict do nothing;

-- Codes are attached by name so this block stays re-runnable and readable.
-- Re-running updates the code in place rather than failing on the primary key.
insert into public.ctd_staff_codes (member_id, code)
select m.id, v.code
  from (values
    ('Connie Dantagnan',  'Connie-88'),
    ('Maria Eaton',       'Maria-06'),
    ('Shannon Impastato', 'Shannon-96'),
    ('Kacey Pierce',      'Kacey-13'),
    ('Rayne Morehead',    'Rayne-13'),
    ('Tanya Dempster',    'Tanya-95'),
    ('Jamie Larmeu',      'Jamie-17'),
    ('Kelly Claverie',    'Kelly-99')
  ) as v(name, code)
  join public.ctd_members m on lower(trim(m.name)) = lower(trim(v.name))
on conflict (member_id) do update
        set code = excluded.code, updated_at = now();
