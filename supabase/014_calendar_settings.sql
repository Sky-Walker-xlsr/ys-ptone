-- 014_calendar_settings.sql
-- Adds default_calendar_id to google_calendar_connections
-- and an UPDATE policy so trainers can set their default calendar.

ALTER TABLE public.google_calendar_connections
  ADD COLUMN IF NOT EXISTS default_calendar_id text;

DROP POLICY IF EXISTS "trainer can update own google connection" ON public.google_calendar_connections;
CREATE POLICY "trainer can update own google connection"
  ON public.google_calendar_connections FOR UPDATE
  USING  (auth.uid() = trainer_id)
  WITH CHECK (auth.uid() = trainer_id);
