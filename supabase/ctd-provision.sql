-- ============================================================================
--  ConnectHub — provision the database (one script, start to finish)
--
--  Run this once on a brand-new, empty Supabase project. It builds the full
--  schema, the RLS lockdown, and the admin boundary.
--
--  SAFE TO RE-RUN: every statement is idempotent (create if not exists,
--  create or replace, drop-then-create policies). Running it twice changes
--  nothing. If it errors, nothing is harmed — fix the line and run again.
--
--  Conventions follow PacketHub's supabase/provision.sql (ChapelleHub).
-- ============================================================================

create extension if not exists pgcrypto;  -- provides gen_random_uuid()

-- ============================================================================
--  1) TABLES  (created in dependency order so foreign keys resolve)
-- ============================================================================

create table if not exists public.ctd_members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  title      text default '',
  photo_url  text,
  sort_order integer default 0,
  archived   boolean not null default false,
  created_at timestamptz default now()
);

-- One person, one row. The client matches people to dots and leads by
-- lower(trim(name)) everywhere, so the uniqueness has to agree with that or
-- "Sarah M." and "sarah m. " become two different staff members.
create unique index if not exists ctd_members_name_key
  on public.ctd_members (lower(trim(name)));

create table if not exists public.ctd_projects (
  id           uuid primary key default gen_random_uuid(),
  name         text   not null default '',
  date         date,                          -- PostgREST serializes as 'YYYY-MM-DD'
  leads        text[] not null default '{}',
  dot_count    smallint not null default 8 check (dot_count between 1 and 12),
  icon_name    text,
  logo_url     text,
  notes        jsonb  not null default '[]'::jsonb,
  submitted    boolean not null default false,
  submitted_at timestamptz,
  submitted_by text,
  blessed      boolean not null default false,  -- staff CANNOT write this; see §3
  blessed_at   timestamptz,
  blessed_by   text,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists ctd_projects_date_idx  on public.ctd_projects (date);
create index if not exists ctd_projects_queue_idx on public.ctd_projects (submitted, blessed);

-- One row per cell of the dot grid. `slot` is the DOT_PRIORITY index the client
-- uses to lay the grid out, so the board renders identically no matter what
-- order Postgres hands the rows back in.
create table if not exists public.ctd_dots (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.ctd_projects(id) on delete cascade,
  slot        smallint not null check (slot between 0 and 11),
  member_name text not null default '',
  member_id   uuid references public.ctd_members(id) on delete set null,
  created_at  timestamptz default now(),
  unique (project_id, slot)
);
create index if not exists ctd_dots_project_idx on public.ctd_dots (project_id);
create index if not exists ctd_dots_member_idx  on public.ctd_dots (lower(trim(member_name)));

-- The row that makes concurrent check-off safe. Checking a box is one UPDATE,
-- one column, one row — so two staff ticking their own tasks on the same
-- project at the same moment cannot overwrite each other. This is the whole
-- reason the schema is normalized instead of one JSONB blob per project.
create table if not exists public.ctd_tasks (
  id         uuid primary key default gen_random_uuid(),
  dot_id     uuid not null references public.ctd_dots(id) on delete cascade,
  text       text not null default '',
  done       boolean not null default false,
  done_at    timestamptz,
  done_by    text,
  sort_order smallint not null default 0,
  created_at timestamptz default now()
);
create index if not exists ctd_tasks_dot_idx on public.ctd_tasks (dot_id);

create or replace function public.ctd_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists ctd_projects_touch on public.ctd_projects;
create trigger ctd_projects_touch before update on public.ctd_projects
  for each row execute function public.ctd_touch();

-- ============================================================================
--  2) ROW LEVEL SECURITY
--
--  There are deliberately NO policies for `anon`. The publishable key alone
--  reaches nothing. Only a session minted by the staff-login function (after
--  the shared staff code is verified server-side) can read or write.
-- ============================================================================

alter table public.ctd_members  enable row level security;
alter table public.ctd_projects enable row level security;
alter table public.ctd_dots     enable row level security;
alter table public.ctd_tasks    enable row level security;

