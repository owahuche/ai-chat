import { AdminSettings, Character, Conversation } from '../types';
import { PRESET_CHARACTERS } from '../data/presetCharacters';

const STORAGE_KEYS = {
  ADMIN_SETTINGS: 'aura_persona_admin_settings_v1',
  CHARACTERS: 'aura_persona_characters_v1',
  CONVERSATIONS: 'aura_persona_conversations_v1',
  ACTIVE_CONVERSATION_ID: 'aura_persona_active_conv_v1',
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminPin: 'admin123',
  isLockActive: true, // Enabled character lock setting
  activeCharacterId: 'aoi-cyber',
  allowGuestCharacterSwitch: true, // Allow user to pick from anime girl grid
  customDefaultModel: 'meta-llama/llama-3.3-70b-instruct',
  openRouterApiKey: '',
  temperature: 0.8,
  maxTokens: 2048,
  topP: 0.9,
};

export function loadAdminSettings(): AdminSettings {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
    if (!raw) return DEFAULT_ADMIN_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save admin settings', e);
  }
}

function normalizeCharacter(c: Partial<Character>): Character {
  return {
    id: c.id || `char-${Date.now()}`,
    name: c.name || 'Anime Heroine',
    title: c.title || 'Companion',
    avatar: c.avatar || '/src/assets/images/anime_kitsune_spirit_1792955470580.jpg',
    emotion: c.emotion || 'Warm & Expressive',
    emotionColor: c.emotionColor || 'text-pink-400 bg-pink-500/15 border-pink-500/30',
    voiceStyle: c.voiceStyle || 'Expressive anime dialogue with heartfelt warmth',
    tags: Array.isArray(c.tags) ? c.tags : ['Anime'],
    positiveDirectives: Array.isArray(c.positiveDirectives) ? c.positiveDirectives : [],
    negativeDirectives: Array.isArray(c.negativeDirectives) ? c.negativeDirectives : [],
    systemPrompt: c.systemPrompt || '',
    greetingMessage: c.greetingMessage || 'Hello!',
    temperature: typeof c.temperature === 'number' ? c.temperature : 0.8,
    modelOverride: c.modelOverride,
    isPreset: c.isPreset,
  };
}

export function loadCharacters(): Character[] {
  if (typeof window === 'undefined') return PRESET_CHARACTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    if (!raw) return PRESET_CHARACTERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Check if all 8 presets or new kitsune character is present
      const hasNewPresets = parsed.some((c: Character) => c.id === 'tamamo-kitsune');
      if (!hasNewPresets) {
        const customOnly = parsed.filter((c: Character) => !c.isPreset);
        const merged = [...PRESET_CHARACTERS, ...customOnly].map(normalizeCharacter);
        localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(merged));
        return merged;
      }
      return parsed.map(normalizeCharacter);
    }
    return PRESET_CHARACTERS;
  } catch {
    return PRESET_CHARACTERS;
  }
}

export function saveCharacters(characters: Character[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
  } catch (e) {
    console.error('Failed to save characters', e);
  }
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations', e);
  }
}

export function loadActiveConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
}

export function saveActiveConversationId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
}
