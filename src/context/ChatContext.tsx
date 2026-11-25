import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Profile, Conversation, Message, Status, Sticker } from '../types';
import { supabase, isSupabaseConfigured, setSupabaseAuthToken } from '../lib/supabase';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged, 
  User 
} from '../lib/firebase';
import { playMessagePop } from '../lib/audio';

interface ChatContextType {
  user: Profile | null;
  firebaseUser: User | null;
  loading: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: Conversation[];
  messages: Message[];
  statuses: Status[];
  typingUsers: Record<string, string[]>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  fontSize: 'small' | 'default' | 'large';
  setFontSize: (size: 'small' | 'default' | 'large') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: 'chats' | 'archived';
  setActiveTab: (tab: 'chats' | 'archived') => void;
  replyToMessage: Message | null;
  setReplyToMessage: (msg: Message | null) => void;

  // Actions
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  sendMessage: (content: string, type?: 'text' | 'image' | 'sticker' | 'audio', mediaUrl?: string) => Promise<void>;
  sendReaction: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  starMessage: (messageId: string) => Promise<void>;
  exportChatHistory: (conversationId: string) => void;
  createDirectChat: (targetProfileId: string) => Promise<string>;
  createGroupChat: (title: string, memberIds: string[], avatarColor?: string) => Promise<string>;
  toggleArchive: (conversationId: string, archived: boolean) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  addParticipants: (conversationId: string, profileIds: string[]) => Promise<void>;
  publishStatus: (mediaType: 'text' | 'image' | 'sticker', content?: string, bgColor?: string, mediaUrl?: string) => Promise<void>;
  viewStatus: (statusId: string) => Promise<void>;
  deleteStatus: (statusId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  allUsers: Profile[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'small' | 'default' | 'large'>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chats' | 'archived'>('chats');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Handle Google redirect result on mount
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const fUser = result.user;
        await supabase.from('profiles').upsert({
          id: fUser.uid,
          email: fUser.email || '',
          display_name: fUser.displayName || fUser.email?.split('@')[0] || 'Google User',
          avatar_color: 'bg-[#E50914] text-white',
          is_online: true,
          status_message: 'Online via Google Auth 🔥'
        });
      }
    }).catch((err) => {
      console.error('Google Redirect result error:', err);
    });
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const token = await fUser.getIdToken();
          setSupabaseAuthToken(token);
          await fetchUserData(fUser);
        } catch (e) {
          console.error('Error setting auth token:', e);
          setLoading(false);
        }
      } else {
        setSupabaseAuthToken(null);
        setUser(null);
        setConversations([]);
        setMessages([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (fUser: User) => {
    try {
      setLoading(true);
      // 1. Fetch or sync profile in Supabase using Firebase UID (`fUser.uid`)
      let { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', fUser.uid)
        .single();

      if (profileErr || !profileData) {
        const newProf = {
          id: fUser.uid,
          email: fUser.email || '',
          display_name: fUser.displayName || fUser.email?.split('@')[0] || 'User',
          avatar_color: 'bg-[#E50914] text-white',
          is_online: true,
          status_message: 'Online in Liquid Glass 🔥'
        };
        await supabase.from('profiles').upsert(newProf);
        profileData = newProf;
      }

      setUser(profileData);

      // 2. Fetch all profiles for directory
      const { data: profilesList } = await supabase.from('profiles').select('*');
      if (profilesList) setAllUsers(profilesList);

      // 3. Fetch conversations
      const { data: participantsData } = await supabase
        .from('conversation_participants')
        .select('conversation_id, archived, role, last_read_at')
        .eq('profile_id', fUser.uid);

      if (participantsData && participantsData.length > 0) {
        const convIds = participantsData.map(p => p.conversation_id);
        const { data: convsData } = await supabase
          .from('conversations')
          .select('*')
          .in('id', convIds)
          .order('updated_at', { ascending: false });

        if (convsData) {
          const enrichedConvs = await Promise.all(convsData.map(async c => {
            const { data: parts } = await supabase
              .from('conversation_participants')
              .select('*')
              .eq('conversation_id', c.id);

            const partsWithProfiles = (parts || []).map(p => ({
              ...p,
              profile: profilesList?.find(u => u.id === p.profile_id)
            }));

            const { data: lastMsg } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', c.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...c,
              participants: partsWithProfiles,
              last_message: lastMsg || undefined
            };
          }));

          setConversations(enrichedConvs);
        }
      } else {
        setConversations([]);
      }

      // 4. Fetch active statuses
      const { data: statusesData } = await supabase
        .from('statuses')
        .select('*, profiles(*)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (statusesData) {
        const mappedStatuses = statusesData.map(s => ({
          ...s,
          profile: s.profiles
        }));
        setStatuses(mappedStatuses);
      }

    } catch (e) {
      console.error('Error fetching user data from Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId || !firebaseUser) return;

    const fetchMessages = async () => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, profiles(*), message_reactions(*)')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (msgs) {
        const formatted = msgs.map(m => ({
          ...m,
          sender: m.profiles,
          reactions: m.message_reactions || []
        }));
        setMessages(formatted);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`public:messages:conv=eq.${activeConversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversationId}` }, payload => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          if (soundEnabled && newMsg.sender_id !== firebaseUser?.uid) playMessagePop();
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, firebaseUser?.uid, soundEnabled]);

  const signIn = async (email: string, pass: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, normalizedEmail, pass);
      return { error: null };
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return { error: new Error('Incorrect email or password. Please check your details or reset your password.') };
      }
      return { error };
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
      if (cred.user) {
        await supabase.from('profiles').upsert({
          id: cred.user.uid,
          email: cred.user.email || normalizedEmail,
          display_name: name,
          avatar_color: 'bg-[#E50914] text-white',
          is_online: true,
          status_message: 'Online in Liquid Glass 🔥'
        });
      }
      return { error: null };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        return { error: new Error('An account with this email already exists. Please sign in instead.') };
      }
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fUser = result.user;
        if (fUser) {
          await supabase.from('profiles').upsert({
            id: fUser.uid,
            email: fUser.email || '',
            display_name: fUser.displayName || fUser.email?.split('@')[0] || 'Google User',
            avatar_color: 'bg-[#E50914] text-white',
            is_online: true,
            status_message: 'Online via Google Auth 🔥'
          });
        }
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/popup-closed-by-user' || popupErr.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, googleProvider);
        } else {
          throw popupErr;
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await sendPasswordResetEmail(auth, normalizedEmail);
      return { error: null };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return { error: new Error('No account found with this email address.') };
      }
      return { error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setSupabaseAuthToken(null);
    setUser(null);
    setFirebaseUser(null);
    setConversations([]);
    setMessages([]);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await supabase.from('profiles').update(updates).eq('id', user.id);
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'sticker' | 'audio' = 'text', mediaUrl?: string) => {
    if (!activeConversationId || !firebaseUser) return;

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      sender_id: firebaseUser.uid,
      content,
      type,
      media_url: mediaUrl
    }).select().single();

    if (!error && data) {
      const newMsg: Message = {
        ...data,
        sender: user || undefined,
        reactions: [],
        reply_to_id: replyToMessage?.id,
        reply_to_message: replyToMessage || undefined
      };
      setMessages(prev => [...prev, newMsg]);
      setConversations(prev => prev.map(c => c.id === activeConversationId ? {
        ...c,
        last_message: newMsg,
        updated_at: new Date().toISOString()
      } : c));
      setReplyToMessage(null);
      if (soundEnabled) playMessagePop();
    }
  };

  const sendReaction = async (messageId: string, emoji: string) => {
    if (!firebaseUser) return;
    const { data } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('profile_id', firebaseUser.uid)
      .eq('emoji', emoji)
      .single();

    if (data) {
      await supabase.from('message_reactions').delete().eq('id', data.id);
    } else {
      await supabase.from('message_reactions').insert({
        message_id: messageId,
        profile_id: firebaseUser.uid,
        emoji
      });
    }

    const { data: updatedReactions } = await supabase
      .from('message_reactions')
      .select('*, profiles(*)')
      .eq('message_id', messageId);

    if (updatedReactions) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updatedReactions } : m));
    }
  };

  const pinMessage = async (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned: !m.is_pinned } : m));
  };

  const starMessage = async (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: !m.is_starred } : m));
  };

  const exportChatHistory = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    const chatMsgs = messages.filter(m => m.conversation_id === conversationId);
    const text = chatMsgs.map(m => `[${new Date(m.created_at).toLocaleString()}] ${m.sender?.display_name || 'User'}: ${m.content}`).join('\n');
    const blob = new Blob([`Chat Export: ${conv?.title}\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vonChat-${conv?.title || 'export'}.txt`;
    a.click();
  };

  const createDirectChat = async (targetProfileId: string): Promise<string> => {
    if (!firebaseUser) return '';
    const targetUser = allUsers.find(u => u.id === targetProfileId);
    if (!targetUser) return '';

    const existing = conversations.find(c => !c.is_group && c.participants?.some(p => p.profile_id === targetProfileId));
    if (existing) {
      setActiveConversationId(existing.id);
      return existing.id;
    }

    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ title: targetUser.display_name, is_group: false, avatar_color: targetUser.avatar_color })
      .select()
      .single();

    if (convErr || !conv) return '';

    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, profile_id: firebaseUser.uid, role: 'member' },
      { conversation_id: conv.id, profile_id: targetProfileId, role: 'member' }
    ]);

    const newConv: Conversation = {
      ...conv,
      participants: [
        { conversation_id: conv.id, profile_id: firebaseUser.uid, role: 'member', archived: false, joined_at: new Date().toISOString() },
        { conversation_id: conv.id, profile_id: targetProfileId, role: 'member', archived: false, joined_at: new Date().toISOString(), profile: targetUser }
      ],
      unread_count: 0
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(conv.id);
    return conv.id;
  };

  const createGroupChat = async (title: string, memberIds: string[], avatarColor = 'bg-[#E50914] text-white'): Promise<string> => {
    if (!firebaseUser) return '';

    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ title, is_group: true, avatar_color: avatarColor, created_by: firebaseUser.uid })
      .select()
      .single();

    if (convErr || !conv) return '';

    const allParticipants = [firebaseUser.uid, ...memberIds];
    const participantRows = allParticipants.map(pid => ({
      conversation_id: conv.id,
      profile_id: pid,
      role: pid === firebaseUser.uid ? 'admin' : 'member'
    }));

    await supabase.from('conversation_participants').insert(participantRows);

    const participantsList = allParticipants.map(pid => ({
      conversation_id: conv.id,
      profile_id: pid,
      role: pid === firebaseUser.uid ? 'admin' : 'member' as 'admin' | 'member',
      archived: false,
      joined_at: new Date().toISOString(),
      profile: allUsers.find(u => u.id === pid)
    }));

    const newConv: Conversation = {
      ...conv,
      participants: participantsList,
      unread_count: 0
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(conv.id);
    return conv.id;
  };

  const toggleArchive = async (conversationId: string, archived: boolean) => {
    if (!firebaseUser) return;
    await supabase
      .from('conversation_participants')
      .update({ archived })
      .eq('conversation_id', conversationId)
      .eq('profile_id', firebaseUser.uid);

    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        participants: c.participants?.map(p => p.profile_id === firebaseUser.uid ? { ...p, archived } : p)
      };
    }));
  };

  const leaveGroup = async (conversationId: string) => {
    if (!firebaseUser) return;
    await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('profile_id', firebaseUser.uid);

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeConversationId === conversationId) setActiveConversationId(null);
  };

  const addParticipants = async (conversationId: string, profileIds: string[]) => {
    const rows = profileIds.map(pid => ({
      conversation_id: conversationId,
      profile_id: pid,
      role: 'member'
    }));
    await supabase.from('conversation_participants').insert(rows);

    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      const newParts = profileIds.map(pid => ({
        conversation_id: conversationId,
        profile_id: pid,
        role: 'member' as const,
        archived: false,
        joined_at: new Date().toISOString(),
        profile: allUsers.find(u => u.id === pid)
      }));
      return { ...c, participants: [...(c.participants || []), ...newParts] };
    }));
  };

  const publishStatus = async (mediaType: 'text' | 'image' | 'sticker', content?: string, bgColor = 'bg-red-900', mediaUrl?: string) => {
    if (!firebaseUser) return;
    const expiresAt = new Date(Date.now() + 86400000).toISOString();

    const { data, error } = await supabase.from('statuses').insert({
      profile_id: firebaseUser.uid,
      media_type: mediaType,
      content,
      background_color: bgColor,
      media_url: mediaUrl,
      expires_at: expiresAt
    }).select().single();

    if (!error && data) {
      const newStatus: Status = {
        ...data,
        profile: user || undefined,
        views: []
      };
      setStatuses(prev => [newStatus, ...prev]);
    }
  };

  const viewStatus = async (statusId: string) => {
    if (!firebaseUser) return;
    await supabase.from('status_views').upsert({
      status_id: statusId,
      viewer_id: firebaseUser.uid
    }, { onConflict: 'status_id,viewer_id' });
  };

  const deleteStatus = async (statusId: string) => {
    await supabase.from('statuses').delete().eq('id', statusId);
    setStatuses(prev => prev.filter(s => s.id !== statusId));
  };

  const setTyping = useCallback((isTyping: boolean) => {
    if (!activeConversationId || !user) return;
    setTypingUsers(prev => {
      const current = prev[activeConversationId] || [];
      if (isTyping && !current.includes(user.display_name)) {
        return { ...prev, [activeConversationId]: [...current, user.display_name] };
      } else if (!isTyping && current.includes(user.display_name)) {
        return { ...prev, [activeConversationId]: current.filter(n => n !== user.display_name) };
      }
      return prev;
    });
  }, [activeConversationId, user]);

  return (
    <ChatContext.Provider value={{
      user,
      firebaseUser,
      loading,
      activeConversationId,
      setActiveConversationId,
      conversations,
      messages,
      statuses,
      typingUsers,
      soundEnabled,
      setSoundEnabled,
      fontSize,
      setFontSize,
      searchQuery,
      setSearchQuery,
      activeTab,
      setActiveTab,
      replyToMessage,
      setReplyToMessage,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      signOut,
      updateProfile,
      sendMessage,
      sendReaction,
      pinMessage,
      starMessage,
      exportChatHistory,
      createDirectChat,
      createGroupChat,
      toggleArchive,
      leaveGroup,
      addParticipants,
      publishStatus,
      viewStatus,
      deleteStatus,
      setTyping,
      allUsers
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
