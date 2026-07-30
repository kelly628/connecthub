-- =========================================================================
--  ConnectHub — admin belongs to a person, not to a password.
--  Run after ctd-staff-codes.sql. Safe to re-run.
--
--  Before this, approving was a shared secret: anyone who typed ADMIN_PASSWORD
--  could bless or delete a project, and the record of who did it was whatever
--  name the browser happened to be holding. Connie could approve — so could
--  anyone who had ever been told the password, and the database could not tell
--  the difference.
--
--  Now the roster says who may approve. Connie signs in with her own code and
--  has the power; everyone else signs in and does not.
-- =========================================================================

-- ── 1. The flag ──────────────────────────────────────────────────────────
--
-- Readable by staff on purpose — "who do I send this to for approval?" is a
-- question the app should be able to answer out loud. Writing it is another
-- matter: ctd-provision.sql §3 revokes insert/update/delete on ctd_members
-- from `authenticated`, so a staffer cannot promote themselves even by
-- calling PostgREST directly. Only admin-action.js, holding the service-role
-- key, can move this column.
alter table public.ctd_members
  add column if not exists is_admin boolean not null default false;

-- ── 2. Sign-in reports it ────────────────────────────────────────────────
--
-- The return type gains a column, and Postgres will not let create-or-replace
-- change a function's signature — it has to be dropped first. Dropping is safe
-- here: nothing but staff-login calls it, and it is recreated in the same
-- transaction-less breath below.
drop function if exists public.ctd_lookup_staff_code(text);

create or replace function public.ctd_lookup_staff_code(p_code text)
returns table (member_id uuid, member_name text, is_admin boolean)
language sql
security definer
set search_path = public
as $$
  select m.id, m.name, coalesce(m.is_admin, false)
    from public.ctd_staff_codes c
    join public.ctd_members m on m.id = c.member_id
   where lower(trim(c.code)) = lower(trim(p_code))
     and coalesce(m.archived, false) = false
   limit 1;
$$;

revoke execute on function public.ctd_lookup_staff_code(text) from authenticated, anon;

-- ── 3. Who approves ──────────────────────────────────────────────────────
--
-- Connie is Head of School and the person the office routes approvals through.
-- Kelly builds and maintains the hub, so she needs the roster and the codes.
--
-- One list, used twice: set it on these people and clear it on everyone else.
-- That makes the file a statement of the current answer rather than a pile of
-- one-off promotions, so re-running it always lands in the same place — and
-- adding or removing an approver later means editing one list, in one spot.
--
-- Note this file is the blunt instrument. Day to day, use the "Can approve
-- projects" checkbox on the Team screen, which refuses to remove the last
-- approver; this will happily do so if the list is emptied.
with approvers(name) as (
  values ('connie dantagnan'),
         ('kelly claverie')
)
update public.ctd_members m
   set is_admin = (lower(trim(m.name)) in (select name from approvers))
 where is_admin <> (lower(trim(m.name)) in (select name from approvers));
