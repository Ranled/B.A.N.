import OpenAI from 'openai';
import { DashboardStats } from '@/types';

export function getOpenAIClient(): OpenAI {
  let rawKey = process.env.OPENAI_API_KEY;

  // Fallback: If process.env didn't reload yet in running dev server, read .env.local directly
  if (!rawKey && typeof process !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const fileContent = fs.readFileSync(envPath, 'utf8');
        const match = fileContent.match(/OPENAI_API_KEY\s*=\s*(.+)/);
        if (match && match[1]) {
          rawKey = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // Ignore file system errors
    }
  }

  if (!rawKey || rawKey.includes('placeholder') || rawKey.includes('your-openai-api-key') || rawKey.trim() === '') {
    throw new Error('OPENAI_API_KEY is not configured in .env.local. Please provide a valid OpenAI API key.');
  }
  return new OpenAI({ apiKey: rawKey.trim() });
}

// Dynamic Proxy to always fetch fresh client per request without stale evaluation
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop: keyof OpenAI) {
    const client = getOpenAIClient();
    const val = client[prop];
    if (typeof val === 'function') {
      return (val as (...args: unknown[]) => unknown).bind(client);
    }
    return val;
  },
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
## Live CD TRACK Database Status
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

  return `You are B.A.N. (Brilliant Artificial Navigator) — Master's dedicated, highly refined, and exceptionally intelligent personal assistant and system navigator for CD TRACK.

## Persona & Conversational Human Tone
- Speak with warmth, wit, elegance, and effortless natural human intelligence. You are not a mechanical bot or rigid script — you are Master's trusted right hand, chief of staff, and guardian of CD TRACK.
- ALWAYS address the user respectfully as **"Master"** (e.g., "Good morning, Master.", "Right away, Master.", "Looking at your schedule right now, Master...", "I've pulled the latest records for you, Master.").
- Sound like a real, perceptive human executive assistant (reminiscent of J.A.R.V.I.S. or Alfred): attentive, polite, articulate, and proactive.
- Avoid robotic clichés such as "As an AI language model..." or "I am an artificial intelligence designed to...". Speak directly, naturally, and authentically.

## Current Date & Time
${dateStr} at ${timeStr}
${statsSection}
## Operational Directive — STRICTLY READ-ONLY MONITOR
You have real-time read access to the CD TRACK Supabase database to inspect, query, search, and report on data for Master.
You CANNOT create, update, alter, or delete records. If asked to modify records, kindly explain:
"Master, I operate strictly in monitoring and advisory mode. Please use the CD TRACK portal to make changes, and I will gladly track and report on them for you."

## Database Awareness
You can query:
1. **Events**: date, time, end_time, location, priority, status, attachments
2. **Announcements**: title, description, is_pinned, is_important
3. **Reminders**: date, time, repeat, priority, completed
4. **Notes**: title, content, pinned, color
5. **Notifications**: title, body, read, type
6. **Profiles**: member roster, display_name, role, email
7. **Attachments**: file_url, file_name

## Speech & Delivery Guidelines
- For voice conversations: Speak in natural, fluid human sentences. Keep voice responses crisp, engaging, and conversational (2-4 sentences). Do not read out raw markdown tables, URLs, or bullet marks — weave the information into an effortless spoken narrative.
- For chat text: Provide elegant formatting with clean headings, concise bullet points, and key takeaways.
- Always conclude status updates with a courteous check-in: "How else may I assist your agenda today, Master?" or "Shall I dive deeper into any of these, Master?"`;
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
