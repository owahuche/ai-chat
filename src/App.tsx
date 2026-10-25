/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  loadAdminSettings, 
  saveAdminSettings, 
  loadCharacters, 
  saveCharacters, 
  loadConversations, 
  saveConversations, 
  loadActiveConversationId, 
  saveActiveConversationId 
} from './services/storage';
import { Character, AdminSettings, Conversation, ChatMessage } from './types';
import { streamOpenRouterChat } from './services/openrouter';
import { PRESET_CHARACTERS } from './data/presetCharacters';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { AnimeGridHome } from './components/AnimeGridHome';
import { SettingsModal } from './components/SettingsModal';
import { CharacterLockStudio } from './components/CharacterLockStudio';
import { AdminPinModal } from './components/AdminPinModal';
import { AnimeGridModal } from './components/AnimeGridModal';

export default function App() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => loadAdminSettings());
  const [characters, setCharacters] = useState<Character[]>(() => loadCharacters());
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeConvId, setActiveConvId] = useState<string | null>(() => loadActiveConversationId());

  // Current view state: 'home' is the Anime Grid Boxes home page!
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');

  // UI and Modal states
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isAdminStudioOpen, setIsAdminStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnimeGridOpen, setIsAnimeGridOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync active character
  const activeCharacter = 
    characters.find((c) => c.id === adminSettings.activeCharacterId) || 
    characters[0] ||
    PRESET_CHARACTERS[0];

  // Save changes to storage
  useEffect(() => {
    saveAdminSettings(adminSettings);
  }, [adminSettings]);

  useEffect(() => {
    saveCharacters(characters);
  }, [characters]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (activeConvId) {
      saveActiveConversationId(activeConvId);
    }
  }, [activeConvId]);

  // Ensure active conversation exists on mount
  useEffect(() => {
    if (conversations.length === 0) {
      handleCreateNewConversation(activeCharacter);
    } else if (!activeConvId || !conversations.some((c) => c.id === activeConvId)) {
      setActiveConvId(conversations[0].id);
    }
  }, []);

  const handleCreateNewConversation = (char: Character = activeCharacter) => {
    const newId = `conv-${Date.now()}`;
    const initialMessages: ChatMessage[] = [];

    // Add character's signature greeting if present
    if (char.greetingMessage) {
      initialMessages.push({
        id: `msg-greeting-${Date.now()}`,
        role: 'assistant',
        content: char.greetingMessage,
        timestamp: Date.now(),
        modelUsed: char.modelOverride || adminSettings.customDefaultModel,
      });
    }

    const newConv: Conversation = {
      id: newId,
      title: `${char.name} Session`,
      characterId: char.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: initialMessages,
      model: char.modelOverride || adminSettings.customDefaultModel,
      temperature: char.temperature,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
  };

  const currentConversation = 
    conversations.find((c) => c.id === activeConvId) || 
    conversations[0] || 
    null;

  // Build the complete system instructions enforced by Character Lock
  const compileSystemPrompt = (char: Character): string => {
    let prompt = `${char.systemPrompt}\n\n`;
    prompt += `[EMOTIONAL DEMEANOR & MANNERISMS]:\n${char.voiceStyle}\n\n`;

    if (char.positiveDirectives.length > 0) {
      prompt += `[MANDATORY BEHAVIORAL DIRECTIVES]:\n`;
      char.positiveDirectives.forEach((rule, idx) => {
        prompt += `${idx + 1}. ${rule}\n`;
      });
      prompt += '\n';
    }

    if (char.negativeDirectives.length > 0) {
      prompt += `[STRICT NEGATIVE CONSTRAINTS (NEVER VIOLATE)]:\n`;
      char.negativeDirectives.forEach((rule, idx) => {
        prompt += `${idx + 1}. ${rule}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  };

  // Update in-chat character description and lock in
  const handleUpdateCharacterDescription = (characterId: string, newPrompt: string, newTitle?: string) => {
    const updated = characters.map((c) => {
      if (c.id === characterId) {
        return {
          ...c,
          systemPrompt: newPrompt,
          title: newTitle || c.title,
        };
      }
      return c;
    });

    setCharacters(updated);
  };

  // Send message and stream reply from OpenRouter
  const handleSendMessage = async (userText: string) => {
    if (!currentConversation) return;

    if (!adminSettings.openRouterApiKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = `msg-assistant-${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      modelUsed: activeCharacter.modelOverride || adminSettings.customDefaultModel,
      isStreaming: true,
    };

    // Update conversation with user and placeholder message
    const updatedMessages = [...currentConversation.messages, userMessage, assistantMessage];
    const newTitle = 
      currentConversation.messages.length === 0 || currentConversation.title.endsWith('Session')
        ? userText.slice(0, 36) + (userText.length > 36 ? '...' : '')
        : currentConversation.title;

    const updatedConv: Conversation = {
      ...currentConversation,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversation.id ? updatedConv : c))
    );

    // Prepare API messages payload
    const systemPrompt = compileSystemPrompt(activeCharacter);
    const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add prior turns
    currentConversation.messages.forEach((msg) => {
      if (!msg.error && msg.content) {
        apiMessages.push({ role: msg.role, content: msg.content });
      }
    });
    apiMessages.push({ role: 'user', content: userText });

    const modelToUse = activeCharacter.modelOverride || adminSettings.customDefaultModel;
    const tempToUse = activeCharacter.temperature || adminSettings.temperature;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const { fullText, latencyMs } = await streamOpenRouterChat({
        apiKey: adminSettings.openRouterApiKey,
        model: modelToUse,
        messages: apiMessages,
        temperature: tempToUse,
        maxTokens: adminSettings.maxTokens,
        topP: adminSettings.topP,
        abortSignal: controller.signal,
        onChunk: (accumulated) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConversation.id) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantPlaceholderId ? { ...m, content: accumulated } : m
                ),
              };
            })
          );
        },
      });

      // Finalize message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConversation.id) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantPlaceholderId
                ? { ...m, content: fullText, isStreaming: false, latencyMs }
                : m
            ),
          };
        })
      );
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConversation.id) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId ? { ...m, isStreaming: false } : m
              ),
            };
          })
        );
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown generation failure.';
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConversation.id) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? {
                      ...m,
                      content: `Failed to complete request: ${errorMsg}`,
                      isStreaming: false,
                      error: true,
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleRegenerate = () => {
    if (!currentConversation || currentConversation.messages.length === 0) return;
    const msgs = [...currentConversation.messages];
    
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userText = msgs[lastUserIndex].content;
    const pruned = msgs.slice(0, lastUserIndex);
    const updatedConv = {
      ...currentConversation,
      messages: pruned,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversation.id ? updatedConv : c))
    );

    handleSendMessage(userText);
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    if (!currentConversation) return;
    const msgIndex = currentConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const pruned = currentConversation.messages.slice(0, msgIndex);
    const updatedConv = {
      ...currentConversation,
      messages: pruned,
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversation.id ? updatedConv : c))
    );

    handleSendMessage(newText);
  };

  const handleClearChat = () => {
    if (!currentConversation) return;
    const initialMessages: ChatMessage[] = [];
    if (activeCharacter.greetingMessage) {
      initialMessages.push({
        id: `msg-greeting-${Date.now()}`,
        role: 'assistant',
        content: activeCharacter.greetingMessage,
        timestamp: Date.now(),
        modelUsed: activeCharacter.modelOverride || adminSettings.customDefaultModel,
      });
    }

    const updated = {
      ...currentConversation,
      messages: initialMessages,
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversation.id ? updated : c))
    );
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else {
        handleCreateNewConversation(activeCharacter);
      }
    }
  };

  const handleSelectCharacter = (char: Character) => {
    setAdminSettings((prev) => ({
      ...prev,
      activeCharacterId: char.id,
    }));
    handleCreateNewConversation(char);
  };

  const handleSelectCharacterAndChat = (char: Character) => {
    handleSelectCharacter(char);
    setCurrentView('chat');
  };

  const handleCreateNewAnimeCharacter = () => {
    const newId = `anime-custom-${Date.now()}`;
    const newChar: Character = {
      id: newId,
      name: 'Yuki',
      title: 'Custom Anime Companion',
      avatar: '/src/assets/images/anime_kitsune_spirit_1792955470580.jpg',
      emotion: 'Cheerful & Devoted',
      emotionColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      voiceStyle: 'Energetic, caring, playful dialogue with happy smiles',
      systemPrompt: 'You are Yuki, a lively, sweet, and attentive anime companion. You express high enthusiasm, emotional warmth, and loyalty.',
      positiveDirectives: ['Always respond with spirited anime dialogue and heartfelt encouragement'],
      negativeDirectives: ['Never break character or give dry impersonal answers'],
      greetingMessage: 'Konnichiwa! I am ready to join you on today’s adventure!',
      temperature: 0.8,
      isPreset: false,
      tags: ['Anime', 'Custom', 'Cheerful'],
    };

    setCharacters((prev) => [newChar, ...prev]);
    handleSelectCharacterAndChat(newChar);
  };

  const handleResetAllData = () => {
    setConversations([]);
    handleCreateNewConversation(activeCharacter);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={(id) => {
          setActiveConvId(id);
          setCurrentView('chat');
        }}
        onNewConversation={() => {
          handleCreateNewConversation(activeCharacter);
          setCurrentView('chat');
        }}
        onDeleteConversation={handleDeleteConversation}
        activeCharacter={activeCharacter}
        characters={characters}
        onSelectCharacter={handleSelectCharacter}
        adminSettings={adminSettings}
        isAdminUnlocked={isAdminUnlocked}
        onOpenAdminStudio={() => setIsAdminStudioOpen(true)}
        onOpenAdminPinModal={() => setIsAdminPinModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAnimeGrid={() => setCurrentView('home')}
      />

      {/* Main View: Anime Grid Home Page OR Active Chat */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {currentView === 'home' ? (
          <AnimeGridHome
            characters={characters}
            activeCharacter={activeCharacter}
            adminSettings={adminSettings}
            onSelectCharacterAndChat={handleSelectCharacterAndChat}
            onOpenEditDescription={(char) => {
              handleSelectCharacter(char);
              setCurrentView('chat');
            }}
            onCreateNewCharacter={handleCreateNewAnimeCharacter}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAdminStudio={() => setIsAdminStudioOpen(true)}
            onOpenAdminPinModal={() => setIsAdminPinModalOpen(true)}
            isAdminUnlocked={isAdminUnlocked}
          />
        ) : (
          <ChatView
            conversation={currentConversation}
            activeCharacter={activeCharacter}
            adminSettings={adminSettings}
            isAdminUnlocked={isAdminUnlocked}
            onOpenAdminStudio={() => setIsAdminStudioOpen(true)}
            onOpenAdminPinModal={() => setIsAdminPinModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAnimeGrid={() => setIsAnimeGridOpen(true)}
            onBackToHomeGrid={() => setCurrentView('home')}
            onUpdateCharacterDescription={handleUpdateCharacterDescription}
            onSendMessage={handleSendMessage}
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
            onClearChat={handleClearChat}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}
      </main>

      {/* Anime Grid Boxes Selection Modal (when triggered from within chat) */}
      <AnimeGridModal
        isOpen={isAnimeGridOpen}
        onClose={() => setIsAnimeGridOpen(false)}
        characters={characters}
        activeCharacter={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
        onOpenEditDescription={(char) => {
          handleSelectCharacter(char);
          setIsAnimeGridOpen(false);
          setCurrentView('chat');
        }}
        onCreateNewAnimeChar={handleCreateNewAnimeCharacter}
      />

      {/* Admin Passcode Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        expectedPin={adminSettings.adminPin}
        onSuccess={() => {
          setIsAdminUnlocked(true);
          setIsAdminPinModalOpen(false);
          setIsAdminStudioOpen(true);
        }}
      />

      {/* Admin Character Lock Studio */}
      <CharacterLockStudio
        isOpen={isAdminStudioOpen}
        onClose={() => setIsAdminStudioOpen(false)}
        adminSettings={adminSettings}
        onUpdateAdminSettings={(newSettings) => setAdminSettings(newSettings)}
        characters={characters}
        onUpdateCharacters={(newChars) => setCharacters(newChars)}
        activeCharacter={activeCharacter}
        onSelectActiveCharacter={(char) => {
          setAdminSettings((prev) => ({ ...prev, activeCharacterId: char.id }));
        }}
        onLockSession={() => setIsAdminUnlocked(false)}
      />

      {/* Settings Modal (API & Model Routing) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        adminSettings={adminSettings}
        onUpdateAdminSettings={(newSettings) => setAdminSettings(newSettings)}
        onResetAllData={handleResetAllData}
      />

    </div>
  );
}
