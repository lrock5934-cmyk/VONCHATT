import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Flame, Search, Plus, Archive, MessageSquare, Settings, Users, Sparkles } from 'lucide-react';

interface SidebarProps {
  onOpenProfile: () => void;
  onOpenNewChat: () => void;
  onOpenGroupModal: () => void;
  onOpenSearch: () => void;
  onOpenStatusComposer: () => void;
  onOpenStatusViewer: (statusId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenProfile,
  onOpenNewChat,
  onOpenGroupModal,
  onOpenSearch,
  onOpenStatusComposer,
  onOpenStatusViewer
}) => {
  const {
    user,
    conversations,
    activeConversationId,
    setActiveConversationId,
    statuses,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    toggleArchive,
    typingUsers
  } = useChat();

  const totalUnreadChats = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const archivedCount = conversations.filter(c => c.participants?.some(p => p.profile_id === user?.id && p.archived)).length;

  const filteredConversations = conversations.filter(c => {
    const isArchived = c.participants?.some(p => p.profile_id === user?.id && p.archived);
    if (activeTab === 'archived' && !isArchived) return false;
    if (activeTab === 'chats' && isArchived) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = c.title?.toLowerCase().includes(q);
    const msgMatch = c.last_message?.content?.toLowerCase().includes(q);
    return titleMatch || msgMatch;
  });

  return (
    <aside className="w-full md:w-[340px] lg:w-[360px] liquid-glass flex flex-col h-full shrink-0 select-none text-white border-r border-white/10 relative">
      {/* Ambient Red Glow */}
      <div className="absolute top-0 left-1/4 w-48 h-48 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="p-4 bg-[#0A0A0A]/80 backdrop-blur-md text-white flex items-center justify-between border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] to-[#FF303B] flex items-center justify-center text-white shadow-lg shadow-[#E50914]/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">vonChat</h1>
            <div className="text-[11px] text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse shadow-sm shadow-[#E50914]" />
              <span>Obsidian Glass</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSearch}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#A1A1AA] hover:text-white cursor-pointer"
            title="Search Messages (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewChat}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#A1A1AA] hover:text-white cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenProfile}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#A1A1AA] hover:text-white cursor-pointer"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Strip (Stories) */}
      <div className="p-3 bg-black/40 backdrop-blur-sm border-b border-white/10 overflow-x-auto flex items-center gap-3 scrollbar-none relative z-10">
        {/* Own Status Tile */}
        <div
          onClick={onOpenStatusComposer}
          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl liquid-glass-card text-white flex items-center justify-center relative shadow-sm group-hover:scale-105 transition-transform border-2 border-dashed border-[#E50914]">
            <Plus className="w-5 h-5 text-[#E50914]" />
          </div>
          <span className="text-[11px] font-semibold text-[#A1A1AA]">Add Story</span>
        </div>

        {statuses.map(st => (
          <div
            key={st.id}
            onClick={() => onOpenStatusViewer(st.id)}
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-tr from-[#E50914] to-[#FF303B] shadow-lg shadow-[#E50914]/20 group-hover:scale-105 transition-transform">
              <div className={`w-full h-full rounded-[14px] ${st.profile?.avatar_color || 'bg-[#181818] text-white'} flex items-center justify-center font-bold text-xs`}>
                {st.profile?.display_name?.slice(0, 2).toUpperCase() || '🔥'}
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#A1A1AA] truncate max-w-[56px]">
              {st.profile?.display_name?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs & Search Filter */}
      <div className="p-3 bg-black/25 backdrop-blur-sm space-y-3 border-b border-white/10 relative z-10">
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'chats' ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30' : 'text-[#A1A1AA] hover:text-white'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats</span>
            {totalUnreadChats > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-[#E50914] text-[10px] rounded-full font-mono font-bold">
                {totalUnreadChats}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'archived' ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30' : 'text-[#A1A1AA] hover:text-white'}`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
            {archivedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full font-mono">
                {archivedCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 liquid-glass-input rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 relative z-10">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 text-[#71717A] text-xs">
            No conversations found. Start a new chat!
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            const isArchived = conv.participants?.some(p => p.profile_id === user?.id && p.archived);
            const typingNames = typingUsers[conv.id] || [];

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group relative ${isActive ? 'liquid-glass-card shadow-lg shadow-[#E50914]/10 border-[#E50914]/40' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl ${conv.avatar_color || 'bg-[#181818] text-white'} border border-white/10 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm relative`}>
                    {conv.is_group ? <Users className="w-5 h-5 text-[#E50914]" /> : conv.title?.slice(0, 2).toUpperCase()}
                    {!conv.is_group && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#E50914] border-2 border-[#111111] rounded-full shadow-sm shadow-[#E50914]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-sm text-white truncate">
                        {conv.title}
                      </span>
                      <span className="text-[10px] text-[#71717A] font-mono shrink-0">
                        {conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="text-xs text-[#A1A1AA] truncate flex items-center gap-1">
                      {typingNames.length > 0 ? (
                        <span className="text-[#E50914] font-medium animate-pulse">
                          {typingNames.join(', ')} is typing...
                        </span>
                      ) : (
                        <span>{conv.last_message?.content || 'No messages yet'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                  {(conv.unread_count || 0) > 0 && (
                    <span className="px-2 py-0.5 bg-[#E50914] text-white text-[10px] font-bold rounded-full font-mono shadow-md shadow-[#E50914]/40">
                      {conv.unread_count}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleArchive(conv.id, !isArchived); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#71717A] hover:text-white transition-opacity"
                    title={isArchived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Profile Footer */}
      <div
        onClick={onOpenProfile}
        className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${user?.avatar_color || 'bg-[#181818] text-white'} border border-white/10 flex items-center justify-center font-bold text-sm shadow-sm`}>
            {user?.display_name?.slice(0, 2).toUpperCase() || '🔥'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-white truncate">{user?.display_name}</div>
            <div className="text-xs text-[#71717A] truncate">{user?.status_message || 'Liquid Glass Obsidian'}</div>
          </div>
        </div>
        <Settings className="w-4 h-4 text-[#71717A]" />
      </div>
    </aside>
  );
};
