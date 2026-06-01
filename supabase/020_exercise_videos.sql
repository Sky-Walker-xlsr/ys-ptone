-- ─── Exercise videos ─────────────────────────────────────────────────────────
-- PT can upload videos linked to exercises in the exercise DB.
-- Active clients of that PT can view them during their workout.

CREATE TABLE IF NOT EXISTS public.pt_exercise_videos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id  uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT '',
  description  text,
  storage_path text NOT NULL,
  file_name    text NOT NULL,
  file_size_bytes bigint,
  mime_type    text DEFAULT 'video/mp4',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.pt_exercise_videos ENABLE ROW LEVEL SECURITY;

-- PT: full CRUD on their own videos
DROP POLICY IF EXISTS exercise_videos_pt ON public.pt_exercise_videos;
CREATE POLICY exercise_videos_pt ON public.pt_exercise_videos
  USING (auth.uid() = pt_id)
  WITH CHECK (auth.uid() = pt_id);

-- Active clients: SELECT only, for videos from their trainer
DROP POLICY IF EXISTS exercise_videos_client_read ON public.pt_exercise_videos;
CREATE POLICY exercise_videos_client_read ON public.pt_exercise_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = pt_exercise_videos.pt_id
        AND tc.client_id  = auth.uid()
        AND tc.status     = 'active'
    )
  );

-- ─── Storage bucket ───────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('pt_videos', 'pt_videos', false)
ON CONFLICT DO NOTHING;

-- PT uploads to their own folder: pt_videos/{pt_id}/...
DROP POLICY IF EXISTS pt_videos_pt_rw ON storage.objects;
CREATE POLICY pt_videos_pt_rw ON storage.objects
  FOR ALL USING (
    bucket_id = 'pt_videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Clients can download videos from their trainer's folder
DROP POLICY IF EXISTS pt_videos_client_read ON storage.objects;
CREATE POLICY pt_videos_client_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pt_videos'
    AND EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id::text = (storage.foldername(name))[1]
        AND tc.client_id = auth.uid()
        AND tc.status    = 'active'
    )
  );
