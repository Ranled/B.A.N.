'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'cyan';
  trend?: string;
  delay?: number;
}

const COLOR_MAP = {
  blue: {
    icon: 'text-primary-400',
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    glow: 'shadow-primary-500/10',
    value: 'text-primary-300',
  },
  red: {
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/10',
    value: 'text-red-300',
  },
  orange: {
    icon: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'shadow-orange-500/10',
    value: 'text-orange-300',
  },
  green: {
    icon: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    glow: 'shadow-green-500/10',
    value: 'text-green-300',
  },
  purple: {
    icon: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'shadow-purple-500/10',
    value: 'text-purple-300',
  },
  cyan: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/10',
    value: 'text-cyan-300',
  },
};

export default function StatCard({ label, value, icon: Icon, color, trend, delay = 0 }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'glass rounded-2xl p-5 border flex flex-col gap-3 cursor-default',
        c.border,
        `shadow-lg ${c.glow}`
      )}
    >
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg)}>
        <Icon className={cn('w-5 h-5', c.icon)} />
      </div>

      {/* Value */}
      <div>
        <motion.p
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={cn('text-3xl font-bold tabular-nums', c.value)}
        >
          {value}
        </motion.p>
        <p className="text-slate-400 text-sm mt-0.5">{label}</p>
      </div>

      {trend && (
        <p className="text-xs text-slate-500">{trend}</p>
      )}
    </motion.div>
  );
}
