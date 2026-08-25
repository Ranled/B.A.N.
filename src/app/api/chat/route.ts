import { NextRequest } from 'next/server';
import { openai, OPENAI_MODEL, buildSystemPrompt, BAN_TOOLS } from '@/lib/openai/client';
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

      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: openaiMessages,
        tools: BAN_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1500,
        temperature: 0.7,
      });

      const choice = response.choices[0];

      // No more tool calls — stream the final text response
      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        const content = choice.message.content || '';

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
    }

    return new Response(
      JSON.stringify({ content: 'Master, I had trouble completing that analysis. Please command me again.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[/api/chat] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
