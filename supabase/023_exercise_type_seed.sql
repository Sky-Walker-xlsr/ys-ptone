-- ── Seed exercise_types by NAME (idempotent) ─────────────────────────────────
-- Uses ON CONFLICT (name) so the DB generates valid UUIDs automatically.
-- The exercise_type_id on each exercises row will reference these locally-generated
-- UUIDs — they don't need to match the ys-workout DB since the two databases
-- are independent. The code always joins exercise_types at query time, so the
-- local UUID is all that matters.

INSERT INTO public.exercise_types (name, fields) VALUES
  ('Weight & Reps',         '["weight_kg","reps"]'),
  ('Bodyweight Reps',       '["reps"]'),
  ('Weighted Bodyweight',   '["reps","weight_kg"]'),
  ('Assisted Bodyweight',   '["reps","weight_kg"]'),
  ('Duration',              '["duration_seconds"]'),
  ('Duration & Weight',     '["duration_seconds","weight_kg"]'),
  ('Distance & Duration',   '["distance_km","duration_seconds"]'),
  ('Weight & Distance',     '["weight_kg","distance_km"]')
ON CONFLICT (name) DO UPDATE SET fields = EXCLUDED.fields;

-- ── Add duration_seconds and distance_km to plan_sets ────────────────────────
ALTER TABLE public.plan_sets
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS distance_km      numeric;
