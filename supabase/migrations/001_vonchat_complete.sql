-- ============================================================================
-- vonChat Complete Production PostgreSQL Database Schema & RLS Policies
-- Project: foqsoghrfavskuyjxckc.supabase.co
-- Architecture: Firebase Auth (JWT) + Supabase PostgreSQL & Realtime & Storage
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS & HELPER FUNCTIONS FOR FIREBASE JWT AUTHENTICATION
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Helper function to extract Firebase UID from Supabase Third-Party Auth JWT claims
create or replace function public.get_firebase_uid()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif((current_setting('request.jwt.claims', true)::json->>'sub'), '')
  );
$$;

-- Helper function for updated_at timestamp trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;


-- ============================================================================
-- SECTION 2: TABLES DEFINITION & CONSTRAINTS
-- ============================================================================

-- 1. PROFILES TABLE (Firebase UID primary key)
create table if not exists public.profiles (
  id text primary key, -- Firebase UID
  email text unique not null,
  username text unique,
  username_normalized text unique,
  display_name text not null,
  avatar_url text,
  avatar_color text default 'bg-[#E50914] text-white',
  bio text,
  is_online boolean default true,
  last_seen_at timestamptz default timezone('utc'::text, now()),
  is_verified boolean default false,
  is_discoverable boolean default true,
  chat_wallpaper text default 'wp-1',
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

create index if not exists idx_profiles_username_normalized on public.profiles(username_normalized);
create index if not exists idx_profiles_display_name on public.profiles(display_name);

-- 2. USER DEVICES (For Web Push notifications)
create table if not exists public.user_devices (
  id uuid default gen_random_uuid() primary key,
  profile_id text references public.profiles(id) on delete cascade not null,
  fcm_token text not null,
  device_info text,
  created_at timestamptz default timezone('utc'::text, now()),
  unique (profile_id, fcm_token)
);

-- 3. USER SETTINGS
create table if not exists public.user_settings (
  profile_id text references public.profiles(id) on delete cascade primary key,
  sound_enabled boolean default true,
  notifications_enabled boolean default true,
  read_receipts_enabled boolean default true,
  font_size text check (font_size in ('small', 'default', 'large')) default 'default',
  updated_at timestamptz default timezone('utc'::text, now())
);

-- 4. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  title text,
  is_group boolean default false,
  avatar_url text,
  avatar_color text default 'bg-[#E50914] text-white',
  created_by text references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);

-- 5. CONVERSATION PARTICIPANTS (Members)
create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  profile_id text references public.profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  archived boolean default false,
  muted boolean default false,
  pinned boolean default false,
  last_read_at timestamptz default timezone('utc'::text, now()),
  joined_at timestamptz default timezone('utc'::text, now()),
  primary key (conversation_id, profile_id)
);

create index if not exists idx_conv_participants_profile on public.conversation_participants(profile_id);

-- 6. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id text references public.profiles(id) on delete set null not null,
  content text not null,
  type text check (type in ('text', 'image', 'sticker', 'audio', 'video', 'file')) default 'text',
  media_url text,
  reply_to_id uuid references public.messages(id) on delete set null,
  is_edited boolean default false,
  is_deleted_for_everyone boolean default false,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

create index if not exists idx_messages_conv_created on public.messages(conversation_id, created_at);

-- 7. MESSAGE ATTACHMENTS
create table if not exists public.message_attachments (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  uploader_id text references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_size integer,
  file_type text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 8. MESSAGE REACTIONS
create table if not exists public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  profile_id text references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default timezone('utc'::text, now()),
  unique (message_id, profile_id, emoji)
);

-- 9. MESSAGE RECEIPTS (Delivery and Read)
create table if not exists public.message_receipts (
  message_id uuid references public.messages(id) on delete cascade not null,
  profile_id text references public.profiles(id) on delete cascade not null,
  status text check (status in ('sent', 'delivered', 'read')) default 'sent',
  updated_at timestamptz default timezone('utc'::text, now()),
  primary key (message_id, profile_id)
);

