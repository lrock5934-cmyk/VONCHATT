import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { AuthView } from './components/auth/AuthView';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/layout/ChatArea';
import { ProfileModal } from './components/modals/ProfileModal';
import { NewChatModal } from './components/modals/NewChatModal';
import { GroupModal } from './components/modals/GroupModal';
import { SearchModal } from './components/modals/SearchModal';
import { StatusComposerModal } from './components/modals/StatusComposerModal';
import { StatusViewerModal } from './components/modals/StatusViewerModal';
import { Loader2, Flame } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading, activeConversationId } = useChat();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<'create' | 'details'>('create');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupConvId, setSelectedGroupConvId] = useState<string | undefined>();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showStatusComposer, setShowStatusComposer] = useState(false);
  const [viewingStatusId, setViewingStatusId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E50914] to-[#FF303B] flex items-center justify-center shadow-lg shadow-[#E50914]/30 animate-pulse">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#A1A1AA]">Initializing vonChat Obsidian...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleOpenGroupDetails = (convId: string) => {
    setSelectedGroupConvId(convId);
    setGroupModalMode('details');
    setShowGroupModal(true);
  };

  const handleOpenCreateGroup = () => {
    setGroupModalMode('create');
    setSelectedGroupConvId(undefined);
    setShowGroupModal(true);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#050505] text-white">
      {/* Sidebar: hidden on mobile when conversation is active */}
      <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
        <Sidebar
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenGroupModal={handleOpenCreateGroup}
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenStatusComposer={() => setShowStatusComposer(true)}
          onOpenStatusViewer={(id) => setViewingStatusId(id)}
        />
      </div>

      {/* Active Conversation Area: hidden on mobile when no conversation is active */}
      <div className={`${!activeConversationId ? 'hidden md:flex' : 'flex'} flex-1 h-full`}>
        <ChatArea
          onOpenGroupDetails={handleOpenGroupDetails}
          onOpenSearch={() => setShowSearchModal(true)}
        />
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onOpenGroupModal={handleOpenCreateGroup}
      />
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        mode={groupModalMode}
        conversationId={selectedGroupConvId}
      />
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      <StatusComposerModal
        isOpen={showStatusComposer}
        onClose={() => setShowStatusComposer(false)}
      />
      <StatusViewerModal
        statusId={viewingStatusId}
        onClose={() => setViewingStatusId(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MainApp />
      </ChatProvider>
    </AuthProvider>
  );
}
