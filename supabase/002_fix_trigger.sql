-- Fix handle_new_user trigger to match the actual profiles schema
-- Run in Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    role
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    TRIM(
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
      COALESCE(new.raw_user_meta_data ->> 'last_name', '')
    ),
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'client'::user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Recreate trigger (drop first to avoid duplicate)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