do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('ctd_members','ctd_projects','ctd_dots','ctd_tasks')
  loop
    execute format('drop policy %I on public.%I;', r.policyname, r.tablename);
  end loop;
end $$;

create policy ctd_staff_read on public.ctd_members
  for select to authenticated using (true);

create policy ctd_staff_all on public.ctd_projects
  for all to authenticated using (true) with check (true);

create policy ctd_staff_all on public.ctd_dots
  for all to authenticated using (true) with check (true);

create policy ctd_staff_all on public.ctd_tasks
  for all to authenticated using (true) with check (true);

-- ============================================================================
--  3) THE ADMIN BOUNDARY — enforced by Postgres, not by React
--
--  RLS above says "a signed-in staffer may work on projects." These four lines
--  say "…but may not approve one, delete one, or edit the roster." Only
--  service_role (i.e. the admin-action Netlify function, which verifies the
--  admin password server-side) can do those.
--
--  This is why setting ctd_is_admin=true in devtools no longer achieves
--  anything: the button appears, the click fires, and the database refuses.
-- ============================================================================

revoke delete on public.ctd_projects from authenticated;
revoke update (blessed, blessed_at, blessed_by) on public.ctd_projects from authenticated;
revoke insert, update, delete on public.ctd_members from authenticated;

-- WARNING: a later `grant all on all tables in schema public to authenticated`
-- would silently undo every revoke above. Never run one. If you suspect it
-- happened, re-running this file restores the boundary.

-- ============================================================================
--  4) FUNCTIONS
-- ============================================================================

-- Append a sticky note atomically. `notes` is the one jsonb column we kept
-- (notes are low-contention and it saves touching ProjectDetail at all), so
-- this is the one place a read-modify-write race was still possible.
create or replace function public.ctd_add_note(p_project uuid, p_text text, p_by text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  update public.ctd_projects
     set notes = notes || jsonb_build_object(
           'id',        gen_random_uuid(),
           'text',      p_text,
           'by',        p_by,
           'createdAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
           'done',      false
         )
   where id = p_project
  returning notes;
$$;

-- Duplicate a project with its dots and tasks, in one transaction, with every
-- task reset to not-done. Replaces the client-side deep copy.
create or replace function public.ctd_duplicate_project(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  insert into public.ctd_projects (name, date, leads, dot_count, icon_name, logo_url, notes)
  select name || ' (Copy)', date, leads, dot_count, icon_name, logo_url, '[]'::jsonb
    from public.ctd_projects
   where id = p_id
  returning id into new_id;

  if new_id is null then
    raise exception 'project not found';
  end if;

  with d as (
    insert into public.ctd_dots (project_id, slot, member_name, member_id)
    select new_id, slot, member_name, member_id
      from public.ctd_dots
     where project_id = p_id
    returning id, slot
  )
  insert into public.ctd_tasks (dot_id, text, done, sort_order)
  select d.id, t.text, false, t.sort_order
    from public.ctd_dots od
    join d on d.slot = od.slot
    join public.ctd_tasks t on t.dot_id = od.id
   where od.project_id = p_id;

  return new_id;
end $$;

-- Renaming a staff member has to cascade: names are the join key between the
-- roster, the dots, and the project leads. ADMIN ONLY — a staffer renaming
-- someone would silently reassign that person's work.
create or replace function public.ctd_rename_member(p_old text, p_new text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ctd_members
     set name = p_new
   where lower(trim(name)) = lower(trim(p_old));

  update public.ctd_dots
     set member_name = p_new
   where lower(trim(member_name)) = lower(trim(p_old));

  update public.ctd_projects
     set leads = array_replace(leads, p_old, p_new)
   where p_old = any(leads);
end $$;

revoke execute on function public.ctd_rename_member(text, text) from authenticated, anon;

-- ============================================================================
--  DONE. Next steps (see README.md):
--    1. Run supabase/ctd-storage.sql to create the image buckets.
--    2. Authentication → Users → Add user: the shared staff identity
--       (STAFF_AUTH_EMAIL / STAFF_AUTH_PASSWORD), auto-confirmed.
--    3. Set the env vars in Netlify.
-- ============================================================================
