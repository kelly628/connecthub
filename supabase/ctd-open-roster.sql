-- =========================================================================
--  ConnectHub — anyone on staff can add a team member.
--  Run after ctd-admins.sql. Safe to re-run.
--
--  Adding a person was admin-only, which made a five-second job into a request
--  to the office. Now any signed-in staffer can do it.
--
--  Adding is not the same as editing, and the difference is deliberate — see
--  the note on renaming below.
-- =========================================================================

-- ── 1. Staff may insert ──────────────────────────────────────────────────
--
-- Column-by-column, not `grant insert on ctd_members`. A table-wide grant
-- would include is_admin, and a staffer could then POST straight to PostgREST
-- with {"name":"me","is_admin":true} and hand themselves approval rights. The
-- column is simply not grantable here, so an insert that mentions it is
-- refused and one that omits it takes the default, false.
grant insert (name, title, photo_url, sort_order)
   on public.ctd_members
   to authenticated;

-- RLS is on for this table, so the grant alone is not enough — without a
-- policy for INSERT every attempt still fails the row check.
drop policy if exists ctd_staff_add_member on public.ctd_members;
create policy ctd_staff_add_member on public.ctd_members
  for insert to authenticated
  with check (true);

-- ── 2. Editing and removing stay with the approvers ──────────────────────
--
-- Not caution for its own sake: renaming has to cascade. A person's name is
-- how their dots and their project leads are matched to them, so changing it
-- in one place and not the others silently detaches every task they own.
-- ctd_rename_member does all three together and is revoked from staff, so a
-- plain UPDATE here would be exactly the half-rename that function exists to
-- prevent. Deleting stays admin-only for the ordinary reason.
--
-- Restated rather than assumed, so this file is a complete statement of who
-- may do what to the roster even if it is read on its own.
revoke update, delete on public.ctd_members from authenticated;

-- A person added this way has no sign-in code — only an admin can set those,
-- and the codes table stays unreachable from the browser either way. They can
-- be assigned to dots and given tasks immediately; they simply cannot sign in
-- until an approver gives them a code on the Team screen.

-- ── 3. How a person looks is theirs to set ───────────────────────────────
--
-- An icon and a colour, so the roster is not eight identical green circles of
-- initials. Both are nullable: empty means the old look, so nothing has to be
-- filled in for the page to keep working.
alter table public.ctd_members
  add column if not exists icon_name text;

alter table public.ctd_members
  add column if not exists color text;

-- Column-level again, and for the same reason as the insert above: this is the
-- narrowest grant that lets someone restyle their card. Name is pointedly not
-- in the list — renaming has to go through ctd_rename_member so the change
-- reaches their dots and their project leads too.
grant update (icon_name, color, photo_url)
   on public.ctd_members
   to authenticated;

drop policy if exists ctd_staff_style_member on public.ctd_members;
create policy ctd_staff_style_member on public.ctd_members
  for update to authenticated
  using (true)
  with check (true);

-- Worth being plain about: every staffer shares one database identity, so
-- Postgres cannot tell whose row is whose and this permits restyling anyone's
-- card, not only your own. "You change your own icon" is a courtesy of the
-- interface here, the same as "you tick your own boxes". What is genuinely
-- enforced is the part that matters — no renaming, no deleting, no granting
-- yourself approval.
