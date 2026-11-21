import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, Users, Pin, Star, Download, Shield, LogOut, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ContactInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({ isOpen, onClose, conversationId }) => {
  const { conversations, messages, allUsers, user, exportChatHistory, leaveGroup } = useChat();
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'pinned'>('info');

  if (!isOpen) return null;

  const conv = conversations.find(c => c.id === conversationId);
  const chatMessages = messages.filter(m => m.conversation_id === conversationId);
  const sharedMedia = chatMessages.filter(m => m.type === 'image' || m.type === 'sticker');
  const pinnedMessages = chatMessages.filter(m => m.is_pinned);

  // For 1-on-1 chat, find other participant
  const otherParticipant = !conv?.is_group 
    ? conv?.participants?.find(p => p.profile_id !== user?.id) 
    : null;
  const otherUserProfile = otherParticipant ? allUsers.find(u => u.id === otherParticipant.profile_id) : null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[380px] bg-white border-l border-[#D5E3D9] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-[#0B2316] text-white flex items-center justify-between">
        <div className="font-bold text-base">
          {conv?.is_group ? 'Group Information' : 'Contact Information'}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Card Banner */}
      <div className="p-6 bg-[#ECF3EE] border-b border-[#D5E3D9] text-center flex flex-col items-center">
        <div className={`w-20 h-20 rounded-3xl ${conv?.is_group ? conv.avatar_color : otherUserProfile?.avatar_color || 'bg-emerald-700 text-white'} flex items-center justify-center text-2xl font-bold shadow-md mb-3`}>
          {conv?.is_group ? <Users className="w-8 h-8" /> : (otherUserProfile?.display_name?.slice(0, 2).toUpperCase() || '🌿')}
        </div>
        <h2 className="text-lg font-bold text-[#112419]">{conv?.is_group ? conv.title : otherUserProfile?.display_name}</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          {conv?.is_group ? `${conv.participants?.length || 0} participants` : otherUserProfile?.email}
        </p>
        <p className="text-xs text-[#15803D] font-medium mt-1">
          {conv?.is_group ? 'Botanical Group Chat' : (otherUserProfile?.is_online ? '🟢 Online now' : `Last seen recently`)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F4F8F5] border-b border-[#D5E3D9] p-1">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'info' ? 'bg-white text-[#15803D] shadow-xs' : 'text-stone-600 hover:text-[#112419]'}`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'media' ? 'bg-white text-[#15803D] shadow-xs' : 'text-stone-600 hover:text-[#112419]'}`}
        >
          Media ({sharedMedia.length})
        </button>
        <button
          onClick={() => setActiveTab('pinned')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'pinned' ? 'bg-white text-[#15803D] shadow-xs' : 'text-stone-600 hover:text-[#112419]'}`}
        >
          Pinned ({pinnedMessages.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'info' && (
          <div className="space-y-4">
            {!conv?.is_group && otherUserProfile?.bio && (
              <div className="p-4 bg-[#F4F8F5] rounded-2xl border border-[#D5E3D9]">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">About Bio</div>
                <div className="text-sm text-[#112419]">{otherUserProfile.bio}</div>
              </div>
            )}

            {!conv?.is_group && otherUserProfile?.status_message && (
              <div className="p-4 bg-[#F4F8F5] rounded-2xl border border-[#D5E3D9]">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Status</div>
                <div className="text-sm text-[#112419]">{otherUserProfile.status_message}</div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => exportChatHistory(conversationId)}
                className="w-full p-3 bg-white border border-[#D5E3D9] rounded-xl text-sm font-medium text-[#112419] hover:bg-[#ECF3EE] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#15803D]" />
                  <span>Export Chat History</span>
                </div>
                <span className="text-xs text-stone-400">.txt</span>
              </button>

              {conv?.is_group && (
                <button
                  onClick={() => { leaveGroup(conversationId); onClose(); }}
                  className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>Leave Group</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="grid grid-cols-3 gap-2">
            {sharedMedia.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-stone-400 text-sm">
                No media files shared yet.
              </div>
            ) : (
              sharedMedia.map(m => (
                <div key={m.id} className="aspect-square rounded-xl bg-stone-100 overflow-hidden border border-[#D5E3D9] flex items-center justify-center">
                  {m.type === 'image' ? (
                    <img src={m.media_url} alt="Shared media" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{m.content}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pinned' && (
          <div className="space-y-2">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-sm">
                No pinned messages in this chat.
              </div>
            ) : (
              pinnedMessages.map(m => (
                <div key={m.id} className="p-3 bg-[#ECF3EE] rounded-xl border border-[#D5E3D9] space-y-1">
                  <div className="text-[10px] font-bold text-[#15803D] uppercase tracking-wider flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned Message
                  </div>
                  <div className="text-sm text-[#112419]">{m.content}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
