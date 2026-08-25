'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { VoiceState } from '@/types';
import { cn } from '@/lib/utils';

interface VoiceOrbProps {
  state: VoiceState;
  amplitude?: number; // 0..1
}

const STATE_CONFIG = {
  idle: {
    scale: 1,
    glow: 'rgba(37,99,235,0.3)',
    color1: '#1e40af',
    color2: '#0891b2',
  },
  listening: {
    scale: 1.05,
    glow: 'rgba(37,99,235,0.5)',
    color1: '#2563eb',
    color2: '#06b6d4',
  },
  thinking: {
    scale: 1.02,
    glow: 'rgba(99,102,241,0.5)',
    color1: '#4f46e5',
    color2: '#7c3aed',
  },
  speaking: {
    scale: 1.08,
    glow: 'rgba(6,182,212,0.5)',
    color1: '#0891b2',
    color2: '#2563eb',
  },
};

export default function VoiceOrb({ state, amplitude = 0 }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const cfg = STATE_CONFIG[state];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 240;
    canvas.height = 240;

    function drawWaveform(time: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseR = 80;

      // Only draw waveform in speaking state
      if (state !== 'speaking' && state !== 'listening') return;

      const numPoints = 120;
      const amp = state === 'speaking' ? (amplitude * 24 + 4) : (amplitude * 10 + 2);

      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const noise =
          Math.sin(angle * 4 + time * 3) * amp * 0.5 +
          Math.sin(angle * 7 - time * 2) * amp * 0.3 +
          Math.sin(angle * 2 + time * 1.5) * amp * 0.2;
        const r = baseR + noise;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, baseR + amp);
      gradient.addColorStop(0, cfg.color1 + 'aa');
      gradient.addColorStop(1, cfg.color2 + '44');
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = cfg.color2 + 'cc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    function animate(ts: number) {
      timeRef.current = ts / 1000;
      drawWaveform(timeRef.current);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, amplitude, cfg]);

  return (
    <div className="relative flex items-center justify-center w-60 h-60">
      {/* Ambient glow layers */}
      <motion.div
        animate={{
          scale: state === 'idle' ? [1, 1.1, 1] : [1, 1.2, 1],
          opacity: state === 'idle' ? [0.3, 0.4, 0.3] : [0.5, 0.7, 0.5],
        }}
        transition={{ repeat: Infinity, duration: state === 'thinking' ? 1.5 : 3, ease: 'easeInOut' }}
        className="absolute w-48 h-48 rounded-full blur-3xl"
        style={{ background: cfg.glow }}
      />

      {/* Outer ring — thinking spinner */}
      {state === 'thinking' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="absolute w-52 h-52 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, #4f46e5 25%, transparent 50%, #06b6d4 75%, transparent 100%)',
            maskImage: 'radial-gradient(circle at 50% 50%, transparent 45%, black 46%, black 50%, transparent 51%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent 45%, black 46%, black 50%, transparent 51%)',
          }}
        />
      )}

      {/* Listening rings */}
      {state === 'listening' && (
        <>
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1 + i * 0.25, opacity: 0 }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
              className="absolute w-40 h-40 rounded-full border border-primary-400/40"
            />
          ))}
        </>
      )}

      {/* Canvas waveform */}
      <canvas
        ref={canvasRef}
        className="absolute"
        style={{ width: 240, height: 240 }}
      />

      {/* Main orb */}
      <motion.div
        animate={{
          scale: state === 'idle' ? [1, 1.04, 1] : cfg.scale,
        }}
        transition={
          state === 'idle'
            ? { repeat: Infinity, duration: 4, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 200, damping: 20 }
        }
        className="relative w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${cfg.color1}, ${cfg.color2})`,
          boxShadow: `0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}40, inset 0 0 30px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Inner highlight */}
        <div
          className="absolute top-4 left-6 w-8 h-5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)', filter: 'blur(6px)' }}
        />

        {/* B.A.N. label */}
        <div className="text-center z-10">
          <p className="text-white font-bold text-lg leading-none text-glow">B</p>
          <p className="text-white/60 text-[9px] leading-none mt-0.5 font-medium">B.A.N.</p>
        </div>
      </motion.div>
    </div>
  );
}
