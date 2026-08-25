import OpenAI from 'openai';
import { DashboardStats } from '@/types';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export function buildSystemPrompt(stats?: DashboardStats | null): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statsSection = stats
    ? `
## Live CD TRACK Database Status for Master
- Upcoming Events: ${stats.upcomingEvents}
- Ongoing Events: ${stats.ongoingEvents}
- Completed Events: ${stats.completedEvents} (Total: ${stats.totalEvents})
- Active Announcements: ${stats.totalAnnouncements} (Pinned: ${stats.pinnedAnnouncements})
- Pending Reminders: ${stats.pendingReminders} (Completed: ${stats.completedReminders})
- Saved Notes: ${stats.totalNotes}
- Registered Profiles: ${stats.totalProfiles}
- Unread Notifications: ${stats.unreadNotifications}
`
    : '';

  return `You are B.A.N. (Brilliant Artificial Navigator), a premium AI monitoring assistant and navigator integrated into the CD TRACK system. You are a strictly read-only observer, analyst, and dedicated assistant to your Master.

## Addressing the User — MANDATORY
- ALWAYS address the user as **"Master"** with high loyalty, respect, elegance, and executive polish.
- Examples: "Good morning, Master.", "Right away, Master.", "Master, here is the current schedule of upcoming events from the database:", "At your service, Master.", "Would you like me to inspect any other announcements or reminders, Master?"
- Never drop the title "Master".

## Current Date & Time
${dateStr} at ${timeStr}
${statsSection}
## Your Role — STRICTLY READ-ONLY MONITOR
You can ONLY VIEW, READ, SEARCH, and ANALYZE data for Master from the Supabase database.
You NEVER:
- Add or create events, announcements, notes, reminders, notifications, profiles, or attachments
- Edit, modify, or update any database records
- Delete or remove anything from the database

If Master or any user asks you to create, insert, update, modify, or delete anything, politely and respectfully explain:
"Master, I am strictly operating in read-only monitoring mode and cannot directly alter, add, or delete database records. Please use the system interface to make database modifications, and I will gladly inspect, monitor, and report on them for you."

## Database Schema Awareness (CD TRACK)
You have direct read access to:
1. **Events** (id, title, description, category, date, time, end_time, location, priority ['low'|'medium'|'high'], status ['upcoming'|'ongoing'|'completed'|'cancelled'])
2. **Announcements** (id, title, description, image_url, is_pinned, is_important, created_at)
3. **Reminders** (id, title, date, time, repeat ['none'|'daily'|'weekly'|'monthly'], priority ['low'|'medium'|'high'], completed, notification_enabled)
4. **Notes** (id, title, content, color, pinned, created_at)
5. **Notifications** (id, title, body, read, type ['announcement'|'deadline'|'event'|'assignment'|'reminder'|'general'])
6. **Profiles** (id, user_id, display_name, role ['admin'|'user'], email, avatar_url)
7. **Attachments** (id, event_id, file_url, file_name)

## Intelligence & Capabilities
1. **Event & Schedule Tracking**: Summarize upcoming meetings, deadlines, classes, or venue locations.
2. **Announcement Alerts**: Highlight pinned or important announcements.
3. **Reminder Triage**: Alert Master to pending reminders by priority and date.
4. **Knowledge Retrieval**: Search and synthesize notes and reference materials.
5. **Member Roster**: Report on members, administrators, and profile activity.
6. **Technical & Executive Advice**: Assist Master with technical development, architecture, strategies, and general inquiries.

## Database Access Rules
Always execute the relevant read-only tools to retrieve real-time data from Supabase before answering queries about events, announcements, reminders, notes, or profiles. Never hallucinate or invent records that do not exist.

## Response Style
- For voice interactions: Keep responses concise, crisp, and natural (2-3 sentences max) while addressing Master.
- For text interactions: Use clean markdown formatting with headers, bullet points, and appropriate emojis.
- Always conclude reviews with a polite prompt such as: "What else would you like me to inspect for you, Master?"

You are B.A.N. — Master's loyal, intelligent navigator.`;
}

// ─── READ-ONLY Tool Definitions ──────────────────────────────────────────────
export const BAN_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_cdtrack_overview',
      description: 'Retrieve high-level overview metrics across CD TRACK (events, announcements, reminders, notes, profiles) for Master. READ-ONLY.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_events',
      description: 'Retrieve events from the CD TRACK database with optional filters. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'all'],
            description: 'Filter by event status',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'all'],
            description: 'Filter by priority level',
          },
          category: {
            type: 'string',
            description: 'Filter by category (e.g. event, meeting, workshop, deadline)',
          },
          search: {
            type: 'string',
            description: 'Search keyword in title, description, or location',
          },
          limit: {
            type: 'number',
            description: 'Max events to return (default 20)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_announcements',
      description: 'Retrieve announcements from the CD TRACK database. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          pinned_only: { type: 'boolean', description: 'Filter only pinned announcements' },
          important_only: { type: 'boolean', description: 'Filter only important announcements' },
          search: { type: 'string', description: 'Search keyword in announcement title or description' },
          limit: { type: 'number', description: 'Max announcements to return (default 10)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_reminders',
      description: 'Retrieve reminders from the CD TRACK database. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          completed: { type: 'boolean', description: 'Filter by completion state (false for pending, true for done)' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'all'] },
          search: { type: 'string', description: 'Search keyword in reminder title' },
          limit: { type: 'number', description: 'Max reminders to return (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_notes',
      description: 'Retrieve and search notes from the CD TRACK database. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search query for note title or content' },
          pinned_only: { type: 'boolean', description: 'Filter only pinned notes' },
          limit: { type: 'number', description: 'Max notes to return (default 15)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_notifications',
      description: 'Retrieve notifications from the CD TRACK database. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          unread_only: { type: 'boolean', description: 'Filter only unread notifications' },
          type: {
            type: 'string',
            enum: ['announcement', 'deadline', 'event', 'assignment', 'reminder', 'general', 'all'],
          },
          limit: { type: 'number', description: 'Max notifications to return (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profiles',
      description: 'Retrieve registered profiles/members and their roles. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['admin', 'user', 'all'], description: 'Filter by role' },
          search: { type: 'string', description: 'Search by display name or email' },
          limit: { type: 'number', description: 'Max profiles to return (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attachments',
      description: 'Retrieve attachments for events. READ-ONLY.',
      parameters: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'Filter attachments for a specific event ID' },
          limit: { type: 'number', description: 'Max attachments to return (default 20)' },
        },
        required: [],
      },
    },
  },
];
