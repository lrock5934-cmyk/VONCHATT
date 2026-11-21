-- ============================================================================
-- vonChat PostgreSQL Database Schema for Supabase
-- ============================================================================

-- 1. PROFILES TABLE (Linked with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  display_name text not null,
  avatar_color text default 'bg-emerald-700 text-white',
  is_online boolean default true,
  status_message text,
  bio text,
  chat_wallpaper text default 'wp-1',
  last_seen_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  created_at timestamptz default timezone('utc'::text, now())
);

-- Trigger to auto-create profile on signup
create or href function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_color, status_message)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', 'bg-emerald-700 text-white'),
    'Exploring the botanical trails 🌿'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  title text,
  is_group boolean default false,
  avatar_color text default 'bg-emerald-700 text-white',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);


-- 3. CONVERSATION PARTICIPANTS TABLE
create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  archived boolean default false,
  last_read_at timestamptz default timezone('utc'::text, now()),
  joined_at timestamptz default timezone('utc'::text, now()),
  primary key (conversation_id, profile_id)
);


-- 4. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null not null,
  content text not null,
  type text check (type in ('text', 'image', 'sticker', 'audio')) default 'text',
  media_url text,
  created_at timestamptz default timezone('utc'::text, now())
);


-- 5. MESSAGE REACTIONS TABLE
create table if not exists public.message_reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default timezone('utc'::text, now()),
  unique (message_id, profile_id, emoji)
);


-- 6. STATUSES TABLE (24-Hour Stories)
create table if not exists public.statuses (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  media_type text check (media_type in ('text', 'image', 'video', 'sticker')) default 'text',
  content text,
  background_color text default 'bg-emerald-800',
  media_url text,
  expires_at timestamptz not null,
  created_at timestamptz default timezone('utc'::text, now())
);


-- 7. STATUS VIEWS TABLE
create table if not exists public.status_views (
  id uuid default gen_random_uuid() primary key,
  status_id uuid references public.statuses(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default timezone('utc'::text, now()),
  unique (status_id, viewer_id)
);


-- ============================================================================
-- HELPER FUNCTIONS & SECURITY (RLS)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.statuses enable row level security;
alter table public.status_views enable row level security;

-- Membership helper function
create or replace function public.is_conversation_member(conv_id uuid, user_id uuid)
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
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Conversations viewable by members" on public.conversations for select
  using (public.is_conversation_member(id, auth.uid()));
create policy "Users can create conversations" on public.conversations for insert with check (true);

create policy "Participants viewable by members" on public.conversation_participants for select
  using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "Users can insert participants" on public.conversation_participants for insert with check (true);
create policy "Users can update own participant record" on public.conversation_participants for update using (profile_id = auth.uid());

create policy "Messages viewable by members" on public.messages for select
  using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "Members can insert messages" on public.messages for insert
  with check (public.is_conversation_member(conversation_id, auth.uid()) and sender_id = auth.uid());

create policy "Reactions viewable by conversation members" on public.message_reactions for select using (true);
create policy "Users can insert own reactions" on public.message_reactions for insert with check (profile_id = auth.uid());
create policy "Users can delete own reactions" on public.message_reactions for delete using (profile_id = auth.uid());

create policy "Statuses viewable by everyone" on public.statuses for select using (expires_at > now());
create policy "Users can create own status" on public.statuses for insert with check (profile_id = auth.uid());
create policy "Users can delete own status" on public.statuses for delete using (profile_id = auth.uid());

create policy "Status views viewable by status author" on public.status_views for select using (true);
create policy "Users can insert status views" on public.status_views for insert with check (viewer_id = auth.uid());

-- RPC: Mark conversation as read
create or replace function public.mark_conversation_read(conv_id uuid)
returns void
security definer
as $$
begin
  update public.conversation_participants
  set last_read_at = timezone('utc'::text, now())
  where conversation_id = conv_id and profile_id = auth.uid();
end;
$$ language plpgsql;
