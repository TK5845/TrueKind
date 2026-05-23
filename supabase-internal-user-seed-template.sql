-- Optional TrueKind internal user seed.
-- 1. Create or log in with an internal test account in the app.
-- 2. Copy that user's auth.users.id from Supabase.
-- 3. Replace the UUID below.
-- 4. Run this file in the Supabase SQL editor.
--
-- Running this file with the placeholder UUID inserts no rows.

with settings as (
  select '00000000-0000-0000-0000-000000000000'::uuid as user_id
),
test_user as (
  select auth.users.id as user_id, auth.users.email
  from auth.users
  join settings on settings.user_id = auth.users.id
),
upsert_profile as (
  insert into public.profiles (
    id,
    email,
    first_name,
    name,
    age,
    city,
    looking_for,
    contact_intent,
    activity_interest,
    interests,
    bio,
    prompt,
    favorite_song,
    favorite_film,
    favorite_book,
    image_url,
    voice_url,
    video_url,
    updated_at
  )
  select
    test_user.user_id,
    test_user.email,
    'Intern',
    'Intern Testare',
    '35',
    'Malmo',
    'Djupare kontakt',
    'Karlek',
    'Virtuell kaffe',
    array['samtal', 'musik', 'kaffe'],
    'Intern testprofil for upprepade TrueKind-floden.',
    'Jag testar varme, kontakt och stabila floden i lugn takt.',
    'Testlaten',
    'Testfilmen',
    'Testboken',
    null,
    null,
    null,
    now()
  from test_user
  on conflict (id) do update
  set
    email = excluded.email,
    first_name = excluded.first_name,
    name = excluded.name,
    age = excluded.age,
    city = excluded.city,
    looking_for = excluded.looking_for,
    contact_intent = excluded.contact_intent,
    activity_interest = excluded.activity_interest,
    interests = excluded.interests,
    bio = excluded.bio,
    prompt = excluded.prompt,
    favorite_song = excluded.favorite_song,
    favorite_film = excluded.favorite_film,
    favorite_book = excluded.favorite_book,
    updated_at = excluded.updated_at
  returning id
),
clear_existing as (
  delete from public.messages_demo
  using test_user
  where messages_demo.user_id = test_user.user_id
    and messages_demo.match_id in ('anna', 'sara')
  returning messages_demo.id
),
seed_matches as (
  insert into public.matches (
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
  select
    test_user.user_id,
    seed.match_id,
    seed.target_profile_id,
    seed.name,
    seed.age,
    seed.city,
    seed.image,
    seed.chemistry_label,
    seed.about_text,
    seed.looking_for,
    seed.activity_label,
    seed.interests,
    seed.latest_signal_text,
    seed.latest_signal_at,
    seed.unread_count,
    'active',
    seed.created_at,
    seed.updated_at
  from test_user
  cross join (
    values
      (
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
        'Hur ser en riktigt bra kvall ut for dig?',
        '2026-01-10T09:31:00.000Z'::timestamptz,
        1,
        '2026-01-01T00:00:00.000Z'::timestamptz,
        '2026-01-10T09:31:00.000Z'::timestamptz
      ),
      (
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
        'Jag hade garna tagit den dar virtuella kaffen.',
        '2026-01-09T18:11:00.000Z'::timestamptz,
        0,
        '2026-01-01T00:00:00.000Z'::timestamptz,
        '2026-01-09T18:11:00.000Z'::timestamptz
      )
  ) as seed (
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
    created_at,
    updated_at
  )
  on conflict (user_id, match_id) do update
  set
    target_profile_id = excluded.target_profile_id,
    name = excluded.name,
    age = excluded.age,
    city = excluded.city,
    image = excluded.image,
    chemistry_label = excluded.chemistry_label,
    about_text = excluded.about_text,
    looking_for = excluded.looking_for,
    activity_label = excluded.activity_label,
    interests = excluded.interests,
    latest_signal_text = excluded.latest_signal_text,
    latest_signal_at = excluded.latest_signal_at,
    unread_count = excluded.unread_count,
    status = excluded.status,
    updated_at = excluded.updated_at
  returning user_id, match_id
)
insert into public.messages_demo (
  user_id,
  match_id,
  sender,
  message_text,
  sent_at,
  read_at,
  is_read
)
select
  seed_matches.user_id,
  message_seed.match_id,
  message_seed.sender,
  message_seed.message_text,
  message_seed.sent_at,
  message_seed.read_at,
  message_seed.is_read
from seed_matches
join (
  values
    (
      'anna',
      'them',
      'Hej! Jag sag att du gillar djupa samtal.',
      '2026-01-10T09:18:00.000Z'::timestamptz,
      null::timestamptz,
      false
    ),
    (
      'anna',
      'me',
      'Ja, absolut. Hellre akta an bara smaprat.',
      '2026-01-10T09:24:00.000Z'::timestamptz,
      '2026-01-10T09:24:00.000Z'::timestamptz,
      true
    ),
    (
      'anna',
      'them',
      'Hur ser en riktigt bra kvall ut for dig?',
      '2026-01-10T09:31:00.000Z'::timestamptz,
      null::timestamptz,
      false
    ),
    (
      'sara',
      'them',
      'Du verkar ha en lugn energi.',
      '2026-01-09T18:02:00.000Z'::timestamptz,
      '2026-01-09T18:02:00.000Z'::timestamptz,
      true
    ),
    (
      'sara',
      'me',
      'Tack, det tar jag som en komplimang.',
      '2026-01-09T18:06:00.000Z'::timestamptz,
      '2026-01-09T18:06:00.000Z'::timestamptz,
      true
    ),
    (
      'sara',
      'them',
      'Jag hade garna tagit den dar virtuella kaffen.',
      '2026-01-09T18:11:00.000Z'::timestamptz,
      '2026-01-09T18:11:00.000Z'::timestamptz,
      true
    )
) as message_seed (
  match_id,
  sender,
  message_text,
  sent_at,
  read_at,
  is_read
) on message_seed.match_id = seed_matches.match_id;
