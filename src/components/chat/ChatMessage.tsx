'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { Zap, Volume2, VolumeX } from 'lucide-react';
import { timeAgo } from '@/lib/utils/dates';
import { cleanSpokenText } from '@/lib/hooks/useVoice';

interface ChatMessageProps {
  message: ChatMessage;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export default function ChatMessageBubble({ message, onSpeak, isSpeaking = false }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const [localPlaying, setLocalPlaying] = useState(false);

  function handleSpeakToggle() {
    if (onSpeak) {
      onSpeak(message.content);
      return;
    }

    // Direct fallback speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (localPlaying || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setLocalPlaying(false);
      } else {
        const clean = cleanSpokenText(message.content);
        const utt = new SpeechSynthesisUtterance(clean);
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
          v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Daniel')
        ) || voices[0];

        if (preferred) utt.voice = preferred;
        utt.rate = 1.0;
        utt.pitch = 0.98;

        utt.onend = () => setLocalPlaying(false);
        utt.onerror = () => setLocalPlaying(false);

        setLocalPlaying(true);
        window.speechSynthesis.speak(utt);
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3 group', isAssistant ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar */}
      {isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center shrink-0 mt-1 glow-blue">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3 text-sm relative',
        isAssistant
          ? 'glass border border-white/8 text-slate-200 rounded-tl-sm'
          : 'bg-primary-600/25 border border-primary-500/30 text-slate-100 rounded-tr-sm'
      )}>
        {isAssistant ? (
          <div className="chat-markdown">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="inline-block w-1.5 h-4 bg-primary-400 rounded-sm ml-0.5 align-middle"
              />
            )}
          </div>
        ) : (
          <p>{message.content}</p>
        )}

        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
          <p className={cn(
            'text-[10px]',
            isAssistant ? 'text-slate-500' : 'text-primary-300/60'
          )}>
            {timeAgo(message.timestamp)}
          </p>

          {isAssistant && !message.isStreaming && (
            <button
              onClick={handleSpeakToggle}
              className={cn(
                'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-all',
                localPlaying || isSpeaking
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 opacity-80 group-hover:opacity-100'
              )}
              title={localPlaying || isSpeaking ? 'Stop speaking' : 'Listen aloud'}
            >
              {localPlaying || isSpeaking ? (
                <>
                  <VolumeX className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-medium">Mute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-primary-400" />
                  <span className="text-[10px] font-medium">Listen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
