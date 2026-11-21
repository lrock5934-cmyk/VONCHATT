export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_color: string;
  is_online: boolean;
  status_message?: string;
  bio?: string;
  chat_wallpaper?: string;
  last_seen_at?: string;
  created_at?: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  profile_id: string;
  role: 'admin' | 'member';
  archived: boolean;
  last_read_at?: string;
  joined_at: string;
  profile?: Profile;
}

export interface Conversation {
  id: string;
  title?: string;
  is_group: boolean;
  avatar_color?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'sticker' | 'audio';
  media_url?: string;
  created_at: string;
  sender?: Profile;
  reactions?: MessageReaction[];
  is_pinned?: boolean;
  is_starred?: boolean;
  reply_to_id?: string;
  reply_to_message?: Message;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: Profile;
}

export interface Status {
  id: string;
  profile_id: string;
  media_type: 'text' | 'image' | 'video' | 'sticker';
  content?: string;
  background_color?: string;
  media_url?: string;
  expires_at: string;
  created_at: string;
  profile?: Profile;
  views?: StatusView[];
}

export interface Sticker {
  id: string;
  name: string;
  url: string;
  category: string;
}
