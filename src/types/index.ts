export interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  emotion: string;
  emotionColor: string;
  voiceStyle: string;
  systemPrompt: string;
  positiveDirectives: string[];
  negativeDirectives: string[];
  greetingMessage: string;
  temperature: number;
  modelOverride?: string;
  isPreset?: boolean;
  tags: string[];
}

export interface AdminSettings {
  adminPin: string;
  isLockActive: boolean;
  activeCharacterId: string;
  allowGuestCharacterSwitch: boolean;
  customDefaultModel: string;
  openRouterApiKey: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelUsed?: string;
  latencyMs?: number;
  isStreaming?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  characterId: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}
