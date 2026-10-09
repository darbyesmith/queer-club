-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  age int,
  height_in int, -- total inches, e.g. 5'7" = 67
  single boolean,
  identity text, -- 'women' | 'men' | 'nonbinary' | null (prefer not to say)
  interested_in text[],
  country text,
  city text,
  neighborhood text,
  occupation text,
  languages text,
  social_handle text,
  about text,
  interests text[],
  photo_url text, -- primary photo, kept in sync with photos[0]
  photos text[], -- up to 5 gallery photos
  video_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Looks up the current user's own identity, bypassing RLS for just this
-- lookup (security definer) so the select policy below can check it
-- without recursively re-evaluating itself against the profiles table.
create or replace function public.my_identity()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select identity from public.profiles where id = auth.uid()
$$;

-- A profile is visible to: its owner, anyone if it has no "interested in"
-- preference set or that preference includes "everyone", or viewers whose
-- own identity matches what the profile owner is interested in.
create policy "Profiles are viewable based on interest match"
  on public.profiles for select
  using (
    auth.uid() = id
    or interested_in is null
    or 'everyone' = any(interested_in)
    or public.my_identity() = any(interested_in)
  );

-- Members can only create/update their own row.
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Storage bucket for uploaded profile photos.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Direct messages between members.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists messages_recipient_idx on public.messages(recipient_id);

alter table public.messages enable row level security;

create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can mark messages as read"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Favorited conversations, pinned to the top of the Messages page.
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  favorite_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, favorite_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);
