-- 009_journal_system.sql
-- Run this in the Supabase SQL editor

-- ─── journal_templates ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  intro_text  text,
  sections    jsonb       NOT NULL DEFAULT '[]'::jsonb,
  is_default  boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- ─── journal_assignments ─────────────────────────────────────────────────────
-- Which template each client is assigned to (one per trainer-client pair)
CREATE TABLE IF NOT EXISTS public.journal_assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id uuid        NOT NULL REFERENCES public.journal_templates(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(trainer_id, client_id)
);

-- ─── journal_responses ───────────────────────────────────────────────────────
-- One row per question per journal_entry
CREATE TABLE IF NOT EXISTS public.journal_responses (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id    uuid  NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  question_id text  NOT NULL,
  value_text  text,
  value_score integer,
  UNIQUE(entry_id, question_id)
);

-- ─── Extend journal_entries ───────────────────────────────────────────────────
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.journal_templates(id),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewed'));

-- ─── RLS: journal_templates ───────────────────────────────────────────────────
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jt_trainer_all   ON public.journal_templates;
DROP POLICY IF EXISTS jt_client_read   ON public.journal_templates;

CREATE POLICY jt_trainer_all ON public.journal_templates
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY jt_client_read ON public.journal_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.client_id = auth.uid()
        AND tc.trainer_id = journal_templates.trainer_id
        AND tc.status = 'active'
    )
  );

-- ─── RLS: journal_assignments ─────────────────────────────────────────────────
ALTER TABLE public.journal_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ja_trainer_all ON public.journal_assignments;
DROP POLICY IF EXISTS ja_client_read ON public.journal_assignments;

CREATE POLICY ja_trainer_all ON public.journal_assignments
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY ja_client_read ON public.journal_assignments
  FOR SELECT USING (client_id = auth.uid());

-- ─── RLS: journal_responses ───────────────────────────────────────────────────
ALTER TABLE public.journal_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jr_pt_read     ON public.journal_responses;
DROP POLICY IF EXISTS jr_client_all  ON public.journal_responses;

CREATE POLICY jr_pt_read ON public.journal_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_responses.entry_id AND je.pt_id = auth.uid()
    )
  );

CREATE POLICY jr_client_all ON public.journal_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_responses.entry_id AND je.client_id = auth.uid()
    )
  );

-- ─── RLS: journal_entries (add client insert) ─────────────────────────────────
DROP POLICY IF EXISTS journal_entries_insert_client ON public.journal_entries;
CREATE POLICY journal_entries_insert_client ON public.journal_entries
  FOR INSERT WITH CHECK (client_id = auth.uid());
