'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Mic, Lock, Zap, Database, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  onChatToggle: () => void;
  onVoiceToggle: () => void;
  chatOpen: boolean;
}

export default function Header({ onChatToggle, onVoiceToggle, chatOpen }: HeaderProps) {
  const supabase = createClient();

  async function handleLockTerminal() {
    try {
      await supabase.auth.signOut();
    } catch {}
    document.cookie = 'ban_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('ban_access');
    toast.success('Terminal locked. Goodbye, Master.');
    setTimeout(() => {
      window.location.href = '/login';
    }, 300);
  }

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-16 glass-strong border-b border-white/8 shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center glow-blue shrink-0 shadow-lg">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-wide leading-none">B.A.N.</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400">
              VOICE & CHAT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-none mt-1 hidden sm:block">
            Brilliant Artificial Navigator • CD TRACK Read-Only Terminal
          </p>
        </div>
      </div>

      {/* Center status indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-slate-300">
        <Database className="w-3.5 h-3.5 text-cyan-400" />
        <span>Supabase:</span>
        <span className="text-green-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live Read-Only
        </span>
        <span className="text-slate-600">|</span>
        <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
        <span className="text-primary-300 font-medium">Master Auth</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Voice Trigger */}
        <motion.button
          id="voice-header-btn"
          onClick={onVoiceToggle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-600/30 to-cyan-500/30 border border-primary-500/40 text-primary-300 hover:from-primary-600/40 hover:to-cyan-500/40 transition-all text-xs font-semibold shadow-md"
          title="Open Voice Interface"
        >
          <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Voice Mode</span>
        </motion.button>

        {/* Chat Drawer Toggle */}
        <button
          id="chat-header-btn"
          onClick={onChatToggle}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all',
            chatOpen
              ? 'bg-primary-600/30 border-primary-500/50 text-primary-200'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8 hover:border-white/20'
          )}
          title="Toggle Chat Drawer"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Ask B.A.N.</span>
        </button>

        {/* Lock Terminal */}
        <button
          id="lock-terminal-header"
          onClick={handleLockTerminal}
          className="p-2 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
          title="Lock Terminal"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
