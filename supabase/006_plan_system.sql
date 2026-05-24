-- 006: Plan assignment system
-- PT creates plans in `plans` table and assigns them to clients.
-- Run in Supabase Dashboard → SQL Editor

-- 0. Extend exercise_source enum to include 'custom' (idempotent)
DO $$ BEGIN
  ALTER TYPE public.exercise_source ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Plan assignments: PT assigns a plan to a client
CREATE TABLE IF NOT EXISTS public.plan_assignments (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id    uuid NOT NULL,
  trainer_id uuid NOT NULL,
  client_id  uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT plan_assignments_plan_id_fkey    FOREIGN KEY (plan_id)    REFERENCES public.plans(id)    ON DELETE CASCADE,
  CONSTRAINT plan_assignments_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT plan_assignments_client_id_fkey  FOREIGN KEY (client_id)  REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. Enable RLS
ALTER TABLE public.plan_assignments ENABLE ROW LEVEL SECURITY;

-- PT can manage assignments for their own plans
DROP POLICY IF EXISTS plan_assignments_trainer_all ON public.plan_assignments;
CREATE POLICY plan_assignments_trainer_all ON public.plan_assignments
  FOR ALL
  USING  (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Client can read their own assignments
DROP POLICY IF EXISTS plan_assignments_client_select ON public.plan_assignments;
CREATE POLICY plan_assignments_client_select ON public.plan_assignments
  FOR SELECT
  USING (client_id = auth.uid());

-- 3. RLS on plans table (PT owns their plans)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_owner_all ON public.plans;
CREATE POLICY plans_owner_all ON public.plans
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Client can read plans assigned to them
DROP POLICY IF EXISTS plans_assigned_client_select ON public.plans;
CREATE POLICY plans_assigned_client_select ON public.plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      WHERE pa.plan_id   = plans.id
        AND pa.client_id = auth.uid()
    )
  );

-- 4. RLS on plan_exercises
ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_exercises_owner_all ON public.plan_exercises;
CREATE POLICY plan_exercises_owner_all ON public.plan_exercises
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_exercises.plan_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_exercises.plan_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS plan_exercises_assigned_client_select ON public.plan_exercises;
CREATE POLICY plan_exercises_assigned_client_select ON public.plan_exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_assignments pa
      WHERE pa.plan_id   = plan_exercises.plan_id
        AND pa.client_id = auth.uid()
    )
  );

-- 5. RLS on plan_sets
ALTER TABLE public.plan_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_sets_owner_all ON public.plan_sets;
CREATE POLICY plan_sets_owner_all ON public.plan_sets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_exercises pe
      JOIN public.plans p ON p.id = pe.plan_id
      WHERE pe.id = plan_sets.plan_exercise_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_exercises pe
      JOIN public.plans p ON p.id = pe.plan_id
      WHERE pe.id = plan_sets.plan_exercise_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS plan_sets_assigned_client_select ON public.plan_sets;
CREATE POLICY plan_sets_assigned_client_select ON public.plan_sets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_exercises pe
      JOIN public.plan_assignments pa ON pa.plan_id = pe.plan_id
      WHERE pe.id = plan_sets.plan_exercise_id AND pa.client_id = auth.uid()
    )
  );

-- 6. RLS on workout_sessions (user owns their own sessions)
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workout_sessions_user_all ON public.workout_sessions;
CREATE POLICY workout_sessions_user_all ON public.workout_sessions
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PT can read their clients' finished sessions
DROP POLICY IF EXISTS workout_sessions_trainer_select ON public.workout_sessions;
CREATE POLICY workout_sessions_trainer_select ON public.workout_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id  = workout_sessions.user_id
        AND tc.status     = 'active'
    )
  );

-- 7. RLS on workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workout_exercises_user_all ON public.workout_exercises;
CREATE POLICY workout_exercises_user_all ON public.workout_exercises
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = workout_exercises.workout_session_id AND ws.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = workout_exercises.workout_session_id AND ws.user_id = auth.uid())
  );

-- 8. RLS on sets
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sets_user_all ON public.sets;
CREATE POLICY sets_user_all ON public.sets
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = sets.workout_session_id AND ws.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = sets.workout_session_id AND ws.user_id = auth.uid())
  );

-- 9. RLS on exercises (public read for exercisedb, user owns custom)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercises_public_read ON public.exercises;
CREATE POLICY exercises_public_read ON public.exercises
  FOR SELECT
  USING (source::text = 'exercisedb');

DROP POLICY IF EXISTS exercises_user_custom ON public.exercises;
CREATE POLICY exercises_user_custom ON public.exercises
  FOR ALL
  USING  (source::text = 'custom' AND (user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (source::text = 'custom' AND user_id = auth.uid());

-- 10. RLS on personal_records
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personal_records_user_all ON public.personal_records;
CREATE POLICY personal_records_user_all ON public.personal_records
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 11. RLS on exercise_notes
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercise_notes_user_all ON public.exercise_notes;
CREATE POLICY exercise_notes_user_all ON public.exercise_notes
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
