import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Status } from '../../types';
import { X, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface StatusViewerModalProps {
  statusId: string | null;
  onClose: () => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({ statusId, onClose }) => {
  const { statuses, user, deleteStatus, viewStatus } = useChat();
  const [currentIndex, setCurrentIndex] = useState(0);

  const myStatuses = statuses;
  const currentStatus = myStatuses.find(s => s.id === statusId) || myStatuses[currentIndex];

  useEffect(() => {
    if (currentStatus) {
      viewStatus(currentStatus.id);
    }
  }, [currentStatus?.id]);

  if (!statusId || !currentStatus) return null;

  const isAuthor = currentStatus.profile_id === user?.id;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md h-[80vh] max-h-[600px] bg-[#0B2316] rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-white/10">
        {/* Top Header & Progress */}
        <div className="p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex flex-col gap-3">
          <div className="flex gap-1">
            {myStatuses.map((s, idx) => (
              <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-300 ${s.id === currentStatus.id ? 'w-full' : 'w-0'}`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${currentStatus.profile?.avatar_color || 'bg-emerald-700 text-white'} flex items-center justify-center font-bold text-xs`}>
                {currentStatus.profile?.display_name?.slice(0, 2).toUpperCase() || '🌿'}
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{currentStatus.profile?.display_name || 'Botanical User'}</div>
                <div className="text-[10px] text-white/60 font-mono">
                  {new Date(currentStatus.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthor && (
                <button
                  onClick={() => { deleteStatus(currentStatus.id); onClose(); }}
                  className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-colors cursor-pointer"
                  title="Delete Status"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex items-center justify-center p-8 text-center text-white ${currentStatus.background_color || 'bg-[#0B2316]'}`}>
          {currentStatus.media_type === 'text' && (
            <div className="text-2xl font-semibold leading-relaxed tracking-wide">
              {currentStatus.content}
            </div>
          )}
          {currentStatus.media_type === 'sticker' && (
            <div className="text-8xl animate-bounce">
              {currentStatus.content}
            </div>
          )}
          {currentStatus.media_type === 'image' && (
            <img
              src={currentStatus.media_url}
              alt="Status media"
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
        </div>

        {/* Footer / Viewer Count */}
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent z-10 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5 text-white/80">
            <Eye className="w-4 h-4" />
            <span>{currentStatus.views?.length || 0} botanical views</span>
          </div>
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {currentIndex < myStatuses.length - 1 && (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
