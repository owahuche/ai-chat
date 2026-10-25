import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Lock, 
  Unlock, 
  Settings, 
  ShieldCheck, 
  ChevronRight, 
  X,
  Sparkles,
  Grid
} from 'lucide-react';
import { Conversation, Character, AdminSettings } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  activeCharacter: Character;
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
  adminSettings: AdminSettings;
  isAdminUnlocked: boolean;
  onOpenAdminStudio: () => void;
  onOpenAdminPinModal: () => void;
  onOpenSettings: () => void;
  onOpenAnimeGrid: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  activeCharacter,
  characters,
  onSelectCharacter,
  adminSettings,
  isAdminUnlocked,
  onOpenAdminStudio,
  onOpenAdminPinModal,
  onOpenSettings,
  onOpenAnimeGrid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-neutral-900 border-r border-neutral-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Brand Bar */}
        <div className="h-16 px-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center text-neutral-950 font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-100 whitespace-nowrap">
                Aura Persona
              </h1>
              <p className="text-[10px] text-pink-400 font-mono">Anime OpenRouter Studio</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buttons */}
        <div className="p-4 shrink-0 space-y-2">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-400 text-neutral-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>

          <button
            onClick={() => {
              onOpenAnimeGrid();
              onClose();
            }}
            className="w-full py-2 px-3 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-pink-500/40 text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Grid className="w-4 h-4 text-pink-400" />
            <span>Anime Heroines (Home)</span>
          </button>

          {/* Search */}
          <div className="relative pt-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            History
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 font-medium'
                      : 'text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectConversation(c.id);
                      onClose();
                    }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left pr-2"
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className="truncate">{c.title}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Active Character Info Card */}
        <div className="p-3 mx-3 mb-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-400 font-medium">Designated Persona</span>
            {adminSettings.isLockActive ? (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            ) : (
              <span className="text-[10px] font-mono text-neutral-400">Unlocked</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src={activeCharacter.avatar}
              alt={activeCharacter.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-amber-500/30 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-200 truncate">{activeCharacter.name}</p>
              <p className="text-[10px] text-neutral-400 truncate">{activeCharacter.title}</p>
            </div>
          </div>

          {/* Switch if guest allowed OR admin unlocked */}
          {(adminSettings.allowGuestCharacterSwitch || isAdminUnlocked) && (
            <div className="pt-1.5 border-t border-neutral-850">
              <span className="text-[10px] text-neutral-400 block mb-1">Switch Character:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectCharacter(c)}
                    title={`${c.name} - ${c.title}`}
                    className={`relative rounded-md overflow-hidden shrink-0 border transition-all ${
                      c.id === activeCharacter.id
                        ? 'border-amber-400 ring-1 ring-amber-400/40'
                        : 'border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={c.avatar} 
                      alt={c.name} 
                      referrerPolicy="no-referrer" 
                      className="w-6 h-6 object-cover" 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Admin & Settings */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between shrink-0">
          <button
            onClick={isAdminUnlocked ? onOpenAdminStudio : onOpenAdminPinModal}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors p-1.5 rounded-lg hover:bg-neutral-800"
            title={isAdminUnlocked ? 'Admin Mode (Unlocked)' : 'Unlock Admin Character Lock'}
          >
            {isAdminUnlocked ? (
              <Unlock className="w-4 h-4 text-amber-400" />
            ) : (
              <Lock className="w-4 h-4 text-neutral-400" />
            )}
            <span className="font-medium text-[11px]">
              {isAdminUnlocked ? 'Admin Active' : 'Admin Lock'}
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
            title="OpenRouter Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </aside>
    </>
  );
};
