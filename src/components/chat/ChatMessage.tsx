'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { timeAgo } from '@/lib/utils/dates';

interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3', isAssistant ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar */}
      {isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center shrink-0 mt-1 glow-blue">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
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

        <p className={cn(
          'text-[10px] mt-1.5',
          isAssistant ? 'text-slate-600' : 'text-primary-400/60'
        )}>
          {timeAgo(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
