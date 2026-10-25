import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  User, 
  Sparkles,
  Edit2
} from 'lucide-react';
import { ChatMessage, Character } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: ChatMessage;
  character: Character;
  isLastAssistantMessage?: boolean;
  onRegenerate?: () => void;
  onEditMessage?: (newContent: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  character,
  isLastAssistantMessage,
  onRegenerate,
  onEditMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 1.0;
    utterance.pitch = character.name.includes('Socrates') ? 0.9 : character.name.includes('Nyx') ? 1.05 : 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveEdit = () => {
    if (onEditMessage && editText.trim()) {
      onEditMessage(editText.trim());
      setIsEditing(false);
    }
  };

  const wordCount = message.content ? message.content.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div
      className={`group w-full py-5 px-4 md:px-8 border-b border-neutral-850/40 transition-colors ${
        isUser ? 'bg-neutral-950/40' : 'bg-neutral-900/30'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-5">
        
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-300 shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="relative">
              <img
                src={character.avatar}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover border border-amber-500/30 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Message Main Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          
          {/* Header Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-200">
                {isUser ? 'You' : character.name}
              </span>
              {!isUser && (
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  · {character.title}
                </span>
              )}
            </div>

            {/* Timings / Tokens */}
            <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-2">
              {!isUser && message.modelUsed && (
                <span className="truncate max-w-[140px] text-neutral-400 hidden sm:inline">
                  {message.modelUsed.split('/').pop()}
                </span>
              )}
              {message.latencyMs && (
                <span className="tabular-nums">· {message.latencyMs}ms</span>
              )}
              {wordCount > 0 && (
                <span className="tabular-nums text-neutral-500">· {wordCount} words</span>
              )}
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-200 outline-none focus:border-amber-400"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-amber-400 text-neutral-950 text-xs font-semibold rounded-md hover:bg-amber-300"
                >
                  Save & Resend
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-md hover:bg-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {message.error ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">Generation Error</p>
                    <p>{message.content}</p>
                    {onRegenerate && (
                      <button
                        onClick={onRegenerate}
                        className="mt-1 text-xs text-rose-400 underline font-medium hover:text-rose-300"
                      >
                        Retry request
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}

              {/* Streaming typing cursor */}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Action Row */}
          {!message.isStreaming && !message.error && (
            <div className="flex items-center gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                title="Copy message text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {!isUser && (
                <>
                  <button
                    onClick={handleSpeak}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                    title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {isLastAssistantMessage && onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px]"
                      title="Regenerate response"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              {isUser && onEditMessage && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition-colors"
                  title="Edit prompt"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
