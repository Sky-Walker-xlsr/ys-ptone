-- Confirmation / request system
-- Run in Supabase Dashboard → SQL Editor

-- 0. Expand trainer_clients status values to include 'paused' and 'ended'.
--    The DB was created with only 'pending' | 'active' | 'inactive'.
ALTER TABLE trainer_clients DROP CONSTRAINT IF EXISTS trainer_clients_status_check;
ALTER TABLE trainer_clients ADD CONSTRAINT trainer_clients_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text, 'paused'::text, 'ended'::text]));

-- 1. Update find_client_by_email to include has_coach so the PT app can
--    block requests when another trainer is already coaching the client.
DROP FUNCTION IF EXISTS find_client_by_email(text);
CREATE OR REPLACE FUNCTION find_client_by_email(p_email text)
RETURNS TABLE (
  id           uuid,
  first_name   text,
  last_name    text,
  display_name text,
  email        text,
  has_coach    boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.display_name, p.email, p.has_coach
  FROM profiles p
  WHERE p.email = lower(p_email)
    AND p.role = 'client';
END;
$$;

-- 2. Allow clients to read their own rows in trainer_clients (to see pending requests).
DROP POLICY IF EXISTS trainer_clients_client_select ON trainer_clients;
CREATE POLICY trainer_clients_client_select ON trainer_clients
  FOR SELECT
  USING (client_id = auth.uid());

-- 3. Allow clients to accept (→ active) or decline (→ ended) PT requests.
DROP POLICY IF EXISTS trainer_clients_client_update ON trainer_clients;
CREATE POLICY trainer_clients_client_update ON trainer_clients
  FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid() AND status IN ('active', 'ended'));

-- 4. Allow clients to read the profile of a trainer who has a non-ended
--    trainer_clients row pointing to them (so the client app can show PT info).
DROP POLICY IF EXISTS profiles_trainer_visible_to_client ON profiles;
CREATE POLICY profiles_trainer_visible_to_client ON profiles
  FOR SELECT
  USING (
    role = 'pt'
    AND EXISTS (
      SELECT 1 FROM trainer_clients
      WHERE trainer_clients.trainer_id = profiles.id
        AND trainer_clients.client_id  = auth.uid()
        AND trainer_clients.status    != 'ended'
    )
  );
