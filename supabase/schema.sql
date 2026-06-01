-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounting_settings (
  pt_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'CHF'::text,
  tax_rate_default numeric DEFAULT 0,
  tax_number text,
  invoice_prefix text DEFAULT 'RE'::text,
  offer_prefix text DEFAULT 'AN'::text,
  invoice_logo_url text,
  invoice_footer_text text,
  invoice_color text,
  reminder_email_template text,
  payment_due_days integer DEFAULT 30,
  skonto_percent numeric,
  skonto_days integer,
  reminder1_enabled boolean DEFAULT true,
  reminder1_days_after_due integer DEFAULT 7,
  reminder1_email_text text,
  reminder2_enabled boolean DEFAULT false,
  reminder2_days_after_r1 integer DEFAULT 14,
  reminder2_email_text text,
  updated_at timestamp with time zone DEFAULT now(),
  email_auto_send boolean DEFAULT false,
  notification_email text,
  item_templates jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT accounting_settings_pkey PRIMARY KEY (pt_id),
  CONSTRAINT accounting_settings_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  title text NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  location text,
  notes text,
  google_event_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.body_measurement_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  date date NOT NULL,
  source text DEFAULT 'journal'::text CHECK (source = ANY (ARRAY['journal'::text, 'manual'::text])),
  journal_entry_id uuid,
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  arms_cm numeric,
  legs_cm numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT body_measurement_logs_pkey PRIMARY KEY (id),
  CONSTRAINT body_measurement_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_bml_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.body_weight_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  weight_kg numeric NOT NULL,
  date date NOT NULL,
  source text DEFAULT 'journal'::text CHECK (source = ANY (ARRAY['journal'::text, 'manual'::text])),
  journal_entry_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT body_weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT body_weight_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_bwl_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.calendar_integrations (
  pt_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'google'::text,
  google_calendar_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  sync_invoices boolean DEFAULT false,
  sync_reminders boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calendar_integrations_pkey PRIMARY KEY (pt_id),
  CONSTRAINT calendar_integrations_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.client_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT client_folders_pkey PRIMARY KEY (id),
  CONSTRAINT client_folders_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES auth.users(id),
  CONSTRAINT client_folders_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id)
);
CREATE TABLE public.client_profiles (
  id uuid NOT NULL,
  height_cm numeric,
  weight_kg numeric,
  birth_date date,
  start_date date,
  status USER-DEFINED DEFAULT 'aktiv'::client_status,
  goal ARRAY DEFAULT '{}'::text[],
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  arms_cm numeric,
  legs_cm numeric,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT client_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.client_settings (
  client_id uuid NOT NULL,
  language text NOT NULL DEFAULT 'de'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_settings_pkey PRIMARY KEY (client_id),
  CONSTRAINT client_settings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.contact_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_requests_pkey PRIMARY KEY (id),
  CONSTRAINT contact_requests_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES auth.users(id)
);
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text])),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.drive_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  folder_id uuid,
  pt_id uuid NOT NULL,
  client_id uuid,
  name text NOT NULL,
  onedrive_file_id text NOT NULL,
  onedrive_url text NOT NULL,
  file_type text,
  size_bytes bigint,
  visibility USER-DEFINED NOT NULL DEFAULT 'pt_only'::file_visibility,
  is_invoice boolean DEFAULT false,
  invoice_id uuid,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT drive_files_pkey PRIMARY KEY (id),
  CONSTRAINT drive_files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.drive_folders(id),
  CONSTRAINT drive_files_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT drive_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT drive_files_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.drive_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  name text NOT NULL,
  onedrive_folder_id text NOT NULL,
  parent_folder_id uuid,
  visibility USER-DEFINED NOT NULL DEFAULT 'pt_only'::file_visibility,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT drive_folders_pkey PRIMARY KEY (id),
  CONSTRAINT drive_folders_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT drive_folders_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT drive_folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.drive_folders(id)
);
CREATE TABLE public.equipment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT equipment_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exercise_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  note text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercise_notes_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT exercise_notes_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.exercise_pt_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL,
  pt_id uuid NOT NULL,
  onedrive_file_id text NOT NULL,
  onedrive_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercise_pt_videos_pkey PRIMARY KEY (id),
  CONSTRAINT exercise_pt_videos_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT exercise_pt_videos_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.exercise_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT exercise_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text,
  source USER-DEFINED NOT NULL DEFAULT 'exercisedb'::exercise_source,
  user_id uuid,
  name text,
  image_url text,
  image_url_2 text,
  equipment_id uuid,
  primary_muscle_id uuid,
  secondary_muscle_ids ARRAY DEFAULT '{}'::uuid[],
  exercise_type_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exercises_pkey PRIMARY KEY (id),
  CONSTRAINT exercises_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT exercises_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id),
  CONSTRAINT exercises_primary_muscle_id_fkey FOREIGN KEY (primary_muscle_id) REFERENCES public.muscles(id),
  CONSTRAINT exercises_exercise_type_id_fkey FOREIGN KEY (exercise_type_id) REFERENCES public.exercise_types(id)
);
CREATE TABLE public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT expense_categories_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.expense_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT 'other'::text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  receipt_url text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_interval text CHECK (recurring_interval = ANY (ARRAY['weekly'::text, 'monthly'::text, 'quarterly'::text, 'yearly'::text])),
  next_occurrence date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expense_entries_pkey PRIMARY KEY (id),
  CONSTRAINT expense_entries_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.expense_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL,
  file_name text NOT NULL,
  onedrive_file_id text NOT NULL,
  onedrive_url text NOT NULL,
  file_type text,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expense_receipts_pkey PRIMARY KEY (id),
  CONSTRAINT expense_receipts_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  category_id uuid,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  notes text,
  is_recurring boolean DEFAULT false,
  recurrence_type text,
  recurrence_interval USER-DEFINED,
  recurrence_end date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id)
);
CREATE TABLE public.google_calendar_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  refresh_token text,
  token_expiry timestamp with time zone,
  scope text,
  google_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  default_calendar_id text,
  CONSTRAINT google_calendar_connections_pkey PRIMARY KEY (id),
  CONSTRAINT google_calendar_connections_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES auth.users(id)
);
CREATE TABLE public.income_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  CONSTRAINT income_categories_pkey PRIMARY KEY (id),
  CONSTRAINT income_categories_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.incomes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  category_id uuid,
  invoice_id uuid,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  payment_status USER-DEFINED DEFAULT 'offen'::payment_status,
  is_recurring boolean DEFAULT false,
  recurrence_type text,
  recurrence_interval USER-DEFINED,
  recurrence_end date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT incomes_pkey PRIMARY KEY (id),
  CONSTRAINT incomes_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT incomes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT incomes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.income_categories(id),
  CONSTRAINT incomes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoice_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type = ANY (ARRAY['reminder_1'::text, 'reminder_2'::text])),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  email_to text NOT NULL,
  status USER-DEFINED NOT NULL,
  error_message text,
  CONSTRAINT invoice_reminders_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_reminders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  income_id uuid,
  offer_id uuid,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  tax_rate numeric DEFAULT 0,
  amount_with_tax numeric DEFAULT (amount * ((1)::numeric + (tax_rate / (100)::numeric))),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  payment_status USER-DEFINED NOT NULL DEFAULT 'offen'::payment_status,
  paid_date date,
  pdf_onedrive_id text,
  pdf_url text,
  skonto_percent numeric,
  skonto_days integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id),
  CONSTRAINT fk_invoice_income FOREIGN KEY (income_id) REFERENCES public.incomes(id)
);
CREATE TABLE public.journal_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  template_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT journal_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT journal_assignments_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.profiles(id),
  CONSTRAINT journal_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT journal_assignments_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.journal_templates(id)
);
CREATE TABLE public.journal_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  name text NOT NULL,
  order_index integer,
  is_active boolean DEFAULT true,
  CONSTRAINT journal_categories_pkey PRIMARY KEY (id),
  CONSTRAINT journal_categories_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  pt_id uuid NOT NULL,
  week_label text NOT NULL,
  year integer NOT NULL,
  week_number integer,
  date_from date,
  date_to date,
  weight_kg numeric,
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  arms_cm numeric,
  legs_cm numeric,
  control_date date,
  first_date date,
  avg_score numeric,
  notes text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  template_id uuid,
  status text DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'reviewed'::text])),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT journal_entries_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT journal_entries_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.journal_templates(id)
);
CREATE TABLE public.journal_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL,
  category_id uuid NOT NULL,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 4),
  score integer CHECK (score >= 1 AND score <= 10),
  CONSTRAINT journal_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT journal_ratings_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT journal_ratings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.journal_categories(id)
);
CREATE TABLE public.journal_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL,
  question_id text NOT NULL,
  value_text text,
  value_score integer,
  CONSTRAINT journal_responses_pkey PRIMARY KEY (id),
  CONSTRAINT journal_responses_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.journal_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  intro_text text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT journal_templates_pkey PRIMARY KEY (id),
  CONSTRAINT journal_templates_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.muscles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT muscles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  title text NOT NULL,
  content text,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.nutrition_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  name text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nutrition_plans_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_plans_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT nutrition_plans_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  client_id uuid,
  offer_number text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  tax_rate numeric DEFAULT 0,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  status text DEFAULT 'offen'::text CHECK (status = ANY (ARRAY['offen'::text, 'angenommen'::text, 'abgelehnt'::text, 'abgelaufen'::text])),
  converted_to_invoice_id uuid,
  pdf_onedrive_id text,
  pdf_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id),
  CONSTRAINT offers_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_offer_converted_invoice FOREIGN KEY (converted_to_invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.personal_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  workout_session_id uuid NOT NULL,
  set_id uuid NOT NULL,
  pr_type USER-DEFINED NOT NULL,
  value numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT personal_records_pkey PRIMARY KEY (id),
  CONSTRAINT personal_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT personal_records_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT personal_records_workout_session_id_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id),
  CONSTRAINT personal_records_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.sets(id)
);
CREATE TABLE public.plan_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT plan_assignments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id),
  CONSTRAINT plan_assignments_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.profiles(id),
  CONSTRAINT plan_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.plan_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  superset_group text,
  default_sets integer DEFAULT 3,
  CONSTRAINT plan_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT plan_exercises_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id),
  CONSTRAINT plan_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.plan_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pt_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_folders_pkey PRIMARY KEY (id),
  CONSTRAINT plan_folders_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.plan_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_exercise_id uuid NOT NULL,
  set_number integer NOT NULL,
  weight_kg numeric,
  reps integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_sets_pkey PRIMARY KEY (id),
  CONSTRAINT plan_sets_plan_exercise_id_fkey FOREIGN KEY (plan_exercise_id) REFERENCES public.plan_exercises(id)
);
CREATE TABLE public.plan_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  client_id uuid NOT NULL,
  shared_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plan_shares_pkey PRIMARY KEY (id),
  CONSTRAINT plan_shares_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.training_plans(id),
  CONSTRAINT plan_shares_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id)
);
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_template boolean NOT NULL DEFAULT false,
  folder_id uuid,
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT plans_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.plan_folders(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'client'::user_role,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT ''::text,
  first_name text,
  last_name text,
  avatar_url text,
  is_approved boolean NOT NULL DEFAULT false,
  has_coach boolean NOT NULL DEFAULT false,
  color_scheme text DEFAULT 'obsidian'::text,
  color_theme text DEFAULT 'dark'::text,
  coach_lang text NOT NULL DEFAULT 'de'::text,
  has_seen_welcome boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.pt_client_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pt_client_folders_pkey PRIMARY KEY (id),
  CONSTRAINT pt_client_folders_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES auth.users(id),
  CONSTRAINT pt_client_folders_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id)
);
CREATE TABLE public.pt_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  client_id uuid,
  name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  size_bytes bigint,
  mime_type text,
  section text NOT NULL CHECK (section = ANY (ARRAY['my_files'::text, 'videos'::text, 'client_documents'::text, 'client_invoices'::text, 'pt_invoices'::text])),
  subfolder text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pt_files_pkey PRIMARY KEY (id),
  CONSTRAINT pt_files_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES auth.users(id),
  CONSTRAINT pt_files_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id)
);
CREATE TABLE public.pt_profiles (
  id uuid NOT NULL,
  slug text UNIQUE,
  short_bio text CHECK (char_length(short_bio) <= 160),
  long_bio text,
  location text,
  languages ARRAY DEFAULT '{}'::text[],
  years_experience integer,
  certifications ARRAY DEFAULT '{}'::text[],
  specializations ARRAY DEFAULT '{}'::text[],
  contact_email text,
  hero_image_url text,
  gallery_urls ARRAY DEFAULT '{}'::text[] CHECK (array_length(gallery_urls, 1) <= 6),
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  availability text,
  price_from text,
  focus_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text NOT NULL DEFAULT '#7c6aff'::text,
  CONSTRAINT pt_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT pt_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pt_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_client_id uuid NOT NULL,
  to_pt_id uuid NOT NULL,
  message text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::request_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT pt_requests_pkey PRIMARY KEY (id),
  CONSTRAINT pt_requests_from_client_id_fkey FOREIGN KEY (from_client_id) REFERENCES public.profiles(id),
  CONSTRAINT pt_requests_to_pt_id_fkey FOREIGN KEY (to_pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pt_settings (
  pt_id uuid NOT NULL,
  journal_week_format text NOT NULL DEFAULT 'kw'::text CHECK (journal_week_format = ANY (ARRAY['kw'::text, 'date'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pt_settings_pkey PRIMARY KEY (pt_id),
  CONSTRAINT pt_settings_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_session_id uuid NOT NULL,
  workout_exercise_id uuid NOT NULL,
  set_number integer NOT NULL,
  weight_kg numeric,
  reps integer,
  duration_seconds integer,
  distance_km numeric,
  notes text,
  is_completed boolean DEFAULT false,
  is_pr boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sets_pkey PRIMARY KEY (id),
  CONSTRAINT sets_workout_session_id_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id),
  CONSTRAINT sets_workout_exercise_id_fkey FOREIGN KEY (workout_exercise_id) REFERENCES public.workout_exercises(id)
);
CREATE TABLE public.trainer_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text, 'paused'::text, 'ended'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT trainer_clients_pkey PRIMARY KEY (id),
  CONSTRAINT trainer_clients_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES auth.users(id),
  CONSTRAINT trainer_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id)
);
CREATE TABLE public.training_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  folder_id uuid NOT NULL,
  name text NOT NULL,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean DEFAULT false,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT training_plans_pkey PRIMARY KEY (id),
  CONSTRAINT training_plans_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES auth.users(id),
  CONSTRAINT training_plans_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.client_folders(id)
);
CREATE TABLE public.workout_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workout_session_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  superset_group text,
  CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_exercises_workout_session_id_fkey FOREIGN KEY (workout_session_id) REFERENCES public.workout_sessions(id),
  CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id)
);
CREATE TABLE public.workout_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid,
  training_plan_id uuid,
  title text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'active'::workout_status,
  source text NOT NULL DEFAULT 'own'::text CHECK (source = ANY (ARRAY['own'::text, 'plan'::text, 'training_plan'::text])),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  duration_seconds integer,
  total_volume_kg numeric,
  total_sets integer,
  exercises_added jsonb NOT NULL DEFAULT '[]'::jsonb,
  exercises_removed jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workout_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT workout_sessions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id),
  CONSTRAINT workout_sessions_training_plan_id_fkey FOREIGN KEY (training_plan_id) REFERENCES public.training_plans(id)
);