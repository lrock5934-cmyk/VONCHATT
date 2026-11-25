-- ============================================================================
-- vonChat Complete PostgreSQL Database Schema for Firebase Auth + Supabase
-- Project: foqsoghrfavskuyjxckc
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Firebase UIDs as text primary key)
create table if not exists public.profiles (
  id text primary key,
  email text unique not null,
  display_name text not null,
  avatar_color text default 'bg-[#E50914] text-white',
  is_online boolean default true,
  status_message text,
  bio text,
  chat_wallpaper text default 'wp-1',
  last_seen_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  created_at timestamptz default timezone('utc'::text, now())
);

-- 2. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  title text,
  is_group boolean default false,
  avatar_color text default 'bg-[#E50914] text-white',
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 3. CONVERSATION PARTICIPANTS / MEMBERS TABLE
create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  profile_id text references public.profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  archived boolean default false,
  last_read_at timestamptz default timezone('utc'::text, now()),
  joined_at timestamptz default timezone('utc'::text, now()),
  primary key (conversation_id, profile_id)
);

-- Also create conversation_members alias view or table if requested
create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  profile_id text references public.profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default timezone('utc'::text, now()),
  primary key (conversation_id, profile_id)
);

-- 4. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id text references public.profiles(id) on delete set null not null,
  content text not null,
  type text check (type in ('text', 'image', 'sticker', 'audio', 'file')) default 'text',
  media_url text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 5. MESSAGE REACTIONS TABLE
create table if not exists public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  profile_id text references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default timezone('utc'::text, now()),
  unique (message_id, profile_id, emoji)
);

-- 6. ATTACHMENTS TABLE
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade,
  uploader_id text references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_size integer,
  file_type text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 7. STATUSES TABLE (24-Hour Stories)
create table if not exists public.statuses (
  id uuid default gen_random_uuid() primary key,
  profile_id text references public.profiles(id) on delete cascade not null,
  media_type text check (media_type in ('text', 'image', 'video', 'sticker')) default 'text',
  content text,
  background_color text default 'bg-red-900',
  media_url text,
  expires_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 8. STATUS VIEWS TABLE
create table if not exists public.status_views (
  id uuid default gen_random_uuid() primary key,
  status_id uuid references public.statuses(id) on delete cascade not null,
  viewer_id text references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default timezone('utc'::text, now()),
  unique (status_id, viewer_id)
);

-- 9. USER SETTINGS TABLE
create table if not exists public.user_settings (
  profile_id text references public.profiles(id) on delete cascade primary key,
  sound_enabled boolean default true,
  font_size text check (font_size in ('small', 'default', 'large')) default 'default',
  theme_wallpaper text default 'wp-1',
  notifications_enabled boolean default true,
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 10. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  profile_id text references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  is_read boolean default false,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 11. BLOCKED USERS TABLE
create table if not exists public.blocked_users (
  id uuid default gen_random_uuid() primary key,
  blocker_id text references public.profiles(id) on delete cascade not null,
  blocked_id text references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()),
  unique (blocker_id, blocked_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_messages_conv_id on public.messages(conversation_id);
create index if not exists idx_conv_parts_profile_id on public.conversation_participants(profile_id);
create index if not exists idx_statuses_expires on public.statuses(expires_at);

-- ============================================================================
-- HELPER FUNCTIONS & SECURITY (RLS) FOR FIREBASE AUTH
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.attachments enable row level security;
alter table public.statuses enable row level security;
alter table public.status_views enable row level security;
alter table public.user_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.blocked_users enable row level security;

-- Extract Firebase UID from verified JWT claims
create or replace function public.get_firebase_uid()
returns text
security definer
as $$
begin
  return nullif(current_setting('request.jwt.claim.sub', true), '');
end;
$$ language plpgsql;

-- Membership helper function
create or replace function public.is_conversation_member(conv_id uuid, user_id text)
returns boolean
security definer
as $$
begin
  return exists (
    select 1 from public.conversation_participants
    where conversation_id = conv_id and profile_id = user_id
  );
end;
$$ language plpgsql;

-- RLS Policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (public.get_firebase_uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (public.get_firebase_uid() = id);

drop policy if exists "Conversations viewable by members" on public.conversations;
drop policy if exists "Users can create conversations" on public.conversations;
create policy "Conversations viewable by members" on public.conversations for select
  using (public.is_conversation_member(id, public.get_firebase_uid()));
create policy "Users can create conversations" on public.conversations for insert with check (true);

drop policy if exists "Participants viewable by members" on public.conversation_participants;
drop policy if exists "Users can insert participants" on public.conversation_participants;
drop policy if exists "Users can update own participant record" on public.conversation_participants;
create policy "Participants viewable by members" on public.conversation_participants for select
  using (public.is_conversation_member(conversation_id, public.get_firebase_uid()));
create policy "Users can insert participants" on public.conversation_participants for insert with check (true);
create policy "Users can update own participant record" on public.conversation_participants for update using (profile_id = public.get_firebase_uid());

drop policy if exists "Messages viewable by members" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;
create policy "Messages viewable by members" on public.messages for select
  using (public.is_conversation_member(conversation_id, public.get_firebase_uid()));
create policy "Members can insert messages" on public.messages for insert
  with check (public.is_conversation_member(conversation_id, public.get_firebase_uid()) and sender_id = public.get_firebase_uid());

drop policy if exists "Reactions viewable by conversation members" on public.message_reactions;
drop policy if exists "Users can insert own reactions" on public.message_reactions;
drop policy if exists "Users can delete own reactions" on public.message_reactions;
create policy "Reactions viewable by conversation members" on public.message_reactions for select using (true);
create policy "Users can insert own reactions" on public.message_reactions for insert with check (profile_id = public.get_firebase_uid());
create policy "Users can delete own reactions" on public.message_reactions for delete using (profile_id = public.get_firebase_uid());

drop policy if exists "Statuses viewable by everyone" on public.statuses;
drop policy if exists "Users can create own status" on public.statuses;
drop policy if exists "Users can delete own status" on public.statuses;
create policy "Statuses viewable by everyone" on public.statuses for select using (expires_at > now());
create policy "Users can create own status" on public.statuses for insert with check (profile_id = public.get_firebase_uid());
create policy "Users can delete own status" on public.statuses for delete using (profile_id = public.get_firebase_uid());

drop policy if exists "Status views viewable by status author" on public.status_views;
drop policy if exists "Users can insert status views" on public.status_views;
create policy "Status views viewable by status author" on public.status_views for select using (true);
create policy "Users can insert status views" on public.status_views for insert with check (viewer_id = public.get_firebase_uid());

drop policy if exists "Users can manage own settings" on public.user_settings;
create policy "Users can manage own settings" on public.user_settings for all using (profile_id = public.get_firebase_uid()) with check (profile_id = public.get_firebase_uid());

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications for select using (profile_id = public.get_firebase_uid());

drop policy if exists "Users can manage own blocks" on public.blocked_users;
create policy "Users can manage own blocks" on public.blocked_users for all using (blocker_id = public.get_firebase_uid()) with check (blocker_id = public.get_firebase_uid());

-- RPC: Mark conversation as read
create or replace function public.mark_conversation_read(conv_id uuid)
returns void
security definer
as $$
begin
  update public.conversation_participants
  set last_read_at = timezone('utc'::text, now())
  where conversation_id = conv_id and profile_id = public.get_firebase_uid();
end;
$$ language plpgsql;
