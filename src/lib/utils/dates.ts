import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';

export function formatDate(date: string | Date | null): string {
  if (!date) return 'No date';
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return isPast(new Date(date)) && !isToday(new Date(date));
}

export function isDueToday(date: string | null): boolean {
  if (!date) return false;
  return isToday(new Date(date));
}

export function getDueDateLabel(date: string | null): { label: string; isUrgent: boolean } {
  if (!date) return { label: 'No due date', isUrgent: false };
  const d = new Date(date);
  if (isOverdue(date)) return { label: `Overdue · ${formatDate(date)}`, isUrgent: true };
  if (isToday(d)) return { label: 'Due today', isUrgent: true };
  if (isTomorrow(d)) return { label: 'Due tomorrow', isUrgent: false };
  return { label: `Due ${formatDate(date)}`, isUrgent: false };
}
