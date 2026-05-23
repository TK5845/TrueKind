-- TrueKind internal backend setup and global seed data.
-- Run in the Supabase SQL editor for the internal test project.
-- Safe to re-run. It creates/updates schema, RLS policies, storage buckets,
-- and global discover candidates used by signed-in internal testers.

create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  first_name text,
  name text,
  age text,
  city text,
  looking_for text,
  contact_intent text,
  activity_interest text,
  interests text[] not null default '{}',
  bio text,
  prompt text,
  favorite_song text,
  favorite_film text,
  favorite_book text,
  image_url text,
  voice_url text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists first_name text,
  add column if not exists name text,
  add column if not exists age text,
  add column if not exists city text,
  add column if not exists looking_for text,
  add column if not exists contact_intent text,
  add column if not exists activity_interest text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists bio text,
  add column if not exists prompt text,
  add column if not exists favorite_song text,
  add column if not exists favorite_film text,
  add column if not exists favorite_book text,
  add column if not exists image_url text,
  add column if not exists voice_url text,
  add column if not exists video_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.discover_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  match_id text not null,
  target_profile_id text not null,
  name text not null,
  age integer,
  city text,
  image text,
  image_url text,
  chemistry_label text,
  about_text text,
  looking_for text,
  activity_label text,
  interests text[] not null default '{}',
  latest_signal_text text,
  latest_signal_at timestamptz,
  unread_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discover_candidates_status_check
    check (status in ('active', 'hidden', 'archived'))
);

alter table public.discover_candidates
  add column if not exists user_id uuid null,
  add column if not exists match_id text,
  add column if not exists target_profile_id text,
  add column if not exists name text,
  add column if not exists age integer,
  add column if not exists city text,
  add column if not exists image text,
  add column if not exists image_url text,
  add column if not exists chemistry_label text,
  add column if not exists about_text text,
  add column if not exists looking_for text,
  add column if not exists activity_label text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists latest_signal_text text,
  add column if not exists latest_signal_at timestamptz,
  add column if not exists unread_count integer not null default 0,
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists discover_candidates_user_updated_idx
  on public.discover_candidates (user_id, updated_at desc);

create index if not exists discover_candidates_global_updated_idx
  on public.discover_candidates (updated_at desc)
  where user_id is null;

create table if not exists public.matches (
  user_id uuid not null,
  match_id text not null,
  target_profile_id text,
  name text not null,
  age integer,
  city text,
  image text,
  chemistry_label text,
  about_text text,
  looking_for text,
  activity_label text,
  interests text[] not null default '{}',
  latest_signal_text text,
  latest_signal_at timestamptz,
  unread_count integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_id),
  constraint matches_status_check
    check (status in ('active', 'hidden', 'archived'))
);

alter table public.matches
  add column if not exists target_profile_id text,
  add column if not exists name text,
  add column if not exists age integer,
  add column if not exists city text,
  add column if not exists image text,
  add column if not exists chemistry_label text,
  add column if not exists about_text text,
  add column if not exists looking_for text,
  add column if not exists activity_label text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists latest_signal_text text,
  add column if not exists latest_signal_at timestamptz,
  add column if not exists unread_count integer not null default 0,
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists matches_user_updated_idx
  on public.matches (user_id, updated_at desc);

create table if not exists public.messages_demo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  match_id text not null,
  sender text not null,
  message_text text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  is_read boolean not null default false,
  constraint messages_demo_sender_check
    check (sender in ('me', 'them'))
);

alter table public.messages_demo
  add column if not exists user_id uuid,
  add column if not exists match_id text,
  add column if not exists sender text,
  add column if not exists message_text text,
  add column if not exists sent_at timestamptz not null default now(),
  add column if not exists read_at timestamptz,
  add column if not exists is_read boolean not null default false;

create index if not exists messages_demo_user_sent_idx
  on public.messages_demo (user_id, sent_at asc);

