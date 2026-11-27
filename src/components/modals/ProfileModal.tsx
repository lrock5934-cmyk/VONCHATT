import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { User, X, LogOut, Check, Palette, Shield } from 'lucide-react';
import { NATURE_WALLPAPERS } from '../../lib/stickers';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, signOut, fontSize, setFontSize, soundEnabled, setSoundEnabled } = useChat();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [statusMessage, setStatusMessage] = useState(user?.status_message || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isOnline, setIsOnline] = useState(user?.is_online ?? true);
  const [selectedWallpaper, setSelectedWallpaper] = useState(user?.chat_wallpaper || 'wp-1');
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setSaved(false);

    const { error } = await updateProfile({
      username,
      display_name: displayName,
      status_message: statusMessage,
      bio,
      is_online: isOnline,
      chat_wallpaper: selectedWallpaper
    });

    if (error) {
      setProfileError(error.message || 'Failed to update profile.');
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
      <div className="bg-[#111111] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#292929] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#292929]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-lg font-bold text-white">Profile & Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 text-[#71717A] hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved && (
          <div className="my-4 p-3 bg-red-950/40 border border-red-800 text-red-200 text-sm rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-[#E50914]" />
            <span>Profile and settings updated successfully!</span>
          </div>
        )}

        {profileError && (
          <div className="my-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-xl">
            {profileError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 pt-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${user.avatar_color} border border-[#292929] flex items-center justify-center text-xl font-bold shadow-md`}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-base text-white">{user.email}</div>
              <div className="text-xs text-[#A1A1AA] flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#E50914]' : 'bg-[#71717A]'}`} />
                {isOnline ? 'Active Online' : 'Offline'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Username (@username)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#71717A] text-sm font-semibold">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                maxLength={24}
                placeholder="lilrock"
                className="w-full pl-8 pr-3 py-2 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E50914]"
              />
            </div>
            <p className="text-[11px] text-[#71717A] mt-1">3–24 chars, letters, numbers, underscores only.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Status Message (max 120 chars)
            </label>
            <input
              type="text"
              maxLength={120}
              value={statusMessage}
              onChange={e => setStatusMessage(e.target.value)}
              placeholder="Online in Obsidian 🔥"
              className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Short Bio (max 240 chars)
            </label>
            <textarea
              rows={2}
              maxLength={240}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Write a few lines about yourself..."
              className="w-full px-3 py-2 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E50914]"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-[#181818] rounded-xl border border-[#292929]">
            <div>
              <div className="text-sm font-semibold text-white">Online Availability</div>
              <div className="text-xs text-[#A1A1AA]">Show online status to your contacts</div>
            </div>
            <input
              type="checkbox"
              checked={isOnline}
              onChange={e => setIsOnline(e.target.checked)}
              className="w-5 h-5 accent-[#E50914] rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#E50914]" />
              <span>Background Theme</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NATURE_WALLPAPERS.map(wp => (
                <button
                  type="button"
                  key={wp.id}
                  onClick={() => setSelectedWallpaper(wp.id)}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${selectedWallpaper === wp.id ? 'border-[#E50914] ring-2 ring-[#E50914]/20 bg-[#181818]' : 'border-[#292929] bg-[#121212] hover:bg-[#181818]'}`}
                >
                  <span className="truncate text-white">{wp.name}</span>
                  {selectedWallpaper === wp.id && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Chat Font Size
              </label>
              <select
                value={fontSize}
                onChange={e => setFontSize(e.target.value as any)}
                className="w-full p-2 bg-[#181818] border border-[#292929] rounded-xl text-sm text-white focus:outline-none"
              >
                <option value="small">Small</option>
                <option value="default">Default</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
                Message Pop Sound
              </label>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-full py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${soundEnabled ? 'bg-[#181818] border-[#E50914] text-[#E50914]' : 'bg-[#181818] border-[#292929] text-[#71717A]'}`}
              >
                {soundEnabled ? '🔊 Enabled' : '🔇 Muted'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#292929] flex items-center justify-between">
            <button
              type="button"
              onClick={signOut}
              className="px-4 py-2 bg-red-950/60 border border-red-800 text-red-200 text-sm font-medium rounded-xl hover:bg-red-900/60 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#292929] text-[#A1A1AA] text-sm font-medium rounded-xl hover:bg-[#181818] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#E50914] text-white text-sm font-medium rounded-xl hover:bg-[#FF303B] transition-colors cursor-pointer shadow-md shadow-[#E50914]/30"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
