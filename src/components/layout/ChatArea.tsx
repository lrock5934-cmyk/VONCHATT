import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { Send, Smile, Paperclip, Phone, Video, Info, Volume2, VolumeX, Search, ArrowLeft, CheckCheck, Flame, Pin, Star, CornerDownRight, X, Image as ImageIcon } from 'lucide-react';
import { StickerPicker } from '../stickers/StickerPicker';
import { NATURE_WALLPAPERS } from '../../lib/stickers';
import { ContactInfoDrawer } from '../modals/ContactInfoDrawer';
import { MediaLightboxModal } from '../modals/MediaLightboxModal';

interface ChatAreaProps {
  onOpenGroupDetails: (convId: string) => void;
  onOpenSearch: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😮', '😢', '🙏', '⚡'];

export const ChatArea: React.FC<ChatAreaProps> = ({ onOpenGroupDetails, onOpenSearch }) => {
  const {
    activeConversationId,
    setActiveConversationId,
    conversations,
    messages,
    user,
    sendMessage,
    sendReaction,
    pinMessage,
    starMessage,
    soundEnabled,
    setSoundEnabled,
    fontSize,
    setTyping,
    typingUsers,
    replyToMessage,
    setReplyToMessage,
    allUsers
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages = messages.filter(m => m.conversation_id === activeConversationId);
  const pinnedMessages = activeMessages.filter(m => m.is_pinned);
  const typingNames = activeConversationId ? (typingUsers[activeConversationId] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setTyping(true);
    const timeout = setTimeout(() => setTyping(false), 2000);
    return () => clearTimeout(timeout);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await sendMessage(inputText, 'text');
    setInputText('');
    setTyping(false);
  };

  const handleSelectSticker = async (stickerUrl: string) => {
    await sendMessage(stickerUrl, 'sticker');
    setShowStickerPicker(false);
  };

  const wallpaperClass = NATURE_WALLPAPERS.find(w => w.id === user?.chat_wallpaper)?.value || NATURE_WALLPAPERS[0].value;
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm';

  const otherParticipant = !activeConv?.is_group ? activeConv?.participants?.find(p => p.profile_id !== user?.id) : null;
  const otherUserProfile = otherParticipant ? allUsers.find(u => u.id === otherParticipant.profile_id) : null;

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0A0A0A] text-[#71717A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#E50914_0%,transparent_70%)] opacity-10 pointer-events-none" />
        <div className="w-16 h-16 rounded-3xl liquid-glass-card flex items-center justify-center text-[#E50914] mb-4 shadow-xl relative z-10">
          <Flame className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1 relative z-10">vonChat Liquid Glass</h2>
        <p className="text-sm max-w-sm text-center text-[#A1A1AA] relative z-10">
          Select a conversation from the sidebar or start a new chat to begin messaging in obsidian red.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full relative ${wallpaperClass}`}>
      {/* Ambient Red Glow */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Chat Header */}
      <div
        onClick={() => setShowInfoDrawer(true)}
        className="p-4 bg-[#111111]/75 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shadow-lg z-20 cursor-pointer hover:bg-[#111111]/90 transition-colors text-white"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveConversationId(null); }}
            className="md:hidden p-2 text-[#A1A1AA] hover:bg-white/10 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`w-11 h-11 rounded-2xl ${activeConv.avatar_color || otherUserProfile?.avatar_color || 'bg-[#181818] text-white'} border border-white/10 flex items-center justify-center font-bold text-sm shadow-md`}>
            {activeConv.is_group ? '🔥' : activeConv.title?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-base text-white">{activeConv.title}</div>
            <div className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
              {typingNames.length > 0 ? (
                <span className="text-[#E50914] font-medium animate-pulse">
                  {typingNames.join(', ')} is typing...
                </span>
              ) : activeConv.is_group ? (
                <span>{activeConv.participants?.length || 0} participants</span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${otherUserProfile?.is_online ? 'bg-[#E50914] shadow-sm shadow-[#E50914]' : 'bg-[#71717A]'}`} />
                  <span>{otherUserProfile?.is_online ? 'Online' : 'Last seen recently'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 hover:bg-white/10 text-[#A1A1AA] hover:text-white rounded-xl transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#E50914]" /> : <VolumeX className="w-4 h-4 text-[#71717A]" />}
          </button>
          <button
            onClick={onOpenSearch}
            className="p-2.5 hover:bg-white/10 text-[#A1A1AA] hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowInfoDrawer(true)}
            className="p-2.5 hover:bg-white/10 text-[#A1A1AA] hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Contact Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-[#111111]/80 backdrop-blur-md border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white relative z-10">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
            <span className="font-semibold text-[#E50914]">Pinned:</span>
            <span className="truncate text-[#A1A1AA]">{pinnedMessages[0].content}</span>
          </div>
          <span className="text-[10px] text-[#71717A] font-mono shrink-0">
            {pinnedMessages.length} pinned
          </span>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative z-10">
        {activeMessages.length === 0 ? (
          <div className="text-center py-16 text-[#71717A] text-sm">
            No messages yet. Send a greeting to start the conversation! 🔥
          </div>
        ) : (
          activeMessages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            const senderName = activeConv.is_group && !isMe ? (msg.sender?.display_name || 'Member') : null;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                <div className={`max-w-[80%] md:max-w-[65%] rounded-2xl p-4 shadow-lg relative ${fontSizeClass} ${isMe ? 'bg-gradient-to-r from-[#E50914] to-[#8B0000] text-white rounded-tr-none shadow-[#E50914]/20 border border-white/10' : 'liquid-glass-card text-white rounded-tl-none'}`}>
                  {senderName && (
                    <div className="text-xs font-bold text-[#FF303B] mb-1">{senderName}</div>
                  )}

                  {msg.reply_to_message && (
                    <div className="mb-2 p-2 rounded-xl bg-black/40 border-l-2 border-[#E50914] text-xs opacity-90">
                      <div className="font-semibold text-[#FF303B]">{msg.reply_to_message.sender?.display_name || 'Replied message'}</div>
                      <div className="truncate text-[#A1A1AA]">{msg.reply_to_message.content}</div>
                    </div>
                  )}

                  {msg.type === 'sticker' ? (
                    <div className="text-5xl py-2">{msg.content}</div>
                  ) : msg.type === 'image' ? (
                    <div className="space-y-2 cursor-pointer" onClick={() => setLightboxMediaUrl(msg.media_url || null)}>
                      <img src={msg.media_url} alt="Shared media" className="rounded-xl max-h-64 object-cover w-full hover:opacity-95 transition-opacity border border-white/10 shadow-md" />
                      <div>{msg.content}</div>
                    </div>
                  ) : (
                    <div className="leading-relaxed">{msg.content}</div>
                  )}

                  <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] font-mono ${isMe ? 'text-red-200 justify-end' : 'text-[#71717A] justify-start'}`}>
                    {msg.is_starred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                    {msg.is_pinned && <Pin className="w-3 h-3 text-[#FF303B]" />}
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-red-200" />}
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="absolute -bottom-3 right-4 flex gap-0.5 liquid-glass rounded-full px-2 py-0.5 shadow-md">
                      {msg.reactions.map((r, idx) => (
                        <span key={idx} className="text-xs">{r.emoji}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Actions on Hover */}
                <div className={`absolute top-0 ${isMe ? '-left-28' : '-right-28'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center liquid-glass rounded-full shadow-2xl px-2 py-1 z-10 gap-1 text-white`}>
                  <button
                    onClick={() => setReplyToMessage(msg)}
                    className="p-1 hover:bg-white/10 rounded-full text-[#A1A1AA] hover:text-white cursor-pointer"
                    title="Reply"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => pinMessage(msg.id)}
                    className="p-1 hover:bg-white/10 rounded-full text-[#A1A1AA] hover:text-white cursor-pointer"
                    title={msg.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${msg.is_pinned ? 'text-[#E50914]' : ''}`} />
                  </button>
                  <button
                    onClick={() => starMessage(msg.id)}
                    className="p-1 hover:bg-white/10 rounded-full text-[#A1A1AA] hover:text-white cursor-pointer"
                    title={msg.is_starred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-3.5 h-3.5 ${msg.is_starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <div className="flex items-center border-l border-white/10 pl-1 gap-0.5">
                    {QUICK_REACTIONS.slice(0, 2).map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => sendReaction(msg.id, emoji)}
                        className="p-1 hover:bg-white/10 rounded-full text-xs cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply-to Preview Bar */}
      {replyToMessage && (
        <div className="px-4 py-2 bg-[#111111]/85 backdrop-blur-md border-t border-white/10 flex items-center justify-between text-xs text-white relative z-10">
          <div className="flex items-center gap-2 truncate">
            <CornerDownRight className="w-4 h-4 text-[#E50914] shrink-0" />
            <span className="font-semibold text-[#E50914]">Replying to {replyToMessage.sender?.display_name}:</span>
            <span className="truncate text-[#A1A1AA]">{replyToMessage.content}</span>
          </div>
          <button onClick={() => setReplyToMessage(null)} className="p-1 text-[#71717A] hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 bg-[#111111]/75 backdrop-blur-xl border-t border-white/10 relative z-20">
        {showStickerPicker && (
          <StickerPicker
            onSelectSticker={handleSelectSticker}
            onClose={() => setShowStickerPicker(false)}
          />
        )}

        <form onSubmit={handleSend} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className="p-2.5 text-[#A1A1AA] hover:bg-white/10 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Stickers"
          >
            <Smile className="w-5 h-5 text-[#E50914]" />
          </button>
          <button
            type="button"
            onClick={() => sendMessage('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80', 'image', 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80')}
            className="p-2.5 text-[#A1A1AA] hover:bg-white/10 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Attach Image"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={replyToMessage ? 'Type your reply...' : 'Type a message in liquid glass obsidian...'}
            className="flex-1 px-4 py-3 liquid-glass-input rounded-2xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-[#E50914] hover:bg-[#FF303B] text-white rounded-2xl transition-colors cursor-pointer shadow-lg shadow-[#E50914]/40 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Contact Info Drawer */}
      <ContactInfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        conversationId={activeConv.id}
      />

      {/* Media Lightbox */}
      <MediaLightboxModal
        mediaUrl={lightboxMediaUrl}
        onClose={() => setLightboxMediaUrl(null)}
      />
    </div>
  );
};