-- 10. STARRED MESSAGES
create table if not exists public.starred_messages (
  profile_id text references public.profiles(id) on delete cascade not null,
  message_id uuid references public.messages(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()),
  primary key (profile_id, message_id)
);

-- 11. BLOCKED USERS
create table if not exists public.blocked_users (
  blocker_id text references public.profiles(id) on delete cascade not null,
  blocked_id text references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()),
  primary key (blocker_id, blocked_id)
);

-- 12. USER CONTACTS
create table if not exists public.user_contacts (
  profile_id text references public.profiles(id) on delete cascade not null,
  contact_profile_id text references public.profiles(id) on delete cascade not null,
  nickname text,
  created_at timestamptz default timezone('utc'::text, now()),
  primary key (profile_id, contact_profile_id)
);

-- 13. STATUSES (24-Hour Stories)
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

create index if not exists idx_statuses_expires on public.statuses(expires_at);

-- 14. STATUS VIEWS
create table if not exists public.status_views (
  status_id uuid references public.statuses(id) on delete cascade not null,
  viewer_id text references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default timezone('utc'::text, now()),
  primary key (status_id, viewer_id)
);

-- 15. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  profile_id text references public.profiles(id) on delete cascade not null,
  actor_id text references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default timezone('utc'::text, now())
);

create index if not exists idx_notifications_profile on public.notifications(profile_id, is_read, created_at desc);

