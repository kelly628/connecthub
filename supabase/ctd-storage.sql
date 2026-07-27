-- ============================================================================
--  ConnectHub — image storage buckets. Run after ctd-provision.sql.
--  Safe to re-run.
--
--  Two public buckets: member headshots and event logos. They're public-read
--  because the images are rendered with plain <img src>, and because a signed
--  URL would expire inside an exported PDF.
--
--  Uploads are still restricted to signed-in staff, and the client downscales
--  every image to 512px JPEG before it gets here — a phone photo goes from
--  ~4MB to ~25KB.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('ctd-avatars', 'ctd-avatars', true),
       ('ctd-logos',   'ctd-logos',   true)
on conflict (id) do update set public = true;

drop policy if exists "connecthub staff uploads" on storage.objects;
create policy "connecthub staff uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('ctd-avatars', 'ctd-logos'));

drop policy if exists "connecthub public read" on storage.objects;
create policy "connecthub public read" on storage.objects
  for select to public
  using (bucket_id in ('ctd-avatars', 'ctd-logos'));
