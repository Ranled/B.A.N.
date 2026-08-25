import { EventPriority, ReminderPriority } from '@/types';

export function getPriorityConfig(priority: EventPriority | ReminderPriority) {
  switch (priority) {
    case 'high':
      return {
        label: 'High',
        emoji: '🔴',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        dot: 'bg-red-400',
      };
    case 'medium':
      return {
        label: 'Medium',
        emoji: '🟡',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'low':
      return {
        label: 'Low',
        emoji: '🟢',
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        dot: 'bg-green-400',
      };
  }
}
