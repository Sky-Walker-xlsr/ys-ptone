-- Allow PTs to look up a client account by email before connecting them.
-- Uses SECURITY DEFINER so it bypasses RLS (the caller must be authenticated).
-- Only returns profiles with role = 'client'.
-- Run in Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION find_client_by_email(p_email text)
RETURNS TABLE (
  id           uuid,
  first_name   text,
  last_name    text,
  display_name text,
  email        text
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
  SELECT p.id, p.first_name, p.last_name, p.display_name, p.email
  FROM profiles p
  WHERE p.email = lower(p_email)
    AND p.role = 'client';
END;
$$;
