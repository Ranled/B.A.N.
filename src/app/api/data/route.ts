import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CDEvent, Announcement, Reminder, Note, Profile, Notification, DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Query all tables in parallel
    const [eventsRes, announcementsRes, remindersRes, notesRes, profilesRes, notificationsRes] =
      await Promise.allSettled([
        supabase.from('events').select('*, attachments(*)').order('date', { ascending: true }).limit(50),
        supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
        supabase.from('reminders').select('*').order('date', { ascending: true }).limit(50),
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

    const events: CDEvent[] = eventsRes.status === 'fulfilled' && eventsRes.value.data ? eventsRes.value.data : [];
    const announcements: Announcement[] = announcementsRes.status === 'fulfilled' && announcementsRes.value.data ? announcementsRes.value.data : [];
    const reminders: Reminder[] = remindersRes.status === 'fulfilled' && remindersRes.value.data ? remindersRes.value.data : [];
    const notes: Note[] = notesRes.status === 'fulfilled' && notesRes.value.data ? notesRes.value.data : [];
    const profiles: Profile[] = profilesRes.status === 'fulfilled' && profilesRes.value.data ? profilesRes.value.data : [];
    const notifications: Notification[] = notificationsRes.status === 'fulfilled' && notificationsRes.value.data ? notificationsRes.value.data : [];

    const stats: DashboardStats = {
      totalEvents: events.length,
      upcomingEvents: events.filter(e => e.status === 'upcoming').length,
      ongoingEvents: events.filter(e => e.status === 'ongoing').length,
      completedEvents: events.filter(e => e.status === 'completed').length,
      totalAnnouncements: announcements.length,
      pinnedAnnouncements: announcements.filter(a => a.is_pinned).length,
      pendingReminders: reminders.filter(r => !r.completed).length,
      completedReminders: reminders.filter(r => r.completed).length,
      totalNotes: notes.length,
      totalProfiles: profiles.length,
      unreadNotifications: notifications.filter(n => !n.read).length,
    };

    return NextResponse.json({
      stats,
      events,
      announcements,
      reminders,
      notes,
      profiles,
      notifications,
    });
  } catch (error) {
    console.error('[/api/data] Error fetching database data:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch database data' },
      { status: 500 }
    );
  }
}
