'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Square, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  onVoice?: () => void;
}

const SUGGESTIONS = [
  "What upcoming events are scheduled, Master?",
  "Any important announcements, Master?",
  "Show my high-priority reminders",
  "Summarize saved notes",
  "Show registered members and roles",
];

export default function ChatInput({ onSend, onStop, streaming, onVoice }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!value.trim() || streaming) return;
    onSend(value);
    setValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 border-t border-white/8">
      {/* Suggestions */}
      {!streaming && value === '' && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-slate-200 hover:bg-white/8 whitespace-nowrap transition-all flex-shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 glass border border-white/10 rounded-xl overflow-hidden flex items-end focus-within:border-primary-500/40 transition-all">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Command B.A.N. or ask about CD TRACK data..."
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none disabled:opacity-50 min-h-[44px] max-h-[120px]"
          />
        </div>

        {/* Voice */}
        {onVoice && (
          <button
            type="button"
            onClick={onVoice}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all flex items-center justify-center shrink-0"
            title="Start voice interaction"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        {/* Send / Stop */}
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all flex items-center justify-center shrink-0"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            id="chat-send"
            type="submit"
            disabled={!value.trim()}
            className="w-10 h-10 rounded-xl bg-primary-600/25 border border-primary-500/30 text-primary-400 hover:bg-primary-600/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
}
