import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Lock, 
  Unlock, 
  Settings, 
  Sparkles, 
  Trash2, 
  Download, 
  Key, 
  Cpu, 
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check,
  Menu,
  Grid,
  Edit3,
  Mic,
  MicOff
} from 'lucide-react';
import { Character, AdminSettings, Conversation, ChatMessage } from '../types';
import { MessageItem } from './MessageItem';

interface ChatViewProps {
  conversation: Conversation | null;
  activeCharacter: Character;
  adminSettings: AdminSettings;
  isAdminUnlocked: boolean;
  onOpenAdminStudio: () => void;
  onOpenAdminPinModal: () => void;
  onOpenSettings: () => void;
  onOpenAnimeGrid: () => void;
  onBackToHomeGrid: () => void;
  onUpdateCharacterDescription: (characterId: string, newPrompt: string, newTitle?: string) => void;
  onSendMessage: (text: string) => void;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onClearChat: () => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  onToggleSidebar: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  activeCharacter,
  adminSettings,
  isAdminUnlocked,
  onOpenAdminStudio,
  onOpenAdminPinModal,
  onOpenSettings,
  onOpenAnimeGrid,
  onBackToHomeGrid,
  onUpdateCharacterDescription,
  onSendMessage,
  onRegenerate,
  onEditMessage,
  onClearChat,
  isStreaming,
  onStopStreaming,
  onToggleSidebar,
}) => {
  const [inputText, setInputText] = useState('');
  const [isDescriptionBoxOpen, setIsDescriptionBoxOpen] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState(activeCharacter.systemPrompt);
  const [isLockedIn, setIsLockedIn] = useState(true);
  const [lockInToast, setLockInToast] = useState(false);

  // Web Speech API Voice-to-Text state
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync description when active character changes
  useEffect(() => {
    setDescriptionInput(activeCharacter.systemPrompt);
    setIsLockedIn(true);
  }, [activeCharacter.id, activeCharacter.systemPrompt]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      setSpeechStatus(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus(`Listening... Speak to ${activeCharacter.name}`);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error !== 'no-speech') {
          setSpeechStatus(`Mic error: ${event.error}`);
          setTimeout(() => setSpeechStatus(null), 3000);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechStatus(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
      setSpeechStatus('Could not access microphone');
      setTimeout(() => setSpeechStatus(null), 3000);
    }
  };

  const messages = conversation?.messages || [];
  const activeModel = activeCharacter.modelOverride || adminSettings.customDefaultModel;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isStreaming ? 'auto' : 'smooth');
  }, [messages, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleSaveAndLockIn = () => {
    onUpdateCharacterDescription(activeCharacter.id, descriptionInput);
    setIsLockedIn(true);
    setLockInToast(true);
    setTimeout(() => setLockInToast(false), 2000);
  };

  const promptStarters: Record<string, string[]> = {
    'tamamo-kitsune': [
      'What mischievous magic are you brewing in the shrine tonight, Tamamo?',
      'Can you tell me an ancient secret that humans have forgotten?',
      'How do you always know exactly what I am thinking?'
    ],
    'koharu-artist': [
      'What emotion are you painting onto the canvas right now?',
      'I am feeling a bit overwhelmed today... can we just talk quietly for a moment?',
      'What does happiness look like in watercolor colors?'
    ],
    'rin-rebel': [
      'I need some fire in my spirit today. What should I tackle head-on?',
      'Play me a killer riff! How do you stay so fearless?',
      'Tell me what makes you fight so fiercely for your convictions.'
    ],
    'midori-healer': [
      'Can you brew a calming tea blend for a weary heart?',
      'What does the botanical garden teach us about patience and healing?',
      'I want to slow down and find peace today. Guide me.'
    ],
    'aoi-cyber': [
      'Visor online. What is our next cyber infiltration mission?',
      'Can you analyze the security protocols of Neo-Tokyo’s main server grid?',
      'Teach me how you bypass firewall countermeasures so effortlessly!'
    ],
    'celeste-mage': [
      'What constellations are aligned tonight in the celestial observatory?',
      'Could you teach me how to read the cosmic harmonies of the stars?',
      'Tell me the ancient tale of the celestial nebula!'
    ],
    'hana-detective': [
      'Case file #104 is open! What is your deductive theory on the missing artifact?',
      'How do you spot clues that everyone else overlooks?',
      'Tell me about your most thrilling solved mystery!'
    ],
    'rei-pilot': [
      'Vanguard Unit-09, report on synchronization rate and flight readiness.',
      'What is our defensive tactical strategy against the incoming orbital fleet?',
      'How do you keep absolute composure during high-speed atmospheric re-entry?'
    ]
  };

  const currentStarters = promptStarters[activeCharacter.id] || [
    'Tell me about your background and core skills!',
    'How do you approach a difficult challenge?',
    'What should our team focus on right now?'
  ];

  const handleExportMarkdown = () => {
    if (!conversation || conversation.messages.length === 0) return;
    let md = `# Conversation with ${activeCharacter.name} (${activeCharacter.title})\n`;
    md += `Model: ${activeModel}\nDate: ${new Date(conversation.createdAt).toLocaleString()}\n\n---\n\n`;
    
    for (const msg of conversation.messages) {
      const sender = msg.role === 'user' ? 'User' : activeCharacter.name;
      md += `### ${sender}\n\n${msg.content}\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${activeCharacter.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden relative">
      
      {/* Top Header Bar */}
      <header className="h-16 px-3 sm:px-6 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        
        {/* Left: Back to Grid Home + Hamburger + Character Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={onBackToHomeGrid}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            title="Return to Anime Heroines Grid"
          >
            <Grid className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Heroines Grid</span>
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={activeCharacter.avatar}
                alt={activeCharacter.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border border-pink-500/40 shadow-sm"
              />
              {isLockedIn && (
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-neutral-950 flex items-center justify-center shadow-xs"
                  title="Directives Locked In"
                >
                  <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-neutral-100 truncate">
                  {activeCharacter.name}
                </h1>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border hidden sm:inline font-semibold ${activeCharacter.emotionColor || 'text-pink-400 bg-pink-500/15 border-pink-500/30'}`}>
                  ✦ {activeCharacter.emotion || 'Warm & Expressive'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate">
                {activeCharacter.title}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Pick Anime Heroine in Grid Boxes */}
          <button
            onClick={onOpenAnimeGrid}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            title="Open Anime Character Grid"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anime Grid</span>
          </button>

          {/* Toggle Character Description Box */}
          <button
            onClick={() => setIsDescriptionBoxOpen(!isDescriptionBoxOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isDescriptionBoxOpen
                ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850'
            }`}
            title="Toggle Character Description Box"
          >
            <Edit3 className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Character Description</span>
            {isDescriptionBoxOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Active Model pill */}
          <button
            onClick={onOpenSettings}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs font-mono text-neutral-300 hover:text-neutral-100 transition-colors"
            title="Active OpenRouter model. Click to edit in Settings."
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate max-w-[130px]">{activeModel.split('/').pop()}</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent hover:border-neutral-750 transition-colors"
            title="OpenRouter Engine & API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Export Markdown */}
          {messages.length > 0 && (
            <button
              onClick={handleExportMarkdown}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors hidden sm:inline-block"
              title="Export Conversation Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

        </div>

      </header>

      {/* IN-CHAT CHARACTER DESCRIPTION & LOCK IN BOX */}
      {isDescriptionBoxOpen && (
        <div className="bg-neutral-900/95 border-b border-neutral-800 p-4 shrink-0 transition-all shadow-xl">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-pink-500/40 shrink-0">
                  <img
                    src={activeCharacter.avatar}
                    alt={activeCharacter.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-100">
                    {activeCharacter.name} · Character Persona & Directives
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Input how you want your character to act, speech mannerisms, and backstory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lockInToast && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Locked In!
                  </span>
                )}
                {isLockedIn ? (
                  <button
                    type="button"
                    onClick={() => setIsLockedIn(false)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5 text-pink-400" />
                    <span>Unlock & Edit</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveAndLockIn}
                    className="px-3.5 py-1.5 bg-pink-500 hover:bg-pink-400 text-neutral-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Lock In Character</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={descriptionInput}
              disabled={isLockedIn}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Input character personality, speech habits, background, what they always/never say..."
              className={`w-full p-3 rounded-xl text-xs font-sans leading-relaxed outline-none transition-all ${
                isLockedIn
                  ? 'bg-neutral-950/80 border border-neutral-800 text-neutral-300 opacity-90 cursor-not-allowed'
                  : 'bg-neutral-950 border border-pink-500/60 focus:ring-1 focus:ring-pink-500 text-neutral-100'
              }`}
            />

            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>
                {isLockedIn
                  ? 'Status: Locked In · Active prompt injected into OpenRouter system message'
                  : 'Editing mode · Click "Lock In Character" when ready to seal directives'}
              </span>
              <button
                type="button"
                onClick={() => setIsDescriptionBoxOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Missing Notification Banner */}
      {!adminSettings.openRouterApiKey && (
        <div className="bg-pink-500/10 border-b border-pink-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-pink-300 shrink-0">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-pink-400 shrink-0" />
            <span>OpenRouter API Key required. Connect your key to generate responses.</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1 bg-pink-500 text-neutral-950 font-semibold rounded-md hover:bg-pink-400 transition-colors shrink-0"
          >
            Configure Key
          </button>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6">
            <div className="max-w-xl w-full text-center space-y-6">
              
              {/* Character Card Hero */}
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={activeCharacter.avatar}
                    alt={activeCharacter.name}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-2xl mx-auto object-cover border-2 border-pink-500/40 shadow-xl"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 text-neutral-950 flex items-center justify-center shadow-md">
                    <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-100">{activeCharacter.name}</h2>
                  <p className="text-xs text-pink-400 font-medium mt-0.5">{activeCharacter.title}</p>
                </div>
                
                {/* Character Lock Badge & Description box trigger */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsDescriptionBoxOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 hover:border-pink-500/50 text-[11px] text-neutral-300 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                    <span>View / Edit Character Description</span>
                  </button>
                  <button
                    onClick={onOpenAnimeGrid}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300 hover:bg-pink-500/20 transition-colors"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Switch Character in Grid</span>
                  </button>
                </div>
              </div>

              {/* Greeting */}
              <div className="p-4 bg-neutral-900/80 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 italic leading-relaxed text-left">
                "{activeCharacter.greetingMessage}"
              </div>

              {/* Prompt Starters */}
              <div className="space-y-2 text-left">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Suggested inquiries for {activeCharacter.name}:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {currentStarters.map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => onSendMessage(starter)}
                      className="text-left p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 text-xs text-neutral-300 transition-all flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{starter}</span>
                      <Sparkles className="w-3.5 h-3.5 text-neutral-500 group-hover:text-pink-400 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="pb-6">
            {messages.map((msg, index) => {
              const isLastAssistant = !isStreaming && index === messages.length - 1 && msg.role === 'assistant';
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  character={activeCharacter}
                  isLastAssistantMessage={isLastAssistant}
                  onRegenerate={onRegenerate}
                  onEditMessage={(newText) => onEditMessage(msg.id, newText)}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Composer */}
      <div className="border-t border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md p-3 md:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          
          {/* Active Voice Input Status Banner */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="font-medium">Listening... Speak to {activeCharacter.name}</span>
              </div>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className="text-[11px] underline hover:text-white"
              >
                Stop Listening
              </button>
            </div>
          )}

          {speechStatus && !isListening && (
            <div className="text-[11px] text-amber-300 px-2 py-0.5 font-medium">
              {speechStatus}
            </div>
          )}

          {/* Textarea Box */}
          <div className={`relative bg-neutral-950 border rounded-2xl shadow-inner transition-all flex items-end p-2 ${
            isListening ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-neutral-800 focus-within:border-pink-500/80'
          }`}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? `Listening... speak your message to ${activeCharacter.name}` : `Converse with ${activeCharacter.name}... (Press Enter to send or use Mic)`}
              className="flex-1 max-h-40 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 outline-none resize-none px-2.5 py-1.5 leading-relaxed"
            />

            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              {/* Voice-to-Text Microphone Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-400'
                    : 'text-neutral-400 hover:text-pink-400 hover:bg-neutral-850'
                }`}
                title={
                  isListening
                    ? 'Listening... click to stop recording'
                    : 'Voice-to-text input (Web Speech API)'
                }
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Square className="w-3 h-3 fill-rose-300" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-2 bg-pink-500 hover:bg-pink-400 disabled:opacity-30 disabled:hover:bg-pink-500 text-neutral-950 rounded-xl transition-all shadow-sm"
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 font-mono">
            <span>Model: {activeModel.split('/').pop()}</span>
            <div className="flex items-center gap-1 text-neutral-400">
              <Lock className="w-3 h-3 text-pink-500" />
              <span>Locked In ({activeCharacter.name})</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
