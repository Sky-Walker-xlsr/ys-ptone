-- ============================================================
-- PTOne – Initial Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. profiles table (one row per auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    text,
  last_name     text,
  full_name     text,
  role          text        NOT NULL DEFAULT 'client', -- 'client' | 'pt'
  has_coach     boolean     NOT NULL DEFAULT false,
  color_theme   text        NOT NULL DEFAULT 'dark',
  color_scheme  text        NOT NULL DEFAULT 'dark',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger: auto-insert profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    COALESCE(
      new.raw_user_meta_data ->> 'full_name',
      TRIM(
        COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' ||
        COALESCE(new.raw_user_meta_data ->> 'last_name', '')
      )
    ),
    COALESCE(new.raw_user_meta_data ->> 'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop and recreate to ensure it's current
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Trigger: auto-set has_coach when PT activates a client
-- (trainer_clients table — created later; safe to run now)
CREATE TABLE IF NOT EXISTS trainer_clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'paused' | 'ended'
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, client_id)
);

CREATE OR REPLACE FUNCTION handle_trainer_client_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles SET has_coach = true WHERE id = NEW.client_id;
  ELSIF NEW.status IN ('paused', 'ended') THEN
    -- Only set false if no other active trainer
    UPDATE profiles SET has_coach = false
    WHERE id = NEW.client_id
      AND NOT EXISTS (
        SELECT 1 FROM trainer_clients
        WHERE client_id = NEW.client_id
          AND status = 'active'
          AND id != NEW.id
      );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trainer_client_status ON trainer_clients;
CREATE TRIGGER on_trainer_client_status
  AFTER INSERT OR UPDATE OF status ON trainer_clients
  FOR EACH ROW EXECUTE FUNCTION handle_trainer_client_status();

-- 4. RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- PTs can read profiles of their clients
CREATE POLICY "profiles_select_pt_clients"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trainer_clients
      WHERE trainer_id = auth.uid()
        AND client_id = profiles.id
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

ALTER TABLE trainer_clients ENABLE ROW LEVEL SECURITY;

-- PT sees their own trainer_clients rows
CREATE POLICY "trainer_clients_pt"
  ON trainer_clients FOR ALL
  USING (trainer_id = auth.uid());

-- Client sees rows where they are the client
CREATE POLICY "trainer_clients_client_select"
  ON trainer_clients FOR SELECT
  USING (client_id = auth.uid());
