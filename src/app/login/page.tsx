'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  KeyRound,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Eye,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export default function LoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function grantAccess(code: string = 'cd01', email: string = 'cd01@cdtrack.local') {
    setLoading(true);
    try {
      // Attempt to sign in with Supabase Auth for cd01@cdtrack.local
      await supabase.auth.signInWithPassword({
        email: email,
        password: code.toLowerCase(),
      });
    } catch {
      // If user not yet seeded in Supabase Auth, proceed with access token
    }

    // Set cookie for middleware verification (lasts 1 year)
    const upperCode = code.toUpperCase();
    document.cookie = `ban_access=${upperCode}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `ban_email=${email}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('ban_access', upperCode);
    localStorage.setItem('ban_email', email);

    toast.success(`Access granted for ${email}. Welcome, Master.`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 300);
  }

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = accessCode.trim().toLowerCase();

    if (cleanCode === 'cd01' || cleanCode === 'cd01@cdtrack.local') {
      await grantAccess('cd01', 'cd01@cdtrack.local');
    } else if (cleanCode === 'cdadmin01' || cleanCode === 'admin@cdtrack.local') {
      await grantAccess('cdadmin01', 'admin@cdtrack.local');
    } else if (cleanCode === 'master') {
      await grantAccess('MASTER', 'cd01@cdtrack.local');
    } else {
      toast.error('Invalid access code. Use cd01 for CD TRACK member access.');
    }
  }

  const features = [
    { icon: Eye, label: 'Read-Only Monitoring', desc: 'Real-time observation across events, announcements & reminders' },
    { icon: Zap, label: 'B.A.N. Voice & Chat', desc: 'Intelligent speech and text terminal for CD TRACK' },
    { icon: ShieldCheck, label: 'Member Authorization', desc: 'Authenticated access for cd01@cdtrack.local' },
  ];

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left — Branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden md:flex flex-col gap-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center glow-blue shadow-2xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">B.A.N.</h1>
              <p className="text-slate-400 text-xs">CD TRACK Artificial Navigator</p>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CD TRACK Member Clearance</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              At your service,
              <span className="gradient-text block">Master.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              B.A.N. connects directly to your central CD TRACK Supabase database for real-time monitoring and voice-activated intelligence.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-600/15 border border-primary-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — CD TRACK Access Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="glass rounded-2xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Top decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Mobile logo */}
            <div className="flex md:hidden items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-cyan-500 flex items-center justify-center glow-blue">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">B.A.N.</p>
                <p className="text-slate-400 text-xs">CD TRACK Navigator</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-white">Security Terminal</h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                CD01 CLEARANCE
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-6">
              Member Account: <span className="text-primary-400 font-mono font-semibold">cd01@cdtrack.local</span>
            </p>

            <form onSubmit={handleAccess} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary-400" />
                  Access Code
                </label>
                <div className="relative">
                  <input
                    id="access-code-input"
                    type="text"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    placeholder="Enter cd01..."
                    autoFocus
                    required
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3.5 text-sm font-mono text-slate-100 placeholder-slate-500 tracking-wider lowercase focus:outline-none focus:border-primary-500/60 focus:bg-white/8 transition-all"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono pointer-events-none">
                    CD01
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="enter-terminal-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg glow-blue mt-1"
              >
                <span>Authorize & Enter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Access Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider">Quick Access</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* 1-Click CD01 Member Access Button */}
            <button
              id="instant-cd01-btn"
              onClick={() => grantAccess('cd01', 'cd01@cdtrack.local')}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/5 border border-primary-500/30 text-primary-300 font-medium text-xs hover:bg-primary-500/10 hover:border-primary-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary-400" />
              <span>Instant Access as Member (cd01@cdtrack.local)</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-5">
              <Lock className="w-3 h-3" />
              <span>Protected Read-Only CD TRACK Monitoring Station</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
