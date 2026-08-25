// Database types for CD TRACK in B.A.N. (Brilliant Artificial Navigator)

export type UserRole = 'admin' | 'user';
export type EventPriority = 'low' | 'medium' | 'high';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';
export type ReminderPriority = 'low' | 'medium' | 'high';
export type NotificationType = 'announcement' | 'deadline' | 'event' | 'assignment' | 'reminder' | 'general';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  role: UserRole;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CDEvent {
  id: string;
  title: string;
  description: string | null;
  category: string;
  date: string;
  time: string | null;
  end_time: string | null;
  location: string | null;
  priority: EventPriority;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_pinned: boolean;
  is_important: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time: string;
  repeat: ReminderRepeat;
  priority: ReminderPriority;
  completed: boolean;
  notification_enabled: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  type: NotificationType;
  ref_id: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  event_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  totalAnnouncements: number;
  pinnedAnnouncements: number;
  pendingReminders: number;
  completedReminders: number;
  totalNotes: number;
  totalProfiles: number;
  unreadNotifications: number;
}

// Chat types
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Voice states
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';
