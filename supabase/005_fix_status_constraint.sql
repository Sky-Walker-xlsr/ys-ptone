-- 005: Robustly fix trainer_clients status constraint.
-- The previous migration dropped by name, but the auto-generated name may differ.
-- This DO block finds ANY check constraint referencing 'status' on that table
-- and drops it before adding the correct one.
-- Run in Supabase Dashboard → SQL Editor

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'trainer_clients'
      AND nsp.nspname  = 'public'
      AND con.contype  = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.trainer_clients DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END
$$;

ALTER TABLE public.trainer_clients
  ADD CONSTRAINT trainer_clients_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text, 'paused'::text, 'ended'::text]));
