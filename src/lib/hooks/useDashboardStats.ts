'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardStats, CDEvent, Announcement, Reminder, Note, Profile } from '@/types';

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    try {
      // First try fetching through server /api/data route (works for code auth & server auth)
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.stats) {
          setStats(json.stats);
          setError(null);
          return;
        }
      }

      // Fallback: direct browser Supabase query
      const [
        eventsRes,
        announcementsRes,
        remindersRes,
        notesRes,
        profilesRes,
        notificationsRes,
      ] = await Promise.all([
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

      setStats({
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
      });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();

    // Unique channel per hook instance to prevent callback conflicts
    const channelId = `cdtrack-stats-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// Hook to load live read-only tables for Master Inspector
export function useCDTrackData() {
  const [events, setEvents] = useState<CDEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadAll = useCallback(async () => {
    try {
      // First try fetching through server /api/data endpoint
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.events) setEvents(json.events);
        if (json.announcements) setAnnouncements(json.announcements);
        if (json.reminders) setReminders(json.reminders);
        if (json.notes) setNotes(json.notes);
        if (json.profiles) setProfiles(json.profiles);
        return;
      }

      // Fallback: direct browser Supabase query
      const [evRes, anRes, rmRes, ntRes, pfRes] = await Promise.all([
        supabase.from('events').select('*, attachments(*)').order('date', { ascending: true }).limit(50),
        supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
        supabase.from('reminders').select('*').order('date', { ascending: true }).limit(50),
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (evRes.data) setEvents(evRes.data);
      if (anRes.data) setAnnouncements(anRes.data);
      if (rmRes.data) setReminders(rmRes.data);
      if (ntRes.data) setNotes(ntRes.data);
      if (pfRes.data) setProfiles(pfRes.data);
    } catch {
      // Ignored for resilience
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAll();

    const channelId = `cdtrack-data-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public' }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadAll]);

  return { events, announcements, reminders, notes, profiles, loading, refetch: loadAll };
}
