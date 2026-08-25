-- ==============================================================================
-- CD TRACK / B.A.N. — Read Access Migration
-- Run this in your Supabase SQL Editor if you want to allow anonymous or
-- public read-only inspection of events, announcements, reminders, notes,
-- and notifications without needing a full service role key.
-- ==============================================================================

-- 1. EVENTS: Allow read for all observers
DROP POLICY IF EXISTS "events_read_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_read_all" ON public.events;
CREATE POLICY "events_read_all" ON public.events FOR SELECT USING (TRUE);

-- 2. ANNOUNCEMENTS: Allow read for all observers
DROP POLICY IF EXISTS "announcements_read_authenticated" ON public.announcements;
DROP POLICY IF EXISTS "announcements_read_all" ON public.announcements;
CREATE POLICY "announcements_read_all" ON public.announcements FOR SELECT USING (TRUE);

-- 3. ATTACHMENTS: Allow read for all observers
DROP POLICY IF EXISTS "attachments_read" ON public.attachments;
DROP POLICY IF EXISTS "attachments_read_all" ON public.attachments;
CREATE POLICY "attachments_read_all" ON public.attachments FOR SELECT USING (TRUE);

-- 4. PROFILES: Ensure read for all
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (TRUE);

-- 5. NOTES: Allow read for B.A.N. monitoring (writes remain restricted to owners)
DROP POLICY IF EXISTS "notes_read_all" ON public.notes;
CREATE POLICY "notes_read_all" ON public.notes FOR SELECT USING (TRUE);

-- 6. REMINDERS: Allow read for B.A.N. monitoring (writes remain restricted to owners)
DROP POLICY IF EXISTS "reminders_read_all" ON public.reminders;
CREATE POLICY "reminders_read_all" ON public.reminders FOR SELECT USING (TRUE);

-- 7. NOTIFICATIONS: Allow read for B.A.N. monitoring (writes remain restricted to admins)
DROP POLICY IF EXISTS "notifications_read_all" ON public.notifications;
CREATE POLICY "notifications_read_all" ON public.notifications FOR SELECT USING (TRUE);
