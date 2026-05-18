-- TrueKind V2 freeze blocker: persist profile video presentation.
-- Run in Supabase SQL editor for the project used by the hosted/internal test app.

alter table public.profiles
  add column if not exists video_url text;

alter table public.profiles
  enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'video-presentations',
  'video-presentations',
  true,
  52428800,
  array[
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select on storage.buckets to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "video_presentations_select_public" on storage.objects;
create policy "video_presentations_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'video-presentations');

drop policy if exists "video_presentations_insert_own" on storage.objects;
create policy "video_presentations_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'video-presentations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "video_presentations_update_own" on storage.objects;
create policy "video_presentations_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'video-presentations'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'video-presentations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "video_presentations_delete_own" on storage.objects;
create policy "video_presentations_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'video-presentations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