create index if not exists messages_demo_user_match_sent_idx
  on public.messages_demo (user_id, match_id, sent_at asc);

grant select, insert, update on public.profiles to authenticated;
grant select on public.discover_candidates to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update on public.messages_demo to authenticated;

alter table public.profiles enable row level security;
alter table public.discover_candidates enable row level security;
alter table public.matches enable row level security;
alter table public.messages_demo enable row level security;

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

drop policy if exists "discover_candidates_select_internal" on public.discover_candidates;
create policy "discover_candidates_select_internal"
  on public.discover_candidates
  for select
  to authenticated
  using (user_id is null or user_id = auth.uid());

drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own"
  on public.matches
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "matches_insert_own" on public.matches;
create policy "matches_insert_own"
  on public.matches
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "matches_update_own" on public.matches;
create policy "matches_update_own"
  on public.matches
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "matches_delete_own" on public.matches;
create policy "matches_delete_own"
  on public.matches
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "messages_demo_select_own" on public.messages_demo;
create policy "messages_demo_select_own"
  on public.messages_demo
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "messages_demo_insert_own" on public.messages_demo;
create policy "messages_demo_insert_own"
  on public.messages_demo
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "messages_demo_update_own" on public.messages_demo;
create policy "messages_demo_update_own"
  on public.messages_demo
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'profile-images',
    'profile-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'voice-profiles',
    'voice-profiles',
    true,
    10485760,
    array['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4']
  ),
  (
    'video-presentations',
    'video-presentations',
    true,
    52428800,
    array['video/mp4', 'video/webm', 'video/quicktime']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select on storage.buckets to public;
grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "truekind_media_select_public" on storage.objects;
create policy "truekind_media_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id in ('profile-images', 'voice-profiles', 'video-presentations'));

drop policy if exists "truekind_media_insert_own" on storage.objects;
create policy "truekind_media_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('profile-images', 'voice-profiles', 'video-presentations')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "truekind_media_update_own" on storage.objects;
create policy "truekind_media_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('profile-images', 'voice-profiles', 'video-presentations')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('profile-images', 'voice-profiles', 'video-presentations')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "truekind_media_delete_own" on storage.objects;
create policy "truekind_media_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('profile-images', 'voice-profiles', 'video-presentations')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

delete from public.discover_candidates
where user_id is null
  and match_id in ('anna', 'sara', 'elin');

insert into public.discover_candidates (
  user_id,
  match_id,
  target_profile_id,
  name,
  age,
  city,
  image,
  chemistry_label,
  about_text,
  looking_for,
  activity_label,
  interests,
  latest_signal_text,
  latest_signal_at,
  unread_count,
  status,
  created_at,
  updated_at
)
values
  (
    null,
    'anna',
    'seed-profile-anna',
    'Anna',
    34,
    'Malmo',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
    'Varm, jordnara, nyfiken',
    'Tycker om djupa samtal, tydlig energi och manniskor som kanns akta direkt.',
    'Djupare kontakt',
    'Konsert',
    array['samtal', 'musik', 'narvaro'],
    '',
    null,
    0,
    'active',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00.000Z'
  ),
  (
    null,
    'sara',
    'seed-profile-sara',
    'Sara',
    29,
    'Lund',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80',
    'Lattsam, skarp, social',
    'Gillar humor, snabb kemi och manniskor som bade kan vara latta och seriosa.',
    'Nagon att lara kanna',
    'Virtuell kaffe',
    array['kaffe', 'humor', 'spontant'],
    '',
    null,
    0,
    'active',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00.000Z'
  ),
  (
    null,
    'elin',
    'seed-profile-elin',
    'Elin',
    37,
    'Helsingborg',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    'Eftertanksam, varm, kulturell',
    'Trivs bast i samtal med djup, kultur, musik och manniskor som vagar vara mjuka.',
    'Langvarig relation',
    'Bokprat',
    array['bocker', 'konserter', 'kultur'],
    '',
    null,
    0,
    'active',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00.000Z'
  );