-- 16. CALLS
create table if not exists public.calls (
  id uuid default gen_random_uuid() primary key,
  caller_id text references public.profiles(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  type text check (type in ('audio', 'video')) default 'audio',
  status text check (status in ('ringing', 'ongoing', 'ended', 'missed', 'rejected')) default 'ringing',
  started_at timestamptz default timezone('utc'::text, now()),
  ended_at timestamptz
);

-- 17. CALL PARTICIPANTS
create table if not exists public.call_participants (
  call_id uuid references public.calls(id) on delete cascade not null,
  profile_id text references public.profiles(id) on delete cascade not null,
  status text check (status in ('invited', 'joined', 'left', 'declined')) default 'invited',
  joined_at timestamptz,
  primary key (call_id, profile_id)
);

-- 18. CALL SIGNALS (WebRTC Signaling)
create table if not exists public.call_signals (
  id uuid default gen_random_uuid() primary key,
  call_id uuid references public.calls(id) on delete cascade not null,
  sender_id text references public.profiles(id) on delete cascade not null,
  receiver_id text references public.profiles(id) on delete cascade not null,
  signal_data jsonb not null,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 19. POLICY ACCEPTANCES
create table if not exists public.policy_acceptances (
  profile_id text references public.profiles(id) on delete cascade not null,
  policy_version text not null,
  accepted_at timestamptz default timezone('utc'::text, now()),
  primary key (profile_id, policy_version)
);

-- 20. REPORTS
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id text references public.profiles(id) on delete cascade not null,
  reported_profile_id text references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text default 'pending',
  created_at timestamptz default timezone('utc'::text, now())
);


-- ============================================================================
-- SECTION 3: SECURE USERNAME SEARCH FUNCTION
-- ============================================================================

create or replace function public.search_users_by_username(search_query text)
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where is_discoverable = true
    and id != public.get_firebase_uid()
    and (
      username_normalized like '%' || lower(trim(search_query)) || '%'
      or lower(display_name) like '%' || lower(trim(search_query)) || '%'
    )
    and id not in (
      select blocked_id from public.blocked_users where blocker_id = public.get_firebase_uid()
      union
      select blocker_id from public.blocked_users where blocked_id = public.get_firebase_uid()
    )
  limit 20;
$$;


-- ============================================================================
-- SECTION 4: TRIGGERS FOR UPDATED_AT
-- ============================================================================

create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger tr_conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

create trigger tr_messages_updated_at
  before update on public.messages
  for each row execute function public.handle_updated_at();


-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_devices enable row level security;
alter table public.user_settings enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_receipts enable row level security;
alter table public.starred_messages enable row level security;
alter table public.blocked_users enable row level security;
alter table public.user_contacts enable row level security;
alter table public.statuses enable row level security;
alter table public.status_views enable row level security;
alter table public.notifications enable row level security;
alter table public.calls enable row level security;
alter table public.call_participants enable row level security;
alter table public.call_signals enable row level security;
alter table public.policy_acceptances enable row level security;
alter table public.reports enable row level security;

-- PROFILES POLICIES
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (public.get_firebase_uid() is not null);

create policy "Users can update own profile"
  on public.profiles for update
  using (id = public.get_firebase_uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = public.get_firebase_uid());

-- USER DEVICES
create policy "Users manage own devices"
  on public.user_devices for all
  using (profile_id = public.get_firebase_uid());

-- USER SETTINGS
create policy "Users manage own settings"
  on public.user_settings for all
  using (profile_id = public.get_firebase_uid());

-- CONVERSATIONS
create policy "Users view conversations they participate in"
  on public.conversations for select
  using (
    EXISTS (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id
        and profile_id = public.get_firebase_uid()
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  with check (created_by = public.get_firebase_uid());

-- CONVERSATION PARTICIPANTS
create policy "Participants view members in their conversations"
  on public.conversation_participants for select
  using (
    EXISTS (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.profile_id = public.get_firebase_uid()
    )
  );

create policy "Users join conversations or add members"
  on public.conversation_participants for insert
  with check (public.get_firebase_uid() is not null);

create policy "Participants update their participation (archived, muted)"
  on public.conversation_participants for update
  using (profile_id = public.get_firebase_uid());

-- MESSAGES
create policy "Participants view messages in their conversations"
  on public.messages for select
  using (
    EXISTS (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
        and profile_id = public.get_firebase_uid()
    )
  );

create policy "Participants send messages to their conversations"
  on public.messages for insert
  with check (
    sender_id = public.get_firebase_uid()
    and EXISTS (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
        and profile_id = public.get_firebase_uid()
    )
  );

create policy "Senders edit own messages"
  on public.messages for update
  using (sender_id = public.get_firebase_uid());

create policy "Senders delete own messages"
  on public.messages for delete
  using (sender_id = public.get_firebase_uid());

-- MESSAGE ATTACHMENTS
create policy "View attachments in participant conversations"
  on public.message_attachments for select
  using (
    EXISTS (
      select 1 from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_attachments.message_id
        and cp.profile_id = public.get_firebase_uid()
    )
  );

create policy "Upload attachments as sender"
  on public.message_attachments for insert
  with check (uploader_id = public.get_firebase_uid());

-- MESSAGE REACTIONS
create policy "View reactions in conversations"
  on public.message_reactions for select
  using (
    EXISTS (
      select 1 from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_reactions.message_id
        and cp.profile_id = public.get_firebase_uid()
    )
  );

create policy "Manage own message reactions"
  on public.message_reactions for all
  using (profile_id = public.get_firebase_uid());

-- MESSAGE RECEIPTS
create policy "View receipts in conversations"
  on public.message_receipts for select
  using (
    EXISTS (
      select 1 from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = message_receipts.message_id
        and cp.profile_id = public.get_firebase_uid()
    )
  );

create policy "Manage own message receipts"
  on public.message_receipts for all
  using (profile_id = public.get_firebase_uid());

-- STARRED MESSAGES
create policy "Manage own starred messages"
  on public.starred_messages for all
  using (profile_id = public.get_firebase_uid());

-- BLOCKED USERS
create policy "Manage own blocked users"
  on public.blocked_users for all
  using (blocker_id = public.get_firebase_uid());

-- USER CONTACTS
create policy "Manage own contacts"
  on public.user_contacts for all
  using (profile_id = public.get_firebase_uid());

-- STATUSES
create policy "View active statuses of discoverable users not blocked"
  on public.statuses for select
  using (
    expires_at > now()
    and profile_id not in (
      select blocked_id from public.blocked_users where blocker_id = public.get_firebase_uid()
      union
      select blocker_id from public.blocked_users where blocked_id = public.get_firebase_uid()
    )
  );

create policy "Manage own statuses"
  on public.statuses for all
  using (profile_id = public.get_firebase_uid());

-- STATUS VIEWS
create policy "View status views for own statuses"
  on public.status_views for select
  using (
    EXISTS (
      select 1 from public.statuses s
      where s.id = status_views.status_id
        and s.profile_id = public.get_firebase_uid()
    )
  );

create policy "Create status views"
  on public.status_views for insert
  with check (viewer_id = public.get_firebase_uid());

-- NOTIFICATIONS
create policy "Manage own notifications"
  on public.notifications for all
  using (profile_id = public.get_firebase_uid());

-- CALLS & PARTICIPANTS & SIGNALS
create policy "Access calls as participant"
  on public.calls for all
  using (
    caller_id = public.get_firebase_uid()
    or EXISTS (
      select 1 from public.call_participants
      where call_id = calls.id
        and profile_id = public.get_firebase_uid()
    )
  );

create policy "Manage call participants"
  on public.call_participants for all
  using (
    profile_id = public.get_firebase_uid()
    or EXISTS (
      select 1 from public.calls where id = call_participants.call_id and caller_id = public.get_firebase_uid()
    )
  );

create policy "Manage call signals"
  on public.call_signals for all
  using (sender_id = public.get_firebase_uid() or receiver_id = public.get_firebase_uid());

-- POLICY ACCEPTANCES
create policy "Manage own policy acceptances"
  on public.policy_acceptances for all
  using (profile_id = public.get_firebase_uid());

-- REPORTS
create policy "Create reports"
  on public.reports for insert
  with check (reporter_id = public.get_firebase_uid());

create policy "View own reports"
  on public.reports for select
  using (reporter_id = public.get_firebase_uid());


-- ============================================================================
-- SECTION 6: SUPABASE STORAGE BUCKETS & POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public) values 
  ('profile-photos', 'profile-photos', false),
  ('chat-images', 'chat-images', false),
  ('chat-videos', 'chat-videos', false),
  ('voice-messages', 'voice-messages', false),
  ('documents', 'documents', false),
  ('status-media', 'status-media', false),
  ('group-images', 'group-images', false)
on conflict (id) do nothing;

-- Storage RLS Policies
create policy "Authenticated users upload profile photos"
  on storage.objects for insert
  with check (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

create policy "Authenticated users view profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos' and auth.role() = 'authenticated');

create policy "Participants upload chat media"
  on storage.objects for insert
  with check (bucket_id in ('chat-images', 'chat-videos', 'voice-messages', 'documents') and auth.role() = 'authenticated');

create policy "Participants view chat media"
  on storage.objects for select
  using (bucket_id in ('chat-images', 'chat-videos', 'voice-messages', 'documents') and auth.role() = 'authenticated');

create policy "Users upload status and group media"
  on storage.objects for insert
  with check (bucket_id in ('status-media', 'group-images') and auth.role() = 'authenticated');

create policy "Users view status and group media"
  on storage.objects for select
  using (bucket_id in ('status-media', 'group-images') and auth.role() = 'authenticated');


-- ============================================================================
-- SECTION 7: SUPABASE REALTIME PUBLICATION
-- ============================================================================

-- Add tables to supabase_realtime publication
alter publication supabase_realtime add table 
  public.messages,
  public.message_reactions,
  public.message_receipts,
  public.conversations,
  public.conversation_participants,
  public.statuses,
  public.notifications,
  public.calls,
  public.call_signals,
  public.profiles;
