'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Megaphone,
  Bell,
  FileText,
  Users,
  Clock,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  Crown,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Pin,
  ExternalLink,
  Shield,
  Eye,
  Settings2,
  Sliders,
} from 'lucide-react';
import { useDashboardStats, useCDTrackData } from '@/lib/hooks/useDashboardStats';
import { useVoice } from '@/lib/hooks/useVoice';
import { useChat } from '@/lib/hooks/useChat';
import StatCard from '@/components/dashboard/StatCard';
import VoiceOrb from '@/components/voice/VoiceOrb';
import ChatMessageBubble from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { getGreeting } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

type ActiveTab = 'chat' | 'events' | 'announcements' | 'reminders' | 'notes' | 'profiles';

export default function DashboardPage() {
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { events, announcements, reminders, notes, profiles, loading: dataLoading, refetch: refetchData } = useCDTrackData();
  const { messages, streaming, sendMessage, clearMessages, stopStreaming } = useChat(stats);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [searchQuery, setSearchQuery] = useState('');

  // Voice integration
  const [lastVoiceResponse, setLastVoiceResponse] = useState('');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const {
    voiceState,
    setVoiceState,
    amplitude,
    availableVoices,
    selectedVoiceId,
    setSelectedVoiceId,
    rate,
    setRate,
    pitch,
    setPitch,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    transcript: liveTranscript,
  } = useVoice(async (text) => {
    setVoiceState('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          stats,
        }),
      });

      if (!res.body) {
        setVoiceState('idle');
        return;
      }
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
          } catch {}
        }
      }

      setLastVoiceResponse(fullText);
      await speak(fullText, () => setVoiceState('idle'));
    } catch {
      setVoiceState('idle');
    }
  });

  function handleVoiceToggle() {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'speaking') {
      stopSpeaking();
    } else if (voiceState === 'idle') {
      setLastVoiceResponse('');
      startListening();
    }
  }

  function handleTestVoice() {
    if (voiceState === 'speaking') {
      stopSpeaking();
    } else {
      speak(`Good day, Master. I am B.A.N., your artificial navigator. How does this voice sound to you?`);
    }
  }

  function handleVoiceChange(newId: string) {
    setSelectedVoiceId(newId);
    setTimeout(() => {
      speak(`Voice profile updated, Master.`);
    }, 150);
  }

  function handleRefreshAll() {
    refetchStats();
    refetchData();
  }

  const STAT_CARDS = stats
    ? [
        { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, color: 'blue' as const, delay: 0 },
        { label: 'Announcements', value: stats.totalAnnouncements, icon: Megaphone, color: 'purple' as const, delay: 0.05 },
        { label: 'Pending Reminders', value: stats.pendingReminders, icon: Clock, color: 'orange' as const, delay: 0.1 },
        { label: 'Saved Notes', value: stats.totalNotes, icon: FileText, color: 'cyan' as const, delay: 0.15 },
        { label: 'Registered Members', value: stats.totalProfiles, icon: Users, color: 'green' as const, delay: 0.2 },
        { label: 'Unread Alerts', value: stats.unreadNotifications, icon: Bell, color: 'red' as const, delay: 0.25 },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Greeting & Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass rounded-2xl p-5 border border-white/8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-primary-400 font-mono text-[11px] font-semibold flex items-center gap-1.5 bg-primary-500/10 px-2.5 py-1 rounded-full border border-primary-500/20">
              <Crown className="w-3.5 h-3.5 text-primary-400" />
              MASTER CONTROL ACTIVE
            </span>
            <span className="text-slate-500 text-xs font-mono hidden sm:inline">•</span>
            <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Strict Read-Only Mode
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {getGreeting()}, Master.
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            B.A.N. is connected to your Supabase CD TRACK database. Voice & Chat intelligence standing by.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            id="refresh-all-btn"
            onClick={handleRefreshAll}
            className="px-3.5 py-2 rounded-xl glass border border-white/10 text-slate-300 hover:text-white hover:bg-white/8 transition-all flex items-center gap-2 text-xs font-medium"
            title="Refresh database records"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', (statsLoading || dataLoading) && 'animate-spin')} />
            <span>Sync Supabase</span>
          </button>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <section>
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 border border-white/5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAT_CARDS.map(card => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        )}
      </section>

      {/* Dual Core Station: Voice Orb & Interactive Chat Terminal */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Hero Voice Console (5 Cols) */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-5 flex flex-col glass rounded-2xl border border-white/10 p-6 relative overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Voice Command Station</h3>
                <p className="text-[11px] text-slate-400">Live Speech Interaction</p>
              </div>
            </div>
            <span
              className={cn(
                'text-[10px] font-mono px-2.5 py-1 rounded-full border',
                voiceState === 'listening'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                  : voiceState === 'speaking'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                  : voiceState === 'thinking'
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/40 animate-pulse'
                  : 'bg-white/5 text-slate-400 border-white/10'
              )}
            >
              {voiceState.toUpperCase()}
            </span>
          </div>

          {/* Voice Engine Selector & Settings Toggle */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/8 text-xs mb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-slate-400 text-[11px] shrink-0 font-medium">Voice:</span>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="bg-slate-900/90 border border-white/12 text-cyan-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-400 font-medium w-full truncate"
                  title="Choose your preferred assistant voice"
                >
                  {availableVoices.length === 0 ? (
                    <option value="">Loading system voices...</option>
                  ) : (
                    availableVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.isNatural ? '✨ ' : ''}{v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className={cn(
                    'p-1.5 rounded-lg border transition-all',
                    showVoiceSettings
                      ? 'bg-primary-500/25 border-primary-500/40 text-primary-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  )}
                  title="Voice Tuning (Speed & Pitch)"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleTestVoice}
                  disabled={voiceState === 'thinking'}
                  className="px-2.5 py-1 rounded-lg bg-primary-500/15 hover:bg-primary-500/25 border border-primary-500/30 text-primary-300 text-[11px] font-medium transition-all flex items-center gap-1 shrink-0"
                  title="Test selected voice"
                >
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>{voiceState === 'speaking' ? 'Stop' : 'Test'}</span>
                </button>
              </div>
            </div>

            {/* Expandable Voice Tuning Controls */}
            <AnimatePresence>
              {showVoiceSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2.5 border-t border-white/8 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Speed / Pace: <strong className="text-cyan-300 font-mono">{rate.toFixed(2)}x</strong></span>
                    <span>Pitch: <strong className="text-primary-300 font-mono">{pitch.toFixed(2)}</strong></span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="range"
                        min="0.75"
                        max="1.3"
                        step="0.05"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <input
                        type="range"
                        min="0.75"
                        max="1.25"
                        step="0.05"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full accent-primary-400 h-1 bg-white/10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Orb */}
          <div className="my-3 flex flex-col items-center justify-center">
            <VoiceOrb state={voiceState} amplitude={amplitude} />
            
            <p className="text-xs text-slate-300 font-medium mt-4 text-center">
              {voiceState === 'idle' && 'Tap the mic below to speak to B.A.N.'}
              {voiceState === 'listening' && 'Listening to your command, Master...'}
              {voiceState === 'thinking' && 'Analyzing CD TRACK data...'}
              {voiceState === 'speaking' && 'B.A.N. is speaking...'}
            </p>

            {/* Live Transcript */}
            <AnimatePresence>
              {liveTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 max-w-xs text-center font-mono"
                >
                  "{liveTranscript}"
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Response Text */}
            <AnimatePresence>
              {lastVoiceResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 p-3 rounded-xl glass border border-primary-500/20 text-xs text-slate-200 max-w-sm text-left max-h-36 overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-primary-400 text-[11px]">B.A.N. Spoken Analysis:</p>
                    <button
                      onClick={() => speak(lastVoiceResponse)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Volume2 className="w-2.5 h-2.5" />
                      <span>Replay</span>
                    </button>
                  </div>
                  <p className="line-clamp-4 text-slate-300">{lastVoiceResponse}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mic Action Controls */}
          <div className="mt-auto flex flex-col items-center gap-3 pt-4 border-t border-white/8">
            <motion.button
              id="voice-orb-toggle-btn"
              onClick={handleVoiceToggle}
              whileTap={{ scale: 0.94 }}
              disabled={voiceState === 'thinking'}
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl',
                voiceState === 'idle'
                  ? 'bg-gradient-to-tr from-primary-600 to-cyan-500 hover:from-primary-500 hover:to-cyan-400 text-white glow-blue'
                  : voiceState === 'listening'
                  ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/30 ring-4 ring-red-500/20'
                  : voiceState === 'speaking'
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-white ring-4 ring-cyan-500/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
            >
              {voiceState === 'speaking' ? (
                <Volume2 className="w-7 h-7 animate-pulse" />
              ) : voiceState === 'listening' ? (
                <MicOff className="w-7 h-7 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </motion.button>

            <span className="text-[11px] text-slate-500 text-center">
              {voiceState === 'idle' ? 'Click to speak to Master Navigator' : 'Click to stop / cancel'}
            </span>
          </div>
        </motion.div>

        {/* Right: Embedded Chat Stream Terminal (7 Cols) */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="lg:col-span-7 flex flex-col glass rounded-2xl border border-white/10 h-[560px] shadow-2xl overflow-hidden"
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white">B.A.N. Intelligence Stream</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearMessages}
                className="text-xs px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              >
                Clear Terminal
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
            {messages.map(msg => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                onSpeak={(text) => speak(text)}
                isSpeaking={voiceState === 'speaking'}
              />
            ))}

            {streaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="glass border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary-400 font-mono">B.A.N. reading database</span>
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
              </div>
            )}
          </div>

          {/* Chat Input */}
          <ChatInput
            onSend={sendMessage}
            onStop={stopStreaming}
            streaming={streaming}
            onVoice={handleVoiceToggle}
          />
        </motion.div>
      </div>

      {/* Live CD TRACK Supabase Inspector (Read-Only) */}
      <section className="glass rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Live Supabase Inspector
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  READ-ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400">Direct live view of CD TRACK database records</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'events', label: `Events (${events.length})`, icon: Calendar },
              { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
              { id: 'reminders', label: `Reminders (${reminders.length})`, icon: Clock },
              { id: 'notes', label: `Notes (${notes.length})`, icon: FileText },
              { id: 'profiles', label: `Profiles (${profiles.length})`, icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0',
                    active
                      ? 'bg-primary-600/30 text-primary-300 border border-primary-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {dataLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 border border-white/5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div>
            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No events found in Supabase database.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {events.map(ev => (
                      <div key={ev.id} className="glass rounded-xl p-4 border border-white/8 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                              {ev.category}
                            </span>
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize',
                              ev.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                              ev.priority === 'medium' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-green-500/20 text-green-300'
                            )}>
                              {ev.priority} priority
                            </span>
                          </div>
                          <h4 className="font-semibold text-white text-sm mb-1">{ev.title}</h4>
                          {ev.description && <p className="text-xs text-slate-400 line-clamp-2 mb-2">{ev.description}</p>}
                        </div>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                          <span>📅 {ev.date} {ev.time ? `• ${ev.time}` : ''}</span>
                          <span className="capitalize text-slate-400">{ev.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No announcements found in Supabase database.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {announcements.map(an => (
                      <div key={an.id} className="glass rounded-xl p-4 border border-white/8 flex flex-col justify-between hover:bg-white/[0.04] transition-all">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {an.is_pinned && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Pin className="w-2.5 h-2.5" /> Pinned
                              </span>
                            )}
                            {an.is_important && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> Important
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white text-sm mb-1">{an.title}</h4>
                          <p className="text-xs text-slate-400 line-clamp-3">{an.description}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[11px] text-slate-500 mt-2">
                          Created {new Date(an.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-3">
                {reminders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No reminders found in Supabase database.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {reminders.map(rm => (
                      <div key={rm.id} className="glass rounded-xl p-4 border border-white/8 flex items-start gap-3 hover:bg-white/[0.04] transition-all">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                          rm.completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        )}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn('font-semibold text-sm', rm.completed ? 'line-through text-slate-500' : 'text-white')}>
                            {rm.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            ⏰ {rm.date} at {rm.time} {rm.repeat !== 'none' ? `• Repeats ${rm.repeat}` : ''}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-mono capitalize px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                            Priority: {rm.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No notes found in Supabase database.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {notes.map(nt => (
                      <div
                        key={nt.id}
                        className="glass rounded-xl p-4 border border-white/8 flex flex-col justify-between hover:bg-white/[0.04] transition-all"
                        style={{ borderLeft: `3px solid ${nt.color || '#3b82f6'}` }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="font-semibold text-white text-sm">{nt.title}</h4>
                            {nt.pinned && <Pin className="w-3 h-3 text-amber-400" />}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-4 whitespace-pre-line">{nt.content}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 mt-3">
                          Updated {new Date(nt.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="space-y-3">
                {profiles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No member profiles found in Supabase database.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {profiles.map(pf => (
                      <div key={pf.id} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3 hover:bg-white/[0.04] transition-all">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {pf.display_name?.charAt(0) || 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm truncate">{pf.display_name}</p>
                            <span className={cn(
                              'text-[10px] font-mono px-2 py-0.5 rounded-full uppercase',
                              pf.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-700/50 text-slate-400'
                            )}>
                              {pf.role}
                            </span>
                          </div>
                          {pf.email && <p className="text-xs text-slate-400 truncate mt-0.5">{pf.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
