'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Zap } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { useDashboardStats } from '@/lib/hooks/useDashboardStats';
import ChatMessageBubble from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  onClose: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { stats } = useDashboardStats();
  const { messages, streaming, sendMessage, clearMessages, stopStreaming } = useChat(stats);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-96 max-w-[90vw] glass-strong border-l border-white/8 flex flex-col h-full z-30 shrink-0"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center glow-blue">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">B.A.N.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <p className="text-[10px] text-slate-400">Read-only monitor • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="chat-clear"
            onClick={clearMessages}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            id="chat-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.map(msg => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {streaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center shrink-0 mt-1">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="glass border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 bg-primary-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        streaming={streaming}
      />
    </motion.aside>
  );
}
