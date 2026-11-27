import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Search, X, MessageSquare, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { messages, conversations, setActiveConversationId } = useChat();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim() ? messages.filter(m => m.content.toLowerCase().includes(query.toLowerCase())) : [];

  const handleSelectMessage = (convId: string) => {
    setActiveConversationId(convId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
      <div className="bg-[#111111] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#292929] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-lg font-bold text-white">Search Message History</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#71717A] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#71717A]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search across all conversations (Ctrl+K)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {!query.trim() ? (
            <div className="text-center py-12 text-[#71717A] text-sm">
              Type keywords to search message history across all conversations.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-[#71717A] text-sm">
              No matching messages found for "{query}".
            </div>
          ) : (
            results.map(msg => {
              const conv = conversations.find(c => c.id === msg.conversation_id);
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg.conversation_id)}
                  className="p-3.5 rounded-xl border border-[#292929] bg-[#181818] hover:bg-[#222222] transition-colors cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#E50914] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{conv?.title || 'Conversation'}</span>
                      <span className="text-[#71717A] font-normal font-mono text-[11px]">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white group-hover:text-[#E50914] transition-colors">
                      {msg.content}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-[#E50914] transition-colors" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
