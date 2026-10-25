import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  X, 
  RotateCcw, 
  Download, 
  Upload, 
  Settings2,
  UserCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Character, AdminSettings } from '../types';
import { PRESET_CHARACTERS } from '../data/presetCharacters';

interface CharacterLockStudioProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (newSettings: AdminSettings) => void;
  characters: Character[];
  onUpdateCharacters: (newCharacters: Character[]) => void;
  activeCharacter: Character;
  onSelectActiveCharacter: (character: Character) => void;
  onLockSession: () => void;
}

export const CharacterLockStudio: React.FC<CharacterLockStudioProps> = ({
  isOpen,
  onClose,
  adminSettings,
  onUpdateAdminSettings,
  characters,
  onUpdateCharacters,
  activeCharacter,
  onSelectActiveCharacter,
  onLockSession,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(activeCharacter.id);
  const [editingCharacter, setEditingCharacter] = useState<Character>({ ...activeCharacter });
  const [activeTab, setActiveTab] = useState<'persona' | 'security' | 'library'>('persona');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [newPositiveRule, setNewPositiveRule] = useState('');
  const [newNegativeRule, setNewNegativeRule] = useState('');
  const [newAdminPin, setNewAdminPin] = useState(adminSettings.adminPin);
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectCharacter = (char: Character) => {
    setSelectedCharId(char.id);
    setEditingCharacter({ ...char });
    setSavedSuccessMsg(false);
  };

  const handleSaveCharacter = () => {
    const updated = characters.map((c) => (c.id === editingCharacter.id ? editingCharacter : c));
    onUpdateCharacters(updated);
    if (adminSettings.activeCharacterId === editingCharacter.id) {
      onSelectActiveCharacter(editingCharacter);
    }
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 2200);
  };

  const handleSetActiveLocked = (char: Character) => {
    onSelectActiveCharacter(char);
    onUpdateAdminSettings({
      ...adminSettings,
      activeCharacterId: char.id,
      isLockActive: true,
    });
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 2200);
  };

  const handleCreateNewCharacter = () => {
    const newId = `custom-persona-${Date.now()}`;
    const newChar: Character = {
      id: newId,
      name: 'New Custom Anime Heroine',
      title: 'Spirited Companion',
      avatar: '/src/assets/images/anime_kitsune_spirit_1792955470580.jpg',
      emotion: 'Warm & Cheerful',
      emotionColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      voiceStyle: 'Energetic, sincere, encouraging dialogue with expressive remarks',
      systemPrompt: 'You are a warm, lively anime heroine. You respond with expressive emotional warmth and distinct personality.',
      positiveDirectives: ['Always maintain your designated emotional demeanor and expressive anime cadence'],
      negativeDirectives: ['Never break character or give dull impersonal answers'],
      greetingMessage: 'Hello! I am ready to converse and explore together!',
      temperature: 0.8,
      isPreset: false,
      tags: ['Anime', 'Custom'],
    };
    const updated = [...characters, newChar];
    onUpdateCharacters(updated);
    setSelectedCharId(newChar.id);
    setEditingCharacter(newChar);
    setActiveTab('persona');
  };

  const handleDeleteCharacter = (charId: string) => {
    if (characters.length <= 1) return;
    const remaining = characters.filter((c) => c.id !== charId);
    onUpdateCharacters(remaining);
    const nextChar = remaining[0];
    setSelectedCharId(nextChar.id);
    setEditingCharacter(nextChar);
    if (adminSettings.activeCharacterId === charId) {
      onSelectActiveCharacter(nextChar);
      onUpdateAdminSettings({
        ...adminSettings,
        activeCharacterId: nextChar.id,
      });
    }
  };

  const handleAddPositiveRule = () => {
    if (!newPositiveRule.trim()) return;
    setEditingCharacter({
      ...editingCharacter,
      positiveDirectives: [...editingCharacter.positiveDirectives, newPositiveRule.trim()],
    });
    setNewPositiveRule('');
  };

  const handleRemovePositiveRule = (index: number) => {
    setEditingCharacter({
      ...editingCharacter,
      positiveDirectives: editingCharacter.positiveDirectives.filter((_, i) => i !== index),
    });
  };

  const handleAddNegativeRule = () => {
    if (!newNegativeRule.trim()) return;
    setEditingCharacter({
      ...editingCharacter,
      negativeDirectives: [...editingCharacter.negativeDirectives, newNegativeRule.trim()],
    });
    setNewNegativeRule('');
  };

  const handleRemoveNegativeRule = (index: number) => {
    setEditingCharacter({
      ...editingCharacter,
      negativeDirectives: editingCharacter.negativeDirectives.filter((_, i) => i !== index),
    });
  };

  const handleExportCharacter = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(editingCharacter, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${editingCharacter.name.toLowerCase().replace(/\s+/g, '_')}_persona.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportCharacter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.name && imported.systemPrompt) {
          const newChar: Character = {
            ...imported,
            id: `imported-${Date.now()}`,
            isPreset: false,
          };
          onUpdateCharacters([...characters, newChar]);
          setSelectedCharId(newChar.id);
          setEditingCharacter(newChar);
        }
      } catch (err) {
        alert('Invalid persona JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSavePin = () => {
    if (newAdminPin.trim().length < 4) {
      setPinChangeMsg('PIN must be at least 4 characters');
      return;
    }
    onUpdateAdminSettings({
      ...adminSettings,
      adminPin: newAdminPin.trim(),
    });
    setPinChangeMsg('Admin passcode updated successfully!');
    setTimeout(() => setPinChangeMsg(''), 3000);
  };

  const avatarPresets = [
    { label: 'Tamamo', path: '/src/assets/images/anime_kitsune_spirit_1792955470580.jpg' },
    { label: 'Koharu', path: '/src/assets/images/anime_shy_artist_1792955471477.jpg' },
    { label: 'Rin', path: '/src/assets/images/anime_fiery_rebel_1792955472114.jpg' },
    { label: 'Midori', path: '/src/assets/images/anime_gentle_healer_1792955471923.jpg' },
    { label: 'Aoi', path: '/src/assets/images/anime_cyber_girl_1792954660991.jpg' },
    { label: 'Celeste', path: '/src/assets/images/anime_fantasy_mage_1792954660658.jpg' },
    { label: 'Hana', path: '/src/assets/images/anime_detective_girl_1792954660987.jpg' },
    { label: 'Rei', path: '/src/assets/images/anime_pilot_girl_1792954662018.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-neutral-100">Character Lock Studio</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                  ADMIN ONLY
                </span>
                {adminSettings.isLockActive && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> ENFORCED
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">Define how your characters act and lock directives against user tampering</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLockSession();
                onClose();
              }}
              title="Lock admin session and return to guest mode"
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock Admin Session</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Sub-Header */}
        <div className="px-6 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('persona')}
              className={`px-4 py-3 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'persona'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Persona & Directives</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-3 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Lock Enforcement & PIN</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-3 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'library'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Character Library ({characters.length})</span>
            </button>
          </div>

          {activeTab === 'persona' && (
            <div className="flex items-center gap-2 py-2">
              {savedSuccessMsg && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
                  <Check className="w-3.5 h-3.5" /> Saved & Locked
                </span>
              )}
              <button
                onClick={handleSaveCharacter}
                className="px-3.5 py-1.5 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Directives</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950/40">
          {activeTab === 'persona' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Selector & Identity */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">Selected Character</span>
                    {adminSettings.activeCharacterId === editingCharacter.id ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> ACTIVE LOCKED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetActiveLocked(editingCharacter)}
                        className="text-[11px] font-medium text-amber-400 hover:text-amber-300 underline"
                      >
                        Set as Active Locked
                      </button>
                    )}
                  </div>

                  {/* Character Avatar & Name */}
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={editingCharacter.avatar}
                      alt={editingCharacter.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-700 shadow-md shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingCharacter.name}
                        onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded-lg text-sm font-semibold text-neutral-100 focus:border-amber-400 outline-none"
                        placeholder="Character Name"
                      />
                      <input
                        type="text"
                        value={editingCharacter.title}
                        onChange={(e) => setEditingCharacter({ ...editingCharacter, title: e.target.value })}
                        className="w-full bg-transparent border-0 px-2.5 py-0.5 text-xs text-neutral-400 focus:text-neutral-200 outline-none mt-1"
                        placeholder="Character Title or Archetype"
                      />
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                      Visual Persona Portrait
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {avatarPresets.map((preset) => (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => setEditingCharacter({ ...editingCharacter, avatar: preset.path })}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                            editingCharacter.avatar === preset.path
                              ? 'border-amber-400 ring-1 ring-amber-400/40'
                              : 'border-neutral-800 hover:border-neutral-600 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={preset.path} 
                            alt={preset.label} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover" 
                          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={editingCharacter.avatar}
                        onChange={(e) => setEditingCharacter({ ...editingCharacter, avatar: e.target.value })}
                        placeholder="Or enter custom image URL"
                        className="w-full bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Temperature slider */}
                  <div className="pt-2 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400">Creativity / Temperature</span>
                      <span className="font-mono text-neutral-200 tabular-nums">{editingCharacter.temperature.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={editingCharacter.temperature}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, temperature: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                      <span>Strict / Precise (0.1)</span>
                      <span>Expressive (1.5)</span>
                    </div>
                  </div>

                  {/* Character Model Override (optional) */}
                  <div className="pt-2 border-t border-neutral-800/80">
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Model Preference (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingCharacter.modelOverride || ''}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, modelOverride: e.target.value || undefined })}
                      placeholder="e.g. meta-llama/llama-3.3-70b-instruct"
                      className="w-full bg-neutral-950 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 font-mono placeholder:text-neutral-600 outline-none focus:border-amber-400"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Leave blank to use global default model.</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                    <button
                      type="button"
                      onClick={handleExportCharacter}
                      className="flex-1 py-1.5 bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 rounded-lg text-xs text-neutral-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                    {!editingCharacter.isPreset && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCharacter(editingCharacter.id)}
                        className="py-1.5 px-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors"
                        title="Delete custom persona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Persona Switcher in admin */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                  <span className="text-xs font-medium text-neutral-400 block mb-1">Switch Character to Edit</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {characters.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCharacter(c)}
                        className={`w-full p-2 rounded-lg flex items-center gap-2.5 text-left transition-colors ${
                          c.id === editingCharacter.id
                            ? 'bg-amber-400/10 border border-amber-400/30 text-neutral-100'
                            : 'hover:bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        <img 
                          src={c.avatar} 
                          alt={c.name} 
                          referrerPolicy="no-referrer" 
                          className="w-7 h-7 rounded-md object-cover" 
                        />
                        <div className="flex-1 truncate">
                          <p className="text-xs font-medium truncate text-neutral-200">{c.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{c.title}</p>
                        </div>
                        {c.id === adminSettings.activeCharacterId && (
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: The Way You Want Characters to Act */}
              <div className="lg:col-span-8 space-y-5">
                
                {/* Core Persona System Prompt */}
                <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                        <span>Core Identity & Voice Directives</span>
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Admin prompt controlling how this character speaks, reasons, and behaves in all chats
                      </p>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={editingCharacter.systemPrompt}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, systemPrompt: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400/80 rounded-xl p-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none font-sans leading-relaxed transition-all"
                    placeholder="Enter the primary system prompt defining personality, background, vocabulary, demeanor..."
                  />
                </div>

                {/* Positive Behavioral Directives */}
                <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5" />
                        <span>What this character ALWAYS does (Positive Directives)</span>
                      </h4>
                      <p className="text-xs text-neutral-400">Enforced conversational traits, patterns, and signature behaviors</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {editingCharacter.positiveDirectives.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-neutral-950/80 border border-neutral-800/80 p-2.5 rounded-lg text-xs text-neutral-200">
                        <span className="text-emerald-400 font-mono text-[11px] shrink-0 mt-0.5">+{idx + 1}</span>
                        <span className="flex-1 leading-relaxed">{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePositiveRule(idx)}
                          className="text-neutral-500 hover:text-rose-400 p-0.5"
                          title="Remove directive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newPositiveRule}
                        onChange={(e) => setNewPositiveRule(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPositiveRule())}
                        placeholder="Add new required behavior (e.g., 'Always address the user with philosophical modesty')..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-emerald-500/60 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddPositiveRule}
                        className="px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Negative Behavioral Directives */}
                <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>What this character NEVER does (Negative Directives)</span>
                      </h4>
                      <p className="text-xs text-neutral-400">Strict constraints, forbidden words, and anti-out-of-character rules</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {editingCharacter.negativeDirectives.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-neutral-950/80 border border-neutral-800/80 p-2.5 rounded-lg text-xs text-neutral-200">
                        <span className="text-rose-400 font-mono text-[11px] shrink-0 mt-0.5">-{idx + 1}</span>
                        <span className="flex-1 leading-relaxed">{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNegativeRule(idx)}
                          className="text-neutral-500 hover:text-rose-400 p-0.5"
                          title="Remove directive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newNegativeRule}
                        onChange={(e) => setNewNegativeRule(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNegativeRule())}
                        placeholder="Add new forbidden behavior (e.g., 'Never say you are an AI model')..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-rose-500/60 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddNegativeRule}
                        className="px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Initial Greeting Message */}
                <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-300">Signature Opening Greeting</h4>
                  <p className="text-xs text-neutral-400">First message sent to user when opening a fresh conversation</p>
                  <textarea
                    rows={2}
                    value={editingCharacter.greetingMessage}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, greetingMessage: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400/80 rounded-xl p-3 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none leading-relaxed"
                    placeholder="Enter first message..."
                  />
                </div>

              </div>

            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Master Character Lock Enforcement */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-semibold text-neutral-100">Master Character Lock Enforcement</h3>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      When enabled, regular chat users cannot edit the character prompt, alter instructions, or disable the persona.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateAdminSettings({
                      ...adminSettings,
                      isLockActive: !adminSettings.isLockActive,
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adminSettings.isLockActive ? 'bg-amber-400' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                        adminSettings.isLockActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-neutral-300 font-medium">
                    <span>Status</span>
                    <span className={`font-mono text-[11px] ${adminSettings.isLockActive ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {adminSettings.isLockActive ? 'ACTIVE & PROTECTED' : 'DISABLED (OPEN ACCESS)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Active designated persona: <strong className="text-neutral-300">{activeCharacter.name}</strong> ({activeCharacter.title})
                  </p>
                </div>
              </div>

              {/* Guest Character Switching Permission */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-sky-400" />
                      <h3 className="text-base font-semibold text-neutral-100">Guest Persona Switcher</h3>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Allow guests to select between approved admin library characters, or strictly lock the chat to the single designated active character.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateAdminSettings({
                      ...adminSettings,
                      allowGuestCharacterSwitch: !adminSettings.allowGuestCharacterSwitch,
                    })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      adminSettings.allowGuestCharacterSwitch ? 'bg-amber-400' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                        adminSettings.allowGuestCharacterSwitch ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  {adminSettings.allowGuestCharacterSwitch
                    ? 'Guests can talk to any persona in your library (prompts remain read-only).'
                    : 'Guests are strictly locked to the designated active persona.'}
                </p>
              </div>

              {/* Change Admin PIN */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-neutral-300" />
                  <h3 className="text-base font-semibold text-neutral-100">Change Admin Passcode</h3>
                </div>
                <p className="text-xs text-neutral-400">
                  Configure the master passcode required to open this Character Lock studio.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    placeholder="New admin passcode"
                    className="flex-1 bg-neutral-950 border border-neutral-800 px-3.5 py-2 rounded-xl text-sm text-neutral-100 font-mono tracking-wider outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSavePin}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Update Passcode
                  </button>
                </div>
                {pinChangeMsg && (
                  <p className="text-xs text-amber-400">{pinChangeMsg}</p>
                )}
              </div>

            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutral-100">Character Roster</h3>
                  <p className="text-xs text-neutral-400">Manage all configured personas and import/export character definitions</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                    <input type="file" accept=".json" onChange={handleImportCharacter} className="hidden" />
                  </label>
                  <button
                    onClick={handleCreateNewCharacter}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Persona</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((char) => {
                  const isActive = char.id === adminSettings.activeCharacterId;
                  return (
                    <div
                      key={char.id}
                      className={`p-4 bg-neutral-900 border rounded-xl flex flex-col justify-between transition-all ${
                        isActive
                          ? 'border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start gap-3">
                          <img
                            src={char.avatar}
                            alt={char.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-semibold text-neutral-100 truncate">{char.name}</h4>
                              {isActive && (
                                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 truncate">{char.title}</p>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                              Temp: {char.temperature} · {char.tags.join(', ')}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-300 line-clamp-3 mt-3 leading-relaxed bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850">
                          {char.systemPrompt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-neutral-800">
                        <button
                          onClick={() => {
                            handleSelectCharacter(char);
                            setActiveTab('persona');
                          }}
                          className="text-xs text-neutral-300 hover:text-neutral-100 font-medium"
                        >
                          Edit Directives
                        </button>
                        {!isActive ? (
                          <button
                            onClick={() => handleSetActiveLocked(char)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                          >
                            Set Active
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Designated
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-neutral-500" />
            <span>Character directives automatically seal user prompt injection and jailbreaks.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-100 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Close Studio
          </button>
        </div>

      </div>
    </div>
  );
};
