import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { Search, X, MessageSquare, Users, UserPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGroupModal: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onOpenGroupModal }) => {
  const { allUsers, user, createDirectChat } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const searchDb = async () => {
      const query = searchTerm.trim();
      if (!query) {
        if (isMounted) setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase.rpc('search_users_by_username', {
          search_query: query
        });

        if (!error && data) {
          if (isMounted) setSearchResults(data as Profile[]);
        } else {
          // Fallback to local filtering of allUsers if RPC fails or isn't created yet
          const clean = query.toLowerCase().replace(/^@/, '');
          const localMatch = allUsers.filter(u => 
            u.id !== user?.id && (
              u.display_name.toLowerCase().includes(clean) ||
              (u.username && u.username.toLowerCase().includes(clean))
            )
          );
          if (isMounted) setSearchResults(localMatch);
        }
      } catch (e) {
        console.error('Search error:', e);
        const clean = query.toLowerCase().replace(/^@/, '');
        const localMatch = allUsers.filter(u => 
          u.id !== user?.id && (
            u.display_name.toLowerCase().includes(clean) ||
            (u.username && u.username.toLowerCase().includes(clean))
          )
        );
        if (isMounted) setSearchResults(localMatch);
      } finally {
        if (isMounted) setSearching(false);
      }
    };

    const timer = setTimeout(searchDb, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, allUsers, user?.id]);

  if (!isOpen) return null;

  const displayList = searchTerm.trim() 
    ? searchResults 
    : allUsers.filter(u => u.id !== user?.id && u.is_discoverable !== false);

  const handleStartChat = async (targetUserId: string) => {
    await createDirectChat(targetUserId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
      <div className="bg-[#111111] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#292929] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-lg font-bold text-white">Start New Chat</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#71717A] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or @username..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
            />
            {searching && (
              <Loader2 className="absolute right-3.5 top-3 w-4 h-4 text-[#E50914] animate-spin" />
            )}
          </div>

          <button
            onClick={() => { onClose(); onOpenGroupModal(); }}
            className="w-full mb-4 p-3 bg-[#181818] border border-[#292929] rounded-xl text-sm font-semibold text-[#E50914] hover:bg-[#222222] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Create Group Chat</span>
          </button>

          <div className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2 flex items-center justify-between">
            <span>{searchTerm.trim() ? 'Search Results' : 'Discoverable Members'} ({displayList.length})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {displayList.length === 0 ? (
            <div className="text-center py-8 text-[#71717A] text-sm">
              {searching ? 'Searching database...' : `No users found matching "${searchTerm}"`}
            </div>
          ) : (
            displayList.map(u => (
              <div
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="flex items-center justify-between p-3 rounded-xl border border-[#292929] bg-[#181818] hover:bg-[#222222] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${u.avatar_color || 'bg-[#E50914] text-white'} flex items-center justify-center font-bold text-sm shadow-sm shrink-0`}>
                    {u.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-white group-hover:text-[#E50914] transition-colors flex items-center gap-1.5 truncate">
                      <span className="truncate">{u.display_name}</span>
                      {u.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914] shrink-0" />}
                    </div>
                    <div className="text-xs text-[#A1A1AA] truncate">
                      {u.username ? `@${u.username}` : 'No username'} {u.bio ? `• ${u.bio}` : ''}
                    </div>
                  </div>
                </div>
                <button className="p-2 bg-[#111111] border border-[#292929] rounded-lg text-[#E50914] group-hover:bg-[#E50914] group-hover:text-white transition-colors shadow-xs shrink-0 ml-2">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
