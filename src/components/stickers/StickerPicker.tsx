import React, { useState } from 'react';
import { BOTANICAL_STICKERS } from '../../lib/stickers';

interface StickerPickerProps {
  onSelectSticker: (stickerUrl: string) => void;
  onClose: () => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelectSticker, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Botanical');

  const categories = Array.from(new Set(BOTANICAL_STICKERS.map(s => s.category)));
  const filtered = BOTANICAL_STICKERS.filter(s => s.category === selectedCategory);

  return (
    <div className="absolute bottom-16 left-4 bg-white rounded-2xl shadow-2xl border border-[#D5E3D9] p-4 w-72 z-40">
      <div className="flex gap-1 mb-3 border-b border-[#D5E3D9] pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${selectedCategory === cat ? 'bg-[#15803D] text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
        {filtered.map(st => (
          <button
            type="button"
            key={st.id}
            onClick={() => { onSelectSticker(st.url); onClose(); }}
            className="p-3 text-2xl bg-[#ECF3EE] hover:bg-[#d8eade] rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-[#D5E3D9]"
            title={st.name}
          >
            {st.url}
          </button>
        ))}
      </div>
    </div>
  );
};
