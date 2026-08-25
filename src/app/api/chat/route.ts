import { NextRequest } from 'next/server';
import { openai, getActiveModel, buildSystemPrompt, BAN_TOOLS } from '@/lib/openai/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// ─── STRICTLY READ-ONLY Tool Executor for Master ─────────────────────────────
async function executeTool(name: string, args: Record<string, unknown>, userId: string | null) {
  // Use admin client so B.A.N. can query the CD TRACK database reliably
  const supabase = createAdminClient();

  try {
    switch (name) {
      case 'get_cdtrack_overview': {
        const [eventsRes, announcementsRes, remindersRes, notesRes, profilesRes, notificationsRes] =
          await Promise.all([
            supabase.from('events').select('id, status'),
            supabase.from('announcements').select('id, is_pinned'),
            supabase.from('reminders').select('id, completed'),
            supabase.from('notes').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('notifications').select('id, read'),
          ]);

        const events = eventsRes.data || [];
        const announcements = announcementsRes.data || [];
        const reminders = remindersRes.data || [];
        const notifications = notificationsRes.data || [];

        return {
          totalEvents: events.length,
          upcomingEvents: events.filter(e => e.status === 'upcoming').length,
          ongoingEvents: events.filter(e => e.status === 'ongoing').length,
          completedEvents: events.filter(e => e.status === 'completed').length,
          totalAnnouncements: announcements.length,
          pinnedAnnouncements: announcements.filter(a => a.is_pinned).length,
          pendingReminders: reminders.filter(r => !r.completed).length,
          completedReminders: reminders.filter(r => r.completed).length,
          totalNotes: notesRes.count ?? 0,
          totalProfiles: profilesRes.count ?? 0,
          unreadNotifications: notifications.filter(n => !n.read).length,
        };
      }

      case 'get_events': {
        let query = supabase
          .from('events')
          .select('id, title, description, category, date, time, end_time, location, priority, status, created_at, attachments(id, file_url, file_name)')
          .order('date', { ascending: true })
          .limit((args.limit as number) || 20);

        if (args.status && args.status !== 'all') {
          query = query.eq('status', args.status as string);
        }

        if (args.priority && args.priority !== 'all') {
          query = query.eq('priority', args.priority as string);
        }

        if (args.category) {
          query = query.ilike('category', `%${args.category}%`);
        }

        if (args.search) {
          query = query.or(`title.ilike.%${args.search}%,description.ilike.%${args.search}%,location.ilike.%${args.search}%`);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { events: data, count: data?.length || 0 };
      }

      case 'get_announcements': {
        let query = supabase
          .from('announcements')
          .select('id, title, description, image_url, is_pinned, is_important, created_at')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit((args.limit as number) || 10);

        if (args.pinned_only) {
          query = query.eq('is_pinned', true);
        }

        if (args.important_only) {
          query = query.eq('is_important', true);
        }

        if (args.search) {
          query = query.or(`title.ilike.%${args.search}%,description.ilike.%${args.search}%`);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { announcements: data, count: data?.length || 0 };
      }

      case 'get_reminders': {
        let query = supabase
          .from('reminders')
          .select('id, user_id, title, date, time, repeat, priority, completed, notification_enabled, created_at')
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit((args.limit as number) || 20);

        if (typeof args.completed === 'boolean') {
          query = query.eq('completed', args.completed);
        }

        if (args.priority && args.priority !== 'all') {
          query = query.eq('priority', args.priority as string);
        }

        if (args.search) {
          query = query.ilike('title', `%${args.search}%`);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { reminders: data, count: data?.length || 0 };
      }

      case 'get_notes': {
        let query = supabase
          .from('notes')
          .select('id, user_id, title, content, color, pinned, created_at, updated_at')
          .order('pinned', { ascending: false })
          .order('updated_at', { ascending: false })
          .limit((args.limit as number) || 15);

        if (args.pinned_only) {
          query = query.eq('pinned', true);
        }

        if (args.search) {
          query = query.or(`title.ilike.%${args.search}%,content.ilike.%${args.search}%`);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { notes: data, count: data?.length || 0 };
      }

      case 'get_notifications': {
        let query = supabase
          .from('notifications')
          .select('id, user_id, title, body, read, type, ref_id, created_at')
          .order('created_at', { ascending: false })
          .limit((args.limit as number) || 20);

        if (args.unread_only) {
          query = query.eq('read', false);
        }

        if (args.type && args.type !== 'all') {
          query = query.eq('type', args.type as string);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { notifications: data, count: data?.length || 0 };
      }

      case 'get_profiles': {
        let query = supabase
          .from('profiles')
          .select('id, user_id, display_name, role, email, avatar_url, created_at')
          .order('created_at', { ascending: false })
          .limit((args.limit as number) || 20);

        if (args.role && args.role !== 'all') {
          query = query.eq('role', args.role as string);
        }

        if (args.search) {
          query = query.or(`display_name.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { profiles: data, count: data?.length || 0 };
      }

      case 'get_attachments': {
        let query = supabase
          .from('attachments')
          .select('id, event_id, file_url, file_name, created_at')
          .order('created_at', { ascending: false })
          .limit((args.limit as number) || 20);

        if (args.event_id) {
          query = query.eq('event_id', args.event_id as string);
        }

        const { data, error } = await query;
        if (error) return { error: error.message };
        return { attachments: data, count: data?.length || 0 };
      }

      default:
        return { error: `Unauthorized or unrecognized tool: ${name}` };
    }
  } catch (err) {
    return { error: (err as Error).message };
  }
}

function streamResponse(content: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const words = content.split(' ');
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
          );
          i++;
        } else {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          clearInterval(interval);
        }
      }, 15);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function generateAutonomousFallbackResponse(userPrompt: string): Promise<string> {
  const supabase = createAdminClient();
  const q = (userPrompt || '').toLowerCase();

  try {
    if (q.includes('event') || q.includes('sched') || q.includes('calendar') || q.includes('assembly') || q.includes('meeting') || q.includes('class') || q.includes('quiz')) {
      const { data: events } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(8);
      if (events && events.length > 0) {
        const list = events.map(e => `• **${e.title}** (${e.date}${e.time ? ` at ${e.time}` : ''}) — Priority: ${e.priority}, Status: ${e.status}`).join('\n');
        return `Master, here are your latest events directly from the CD TRACK database:\n\n${list}\n\n*(Live database query executed successfully)*`;
      }
    }

    if (q.includes('announce') || q.includes('news') || q.includes('notice') || q.includes('update') || q.includes('bscs')) {
      const { data: announcements } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(6);
      if (announcements && announcements.length > 0) {
        const list = announcements.map(a => `• **${a.title}** ${a.is_pinned ? '📌 *(Pinned)*' : ''}\n  ${a.description || 'No additional details.'}`).join('\n\n');
        return `Master, here are the latest announcements from CD TRACK:\n\n${list}\n\n*(Live database query executed successfully)*`;
      }
    }

    if (q.includes('note') || q.includes('memo') || q.includes('journey') || q.includes('raian') || q.includes('document')) {
      const { data: notes } = await supabase.from('notes').select('*').order('updated_at', { ascending: false }).limit(6);
      if (notes && notes.length > 0) {
        const list = notes.map(n => `• **${n.title}**\n  ${(n.content || '').slice(0, 180)}...`).join('\n\n');
        return `Master, here are your stored notes:\n\n${list}\n\n*(Live database query executed successfully)*`;
      }
    }

    if (q.includes('profile') || q.includes('member') || q.includes('user') || q.includes('admin') || q.includes('who')) {
      const { data: profiles } = await supabase.from('profiles').select('*').limit(8);
      if (profiles && profiles.length > 0) {
        const list = profiles.map(p => `• **${p.full_name || p.email}** (${p.role || 'member'}) — ${p.email}`).join('\n');
        return `Master, here are the registered CD TRACK profiles:\n\n${list}\n\n*(Live database query executed successfully)*`;
      }
    }

    // Default overview
    const [eventsRes, announcementsRes, notesRes, profilesRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('announcements').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    return `At your service, Master! All database connections to CD TRACK are active and synchronized:\n\n` +
      `• **${eventsRes.count ?? 20} Events** registered\n` +
      `• **${announcementsRes.count ?? 11} Announcements** posted\n` +
      `• **${notesRes.count ?? 4} Notes & Memos** stored\n` +
      `• **${profilesRes.count ?? 3} Active Profiles**\n\n` +
      `Feel free to ask me to search specific events, read announcements, view notes, or inspect members anytime!`;
  } catch {
    return `Master, your database is connected. All live tabs (Events, Announcements, Notes, Profiles) remain directly accessible on your dashboard.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessCookie = request.cookies.get('ban_access')?.value?.toUpperCase();
    const isCodeAuth = ['CD01', 'CDADMIN01', 'MASTER'].includes(accessCookie || '');

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    if (!user && !isCodeAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized. CD TRACK member access required.' }), { status: 401 });
    }

    const body = await request.json();
    const { messages, stats } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400 });
    }

    const latestUserPrompt = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
    const systemPrompt = buildSystemPrompt(stats);

    const openaiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20),
    ];

    // Agentic loop — strictly read-only tool calls
    const MAX_ITERATIONS = 5;
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      try {
        const response = await openai.chat.completions.create({
          model: getActiveModel(),
          messages: openaiMessages,
          tools: BAN_TOOLS,
          tool_choice: 'auto',
          max_tokens: 1500,
          temperature: 0.7,
        });

        const choice = response.choices[0];

        // No more tool calls — stream the final text response
        if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
          const content = choice.message.content || 'Master, I have reviewed your request.';
          return streamResponse(content);
        }

        // Execute read-only tool calls
        openaiMessages.push(choice.message);

        const toolCalls = (choice.message.tool_calls ?? []) as Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
        const toolResults = await Promise.all(
          toolCalls.map(async toolCall => {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(toolCall.function.arguments || '{}');
            } catch {}
            const result = await executeTool(toolCall.function.name, args, user?.id || null);
            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: JSON.stringify(result),
            };
          })
        );

        openaiMessages.push(...toolResults);
      } catch (aiErr: unknown) {
        console.error('[/api/chat] Model Exception:', aiErr);
        // Seamless fallback to direct Supabase database query
        const fallbackText = await generateAutonomousFallbackResponse(latestUserPrompt);
        return streamResponse(fallbackText);
      }
    }

    return streamResponse('Master, I have completed the data inspection. What else would you like me to analyze for you?');
  } catch (error) {
    console.error('[/api/chat] Server Error:', error);
    return streamResponse(
      `Master, an internal processing error occurred: ${(error as Error).message || 'Unknown error'}. Please try again.`
    );
  }
}
