'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoice } from '@/lib/hooks/useVoice';
import { useChat } from '@/lib/hooks/useChat';
import { useDashboardStats } from '@/lib/hooks/useDashboardStats';
import VoiceOrb from './VoiceOrb';
import { cn } from '@/lib/utils';

interface VoiceModalProps {
  onClose: () => void;
}

const STATE_LABELS = {
  idle: 'Tap the mic to start',
  listening: 'Listening…',
  thinking: 'B.A.N. is thinking…',
  speaking: 'Speaking…',
};

export default function VoiceModal({ onClose }: VoiceModalProps) {
  const { stats } = useDashboardStats();
  const { sendMessage, streaming } = useChat(stats);
  const [lastResponse, setLastResponse] = useState('');
  const [transcript, setTranscript] = useState('');

  const {
    voiceState,
    setVoiceState,
    amplitude,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    transcript: liveTranscript,
  } = useVoice(async (text) => {
    setTranscript(text);
    setVoiceState('thinking');

    // Fetch AI response
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          stats,
        }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) fullText += parsed.content;
          } catch { /* skip */ }
        }
      }

      setLastResponse(fullText);
      speak(fullText, () => setVoiceState('idle'));
    } catch {
      setVoiceState('idle');
    }
  });

  function handleMicToggle() {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'speaking') {
      stopSpeaking();
    } else if (voiceState === 'idle') {
      setTranscript('');
      setLastResponse('');
      startListening();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(20px)' }}
    >
      {/* Close */}
      <button
        id="voice-modal-close"
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-xl glass border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-8 px-6 max-w-md w-full">
        {/* Orb */}
        <VoiceOrb state={voiceState} amplitude={amplitude} />

        {/* State label */}
        <div className="text-center">
          <motion.p
            key={voiceState}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-medium text-white"
          >
            {STATE_LABELS[voiceState]}
          </motion.p>

          {/* Live transcript */}
          <AnimatePresence>
            {(liveTranscript || transcript) && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-400 mt-2 max-w-xs text-center"
              >
                "{liveTranscript || transcript}"
              </motion.p>
            )}
          </AnimatePresence>

          {/* Last response */}
          <AnimatePresence>
            {lastResponse && voiceState === 'speaking' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 glass rounded-xl p-4 border border-white/8 text-left max-w-sm"
              >
                <p className="text-xs text-slate-400 line-clamp-4">{lastResponse}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Mic button */}
          <motion.button
            id="voice-mic-btn"
            onClick={handleMicToggle}
            whileTap={{ scale: 0.92 }}
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-all',
              voiceState === 'idle'
                ? 'bg-primary-600 hover:bg-primary-500 glow-blue shadow-2xl'
                : voiceState === 'listening'
                ? 'bg-red-500 hover:bg-red-400'
                : voiceState === 'speaking'
                ? 'bg-cyan-600 hover:bg-cyan-500'
                : 'bg-navy-800 cursor-not-allowed'
            )}
            disabled={voiceState === 'thinking'}
          >
            {voiceState === 'speaking' ? (
              <Volume2 className="w-6 h-6 text-white" />
            ) : voiceState === 'listening' ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        <p className="text-xs text-slate-600 text-center">
          B.A.N. voice is read-only — it monitors and reports your data
        </p>
      </div>
    </motion.div>
  );
}
