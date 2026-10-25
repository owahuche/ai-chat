import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Lock, 
  Check, 
  Edit3, 
  Plus, 
  Search, 
  Heart, 
  Flame, 
  Moon, 
  Shield, 
  Cpu,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Character, AdminSettings } from '../types';

interface AnimeGridHomeProps {
  characters: Character[];
  activeCharacter: Character;
  adminSettings: AdminSettings;
  onSelectCharacterAndChat: (char: Character) => void;
  onOpenEditDescription: (char: Character) => void;
  onCreateNewCharacter: () => void;
  onOpenSettings: () => void;
  onOpenAdminStudio: () => void;
  onOpenAdminPinModal: () => void;
  isAdminUnlocked: boolean;
}

export const AnimeGridHome: React.FC<AnimeGridHomeProps> = ({
  characters,
  activeCharacter,
  adminSettings,
  onSelectCharacterAndChat,
  onOpenEditDescription,
  onCreateNewCharacter,
  onOpenSettings,
  onOpenAdminStudio,
  onOpenAdminPinModal,
  isAdminUnlocked,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filterCategories = [
    { id: 'all', label: 'All Heroines' },
    { id: 'playful', label: 'Playful & Teasing' },
    { id: 'gentle', label: 'Gentle & Sweet' },
    { id: 'fiery', label: 'Fiery & Rebel' },
    { id: 'mystical', label: 'Mystical & Cosmic' },
    { id: 'tactical', label: 'Cool & Tactical' },
  ];

  const filteredCharacters = characters.filter((char) => {
    const q = (searchQuery || '').toLowerCase();
    const name = (char?.name || '').toLowerCase();
    const title = (char?.title || '').toLowerCase();
    const emotion = (char?.emotion || '').toLowerCase();
    const tags = Array.isArray(char?.tags) ? char.tags : [];

    const matchesSearch =
      name.includes(q) ||
      title.includes(q) ||
      emotion.includes(q) ||
      tags.some((t) => (t || '').toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'playful') return emotion.includes('playful') || tags.includes('Playful');
    if (selectedFilter === 'gentle') return emotion.includes('gentle') || emotion.includes('shy') || emotion.includes('peaceful') || tags.includes('Gentle');
    if (selectedFilter === 'fiery') return emotion.includes('fiery') || tags.includes('Fiery');
    if (selectedFilter === 'mystical') return emotion.includes('mystical') || tags.includes('Mystical') || tags.includes('Magic');
    if (selectedFilter === 'tactical') return emotion.includes('calm') || tags.includes('Tactical') || tags.includes('Cyberpunk');
    return true;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-neutral-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-pink-950/30 border border-neutral-800 p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-xs font-semibold text-pink-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anime Persona Vault · Character Lock Studio</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-100">
              Choose Your Anime Heroine
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Select from expressive anime characters, customize their personality & emotional directives, and lock them in using your OpenRouter models.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onCreateNewCharacter}
                className="px-5 py-2.5 bg-pink-500 hover:bg-pink-400 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Anime Girl</span>
              </button>

              <button
                onClick={isAdminUnlocked ? onOpenAdminStudio : onOpenAdminPinModal}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-pink-400" />
                <span>{isAdminUnlocked ? 'Admin Character Studio' : 'Admin Passcode Lock'}</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Engine: {adminSettings.customDefaultModel.split('/').pop()}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Emotion Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === cat.id
                    ? 'bg-pink-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search heroines or emotion..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-pink-500/50"
            />
          </div>

        </div>

        {/* Anime Grid Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCharacters.map((char) => {
            const isActive = char.id === activeCharacter.id;
            return (
              <div
                key={char.id}
                className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between bg-neutral-900/90 hover:shadow-2xl hover:-translate-y-1 ${
                  isActive
                    ? 'border-pink-500 ring-2 ring-pink-500/40 shadow-xl'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Image Section */}
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-950">
                  <img
                    src={char.avatar}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  
                  {/* Subtle Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />

                  {/* Emotion Pill on Top Left */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-sm ${char.emotionColor || 'text-pink-400 bg-pink-500/15 border-pink-500/30'}`}>
                      ✦ {char.emotion || 'Warm & Expressive'}
                    </span>
                  </div>

                  {/* Active Lock Badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-pink-500 text-neutral-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
                      <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>CURRENT</span>
                    </div>
                  )}

                  {/* Character Name & Role on bottom of image */}
                  <div className="absolute bottom-3 left-4 right-4 space-y-0.5">
                    <h2 className="text-xl font-extrabold text-neutral-100 drop-shadow-md">
                      {char.name || 'Anime Heroine'}
                    </h2>
                    <p className="text-xs text-pink-300/90 font-medium truncate drop-shadow-sm">
                      {char.title || 'Companion'}
                    </p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  
                  {/* Voice & Feeling Cadence */}
                  <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-850 space-y-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                      Emotional Demeanor
                    </span>
                    <p className="text-xs text-neutral-300 italic line-clamp-2 leading-relaxed">
                      "{char.voiceStyle || 'Expressive anime dialogue with heartfelt warmth'}"
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {(char.tags || []).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-950 text-neutral-400 border border-neutral-850"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-neutral-850">
                    <button
                      type="button"
                      onClick={() => onSelectCharacterAndChat(char)}
                      className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-400 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group/btn"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Continue Chat' : 'Chat & Lock In'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditDescription(char)}
                      className="w-full py-1.5 px-3 bg-neutral-950 hover:bg-neutral-850 text-neutral-300 hover:text-neutral-100 text-[11px] font-medium rounded-xl border border-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3 text-pink-400" />
                      <span>Edit Description & Directives</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}

          {/* Create New Heroine Card */}
          <div
            onClick={onCreateNewCharacter}
            className="group rounded-3xl border-2 border-dashed border-neutral-800 hover:border-pink-500/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-950/40 hover:bg-neutral-900/40 transition-all min-h-[360px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 group-hover:border-pink-500/40 flex items-center justify-center text-neutral-400 group-hover:text-pink-400 transition-colors mb-4 shadow-inner">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-200 group-hover:text-pink-300 transition-colors">
              Add New Anime Heroine
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
              Create a custom character with your own image, personality prompts, emotions, and speech style.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
