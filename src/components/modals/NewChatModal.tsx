import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Search, X, MessageSquare, Users, UserPlus, Check } from 'lucide-react';
import { AVATAR_COLORS } from '../../lib/stickers';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGroupModal: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onOpenGroupModal }) => {
  const { allUsers, user, createDirectChat } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.id && (
      u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleStartChat = async (targetUserId: string) => {
    await createDirectChat(targetUserId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D5E3D9] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#D5E3D9]">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#15803D]" />
            <h2 className="text-lg font-bold text-[#112419]">Start New Chat</h2>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or Gmail..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F4F8F5] border border-[#D5E3D9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]"
            />
          </div>

          <button
            onClick={() => { onClose(); onOpenGroupModal(); }}
            className="w-full mb-4 p-3 bg-[#ECF3EE] border border-[#D5E3D9] rounded-xl text-sm font-semibold text-[#15803D] hover:bg-[#dcefe5] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Create Botanical Group Chat</span>
          </button>

          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Registered Directory Members ({filteredUsers.length})
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-sm">
              No members found matching "{searchTerm}"
            </div>
          ) : (
            filteredUsers.map(u => (
              <div
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="flex items-center justify-between p-3 rounded-xl border border-[#D5E3D9] hover:bg-[#ECF3EE] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${u.avatar_color || 'bg-emerald-700 text-white'} flex items-center justify-center font-bold text-sm shadow-sm`}>
                    {u.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#112419] group-hover:text-[#15803D] transition-colors">
                      {u.display_name}
                    </div>
                    <div className="text-xs text-stone-500">{u.email}</div>
                  </div>
                </div>
                <button className="p-2 bg-white border border-[#D5E3D9] rounded-lg text-[#15803D] group-hover:bg-[#15803D] group-hover:text-white transition-colors shadow-xs">
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
