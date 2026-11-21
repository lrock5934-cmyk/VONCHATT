import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Users, X, Check, Crown, UserPlus, LogOut, Shield } from 'lucide-react';
import { AVATAR_COLORS } from '../../lib/stickers';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'details';
  conversationId?: string;
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, mode, conversationId }) => {
  const { allUsers, user, createGroupChat, conversations, leaveGroup, addParticipants } = useChat();
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const currentConv = conversationId ? conversations.find(c => c.id === conversationId) : null;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;
    await createGroupChat(groupTitle, selectedMemberIds, selectedColor);
    setGroupTitle('');
    setSelectedMemberIds([]);
    onClose();
  };

  const toggleSelectUser = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddMore = async () => {
    if (!conversationId || newMemberIds.length === 0) return;
    await addParticipants(conversationId, newMemberIds);
    setNewMemberIds([]);
    setShowAddMember(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#D5E3D9] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#D5E3D9]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#15803D]" />
            <h2 className="text-lg font-bold text-[#112419]">
              {mode === 'create' ? 'Create Botanical Group Chat' : currentConv?.title || 'Group Details'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreateGroup} className="space-y-5 pt-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Group Name
              </label>
              <input
                type="text"
                required
                value={groupTitle}
                onChange={e => setGroupTitle(e.target.value)}
                placeholder="Botanical Expedition Team"
                className="w-full px-3 py-2.5 bg-[#F4F8F5] border border-[#D5E3D9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                Choose Color Badge
              </label>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((color, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedColor(color)}
                    className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center font-bold text-xs cursor-pointer border-2 ${selectedColor === color ? 'border-white ring-2 ring-[#15803D]' : 'border-transparent'}`}
                  >
                    🌿
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                Select Participants ({selectedMemberIds.length} selected)
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {allUsers.filter(u => u.id !== user?.id).map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${selectedMemberIds.includes(u.id) ? 'border-[#15803D] bg-emerald-50/50' : 'border-[#D5E3D9] hover:bg-stone-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${u.avatar_color || 'bg-emerald-700 text-white'} flex items-center justify-center text-xs font-bold`}>
                        {u.display_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-sm font-semibold text-[#112419]">{u.display_name}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(u.id)}
                      onChange={() => {}}
                      className="accent-[#15803D] w-4 h-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#D5E3D9] flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#D5E3D9] text-stone-700 text-sm font-medium rounded-xl hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#15803D] text-white text-sm font-medium rounded-xl hover:bg-[#166534] transition-colors cursor-pointer shadow-md"
              >
                Create Group
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-between">
                <span>Group Members ({currentConv?.participants?.length || 0})</span>
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-[#15803D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              {showAddMember && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="text-xs font-semibold text-emerald-900">Select contacts to add:</div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {allUsers.filter(u => !currentConv?.participants?.some(p => p.profile_id === u.id)).map(u => (
                      <div
                        key={u.id}
                        onClick={() => setNewMemberIds(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${newMemberIds.includes(u.id) ? 'bg-emerald-200/50 font-semibold' : 'bg-white hover:bg-stone-100'}`}
                      >
                        <span>{u.display_name} ({u.email})</span>
                        {newMemberIds.includes(u.id) && <Check className="w-3.5 h-3.5 text-[#15803D]" />}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddMore}
                    className="w-full py-2 bg-[#15803D] text-white text-xs font-medium rounded-lg hover:bg-[#166534] cursor-pointer"
                  >
                    Confirm & Add Members
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {currentConv?.participants?.map(p => {
                  const pUser = allUsers.find(u => u.id === p.profile_id) || p.profile;
                  const isCreator = p.role === 'admin';
                  return (
                    <div key={p.profile_id} className="flex items-center justify-between p-3 rounded-xl border border-[#D5E3D9] bg-[#ECF3EE]">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${pUser?.avatar_color || 'bg-emerald-700 text-white'} flex items-center justify-center text-xs font-bold`}>
                          {pUser?.display_name?.slice(0, 2).toUpperCase() || '🌿'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#112419] flex items-center gap-1.5">
                            <span>{pUser?.display_name || 'Member'}</span>
                            {isCreator && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                                <Crown className="w-3 h-3" /> Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500">{pUser?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <span className={`w-2 h-2 rounded-full ${pUser?.is_online ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        <span>{pUser?.is_online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#D5E3D9] flex items-center justify-between">
              <button
                onClick={() => { if (conversationId) leaveGroup(conversationId); onClose(); }}
                className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Group</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#15803D] text-white text-sm font-medium rounded-xl hover:bg-[#166534] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
