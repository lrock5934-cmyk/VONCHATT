import React from 'react';
import { X, Download, Share2 } from 'lucide-react';

interface MediaLightboxModalProps {
  mediaUrl: string | null;
  onClose: () => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({ mediaUrl, onClose }) => {
  if (!mediaUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          title="Download Media"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl flex items-center justify-center shadow-2xl">
        <img
          src={mediaUrl}
          alt="Lightbox media preview"
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );
};
