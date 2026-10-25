import React, { useState } from 'react';
import { 
  Check, 
  Lock, 
  Sparkles, 
  X, 
  Plus, 
  Edit3, 
  Cpu, 
  Flame,
  Search
} from 'lucide-react';
import { Character } from '../types';

interface AnimeGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  activeCharacter: Character;
  onSelectCharacter: (char: Character) => void;
  onOpenEditDescription: (char: Character) => void;
  onCreateNewAnimeChar: () => void;
}

export const AnimeGridModal: React.FC<AnimeGridModalProps> = ({
  isOpen,
  onClose,
  characters,
  activeCharacter,
  onSelectCharacter,
  onOpenEditDescription,
  onCreateNewAnimeChar,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = characters.filter((c) => {
    const q = (search || '').toLowerCase();
    const name = (c?.name || '').toLowerCase();
    const title = (c?.title || '').toLowerCase();
    const tags = Array.isArray(c?.tags) ? c.tags : [];
    return (
      name.includes(q) ||
      title.includes(q) ||
      tags.some((t) => (t || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">Select Anime Heroine</h2>
              <p className="text-xs text-neutral-400">Pick an anime character from the grid boxes or configure your custom persona</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateNewAnimeChar}
              className="px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, archetype, or tags..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-pink-500/50"
            />
          </div>
        </div>

        {/* Character Grid Boxes */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {filtered.map((char) => {
              const isSelected = char.id === activeCharacter.id;
              return (
                <div
                  key={char.id}
                  className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between bg-neutral-950/80 ${
                    isSelected
                      ? 'border-pink-500 ring-2 ring-pink-500/30 shadow-lg'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Top Image + Overlay */}
                  <div className="relative h-48 w-full overflow-hidden bg-neutral-900">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

                    {/* Emotion Pill */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-sm ${char.emotionColor}`}>
                        ✦ {char.emotion}
                      </span>
                    </div>

                    {/* Active Lock Badge */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-pink-500/90 text-neutral-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE LOCKED</span>
                      </div>
                    )}

                    {/* Identity on bottom of image */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2 drop-shadow-md">
                        {char.name}
                      </h3>
                      <p className="text-xs text-pink-300 font-medium drop-shadow-sm">
                        {char.title}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    {/* Prompt Preview */}
                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-850">
                      {char.systemPrompt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {char.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-400 border border-neutral-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-850">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenEditDescription(char);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium rounded-xl border border-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                        <span>Edit Description</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectCharacter(char);
                          onClose();
                        }}
                        className={`py-1.5 px-4 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-neutral-800 text-neutral-400 cursor-default'
                            : 'bg-pink-500 hover:bg-pink-400 text-neutral-950'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Select & Lock In</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between shrink-0 text-xs text-neutral-400">
          <span>Selecting a character immediately applies their personality and locked prompt.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
