import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Sparkles, X, Send, Image as ImageIcon } from 'lucide-react';
import { BOTANICAL_STICKERS } from '../../lib/stickers';

interface StatusComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BG_COLORS = [
  'bg-[#0B2316]',
  'bg-emerald-800',
  'bg-teal-800',
  'bg-green-900',
  'bg-stone-800',
  'bg-amber-900'
];

export const StatusComposerModal: React.FC<StatusComposerModalProps> = ({ isOpen, onClose }) => {
  const { publishStatus } = useChat();
  const [content, setContent] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'sticker'>('text');
  const [selectedSticker, setSelectedSticker] = useState('🌿');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaType === 'text' && !content.trim()) return;
    await publishStatus(
      mediaType, 
      mediaType === 'sticker' ? selectedSticker : content, 
      bgColor, 
      mediaType === 'image' ? 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80' : undefined
    );
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D5E3D9]">
        <div className="flex items-center justify-between pb-4 border-b border-[#D5E3D9]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#15803D]" />
            <h2 className="text-lg font-bold text-[#112419]">Publish 24-Hour Status</h2>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMediaType('text')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border cursor-pointer ${mediaType === 'text' ? 'bg-[#15803D] text-white border-[#15803D]' : 'bg-stone-50 text-stone-700 border-stone-200'}`}
            >
              Text Story
            </button>
            <button
              type="button"
              onClick={() => setMediaType('sticker')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border cursor-pointer ${mediaType === 'sticker' ? 'bg-[#15803D] text-white border-[#15803D]' : 'bg-stone-50 text-stone-700 border-stone-200'}`}
            >
              Botanical Sticker
            </button>
            <button
              type="button"
              onClick={() => setMediaType('image')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl border cursor-pointer ${mediaType === 'image' ? 'bg-[#15803D] text-white border-[#15803D]' : 'bg-stone-50 text-stone-700 border-stone-200'}`}
            >
              Nature Photo
            </button>
          </div>

          {mediaType === 'text' && (
            <div>
              <div className={`p-6 rounded-2xl ${bgColor} text-white min-h-[160px] flex items-center justify-center text-center shadow-inner mb-3`}>
                <textarea
                  rows={3}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Share a botanical thought or update..."
                  className="w-full bg-transparent text-white placeholder-white/60 text-center font-medium focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 items-center justify-center">
                {BG_COLORS.map((col, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setBgColor(col)}
                    className={`w-7 h-7 rounded-full ${col} border-2 cursor-pointer ${bgColor === col ? 'border-white ring-2 ring-[#15803D]' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {mediaType === 'sticker' && (
            <div className="py-6 text-center bg-[#ECF3EE] rounded-2xl border border-[#D5E3D9]">
              <div className="text-6xl mb-4">{selectedSticker}</div>
              <div className="grid grid-cols-6 gap-2 px-4">
                {BOTANICAL_STICKERS.slice(0, 12).map(st => (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setSelectedSticker(st.url)}
                    className={`p-2 text-2xl bg-white rounded-xl border cursor-pointer hover:bg-emerald-50 ${selectedSticker === st.url ? 'border-[#15803D] ring-2 ring-[#15803D]/30' : 'border-[#D5E3D9]'}`}
                  >
                    {st.url}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mediaType === 'image' && (
            <div className="rounded-2xl overflow-hidden border border-[#D5E3D9] relative">
              <img
                src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
                alt="Nature Status"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white text-xs">
                Greenhouse morning botanical atmosphere 🌿
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D5E3D9] text-stone-700 text-sm font-medium rounded-xl hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#15803D] text-white text-sm font-medium rounded-xl hover:bg-[#166534] transition-colors cursor-pointer flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Publish Status</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
