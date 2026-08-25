'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import ChatPanel from '@/components/chat/ChatPanel';
import VoiceModal from '@/components/voice/VoiceModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-mesh overflow-hidden">
      {/* Header */}
      <Header
        onChatToggle={() => setChatOpen(o => !o)}
        onVoiceToggle={() => setVoiceOpen(true)}
        chatOpen={chatOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Chat Drawer */}
      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-y-0 right-0 z-40 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <ChatPanel onClose={() => setChatOpen(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Voice Modal / Overlay */}
      <AnimatePresence>
        {voiceOpen && (
          <VoiceModal onClose={() => setVoiceOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
