-- 007: Plan folders + template flag
-- Adds folder organization to template plans and is_template flag.
-- Run in Supabase Dashboard → SQL Editor

-- 1. Folder table for template organisation
CREATE TABLE IF NOT EXISTS public.plan_folders (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id      uuid NOT NULL,
  name       text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_folders_pkey PRIMARY KEY (id),
  CONSTRAINT plan_folders_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. Extend plans with template flag and optional folder
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder_id   uuid REFERENCES public.plan_folders(id) ON DELETE SET NULL;

-- 3. RLS on plan_folders (PT owns their own folders)
ALTER TABLE public.plan_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_folders_owner_all ON public.plan_folders;
CREATE POLICY plan_folders_owner_all ON public.plan_folders
  FOR ALL
  USING  (pt_id = auth.uid())
  WITH CHECK (pt_id = auth.uid());
