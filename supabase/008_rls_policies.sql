-- ============================================================
-- PTOne RLS Policies
-- Run this against your Supabase project SQL editor.
-- Safe to re-run: uses DROP POLICY IF EXISTS before each CREATE.
-- ============================================================

-- ─── accounting_settings ─────────────────────────────────────
ALTER TABLE public.accounting_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS accounting_settings_pt_own ON public.accounting_settings;
CREATE POLICY accounting_settings_pt_own ON public.accounting_settings
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── appointments ────────────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointments_pt_own ON public.appointments;
CREATE POLICY appointments_pt_own ON public.appointments
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS appointments_client_reads_own ON public.appointments;
CREATE POLICY appointments_client_reads_own ON public.appointments
  FOR SELECT USING (client_id = auth.uid());

-- ─── body_measurement_logs ───────────────────────────────────
ALTER TABLE public.body_measurement_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bml_select_own ON public.body_measurement_logs;
CREATE POLICY bml_select_own ON public.body_measurement_logs
  FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS bml_select_pt ON public.body_measurement_logs;
CREATE POLICY bml_select_pt ON public.body_measurement_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = body_measurement_logs.client_id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS bml_insert_own ON public.body_measurement_logs;
CREATE POLICY bml_insert_own ON public.body_measurement_logs
  FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS bml_insert_pt ON public.body_measurement_logs;
CREATE POLICY bml_insert_pt ON public.body_measurement_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = body_measurement_logs.client_id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS bml_update_own ON public.body_measurement_logs;
CREATE POLICY bml_update_own ON public.body_measurement_logs
  FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS bml_delete_own ON public.body_measurement_logs;
CREATE POLICY bml_delete_own ON public.body_measurement_logs
  FOR DELETE USING (client_id = auth.uid());

-- ─── body_weight_logs ────────────────────────────────────────
ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bwl_select_own ON public.body_weight_logs;
CREATE POLICY bwl_select_own ON public.body_weight_logs
  FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS bwl_select_pt ON public.body_weight_logs;
CREATE POLICY bwl_select_pt ON public.body_weight_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = body_weight_logs.client_id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS bwl_insert_own ON public.body_weight_logs;
CREATE POLICY bwl_insert_own ON public.body_weight_logs
  FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS bwl_insert_pt ON public.body_weight_logs;
CREATE POLICY bwl_insert_pt ON public.body_weight_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = body_weight_logs.client_id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS bwl_update_own ON public.body_weight_logs;
CREATE POLICY bwl_update_own ON public.body_weight_logs
  FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS bwl_delete_own ON public.body_weight_logs;
CREATE POLICY bwl_delete_own ON public.body_weight_logs
  FOR DELETE USING (client_id = auth.uid());

-- ─── calendar_integrations ───────────────────────────────────
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_integrations_pt_own ON public.calendar_integrations;
CREATE POLICY calendar_integrations_pt_own ON public.calendar_integrations
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── client_folders ──────────────────────────────────────────
ALTER TABLE public.client_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_folders_select_pt ON public.client_folders;
CREATE POLICY client_folders_select_pt ON public.client_folders
  FOR SELECT USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS client_folders_select_client ON public.client_folders;
CREATE POLICY client_folders_select_client ON public.client_folders
  FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS client_folders_insert_pt ON public.client_folders;
CREATE POLICY client_folders_insert_pt ON public.client_folders
  FOR INSERT WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS client_folders_update_pt ON public.client_folders;
CREATE POLICY client_folders_update_pt ON public.client_folders
  FOR UPDATE USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS client_folders_delete_pt ON public.client_folders;
CREATE POLICY client_folders_delete_pt ON public.client_folders
  FOR DELETE USING (trainer_id = auth.uid());

-- ─── client_profiles ─────────────────────────────────────────
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_profiles_select_own ON public.client_profiles;
CREATE POLICY client_profiles_select_own ON public.client_profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS client_profiles_select_pt ON public.client_profiles;
CREATE POLICY client_profiles_select_pt ON public.client_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = client_profiles.id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS client_profiles_insert_own ON public.client_profiles;
CREATE POLICY client_profiles_insert_own ON public.client_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS client_profiles_update_own ON public.client_profiles;
CREATE POLICY client_profiles_update_own ON public.client_profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS client_profiles_update_pt ON public.client_profiles;
CREATE POLICY client_profiles_update_pt ON public.client_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = client_profiles.id
        AND tc.status = 'active'
    )
  );

-- ─── client_settings ─────────────────────────────────────────
ALTER TABLE public.client_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_settings_own ON public.client_settings;
CREATE POLICY client_settings_own ON public.client_settings
  FOR ALL USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

-- ─── contact_submissions ─────────────────────────────────────
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_submissions_insert_anon ON public.contact_submissions;
CREATE POLICY contact_submissions_insert_anon ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS contact_submissions_pt_reads ON public.contact_submissions;
CREATE POLICY contact_submissions_pt_reads ON public.contact_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'pt')
  );

-- ─── drive_files ─────────────────────────────────────────────
ALTER TABLE public.drive_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS drive_files_pt_own ON public.drive_files;
CREATE POLICY drive_files_pt_own ON public.drive_files
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS drive_files_client_reads_shared ON public.drive_files;
CREATE POLICY drive_files_client_reads_shared ON public.drive_files
  FOR SELECT USING (
    client_id = auth.uid() AND visibility != 'pt_only'
  );

-- ─── drive_folders ───────────────────────────────────────────
ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS drive_folders_pt_own ON public.drive_folders;
CREATE POLICY drive_folders_pt_own ON public.drive_folders
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS drive_folders_client_reads_shared ON public.drive_folders;
CREATE POLICY drive_folders_client_reads_shared ON public.drive_folders
  FOR SELECT USING (
    client_id = auth.uid() AND visibility != 'pt_only'
  );

-- ─── equipment ───────────────────────────────────────────────
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS equipment_select_all ON public.equipment;
CREATE POLICY equipment_select_all ON public.equipment
  FOR SELECT USING (true);

-- ─── exercise_notes ──────────────────────────────────────────
ALTER TABLE public.exercise_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exercise_notes_own ON public.exercise_notes;
CREATE POLICY exercise_notes_own ON public.exercise_notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── exercise_pt_videos ──────────────────────────────────────
ALTER TABLE public.exercise_pt_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exercise_pt_videos_select_pt ON public.exercise_pt_videos;
CREATE POLICY exercise_pt_videos_select_pt ON public.exercise_pt_videos
  FOR SELECT USING (pt_id = auth.uid());

DROP POLICY IF EXISTS exercise_pt_videos_select_client ON public.exercise_pt_videos;
CREATE POLICY exercise_pt_videos_select_client ON public.exercise_pt_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = exercise_pt_videos.pt_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS exercise_pt_videos_insert_pt ON public.exercise_pt_videos;
CREATE POLICY exercise_pt_videos_insert_pt ON public.exercise_pt_videos
  FOR INSERT WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS exercise_pt_videos_update_pt ON public.exercise_pt_videos;
CREATE POLICY exercise_pt_videos_update_pt ON public.exercise_pt_videos
  FOR UPDATE USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS exercise_pt_videos_delete_pt ON public.exercise_pt_videos;
CREATE POLICY exercise_pt_videos_delete_pt ON public.exercise_pt_videos
  FOR DELETE USING (pt_id = auth.uid());

-- ─── exercise_types ──────────────────────────────────────────
ALTER TABLE public.exercise_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exercise_types_select_all ON public.exercise_types;
CREATE POLICY exercise_types_select_all ON public.exercise_types
  FOR SELECT USING (true);

-- ─── exercises ───────────────────────────────────────────────
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exercises_select_global ON public.exercises;
CREATE POLICY exercises_select_global ON public.exercises
  FOR SELECT USING (source = 'exercisedb');

DROP POLICY IF EXISTS exercises_select_client_custom ON public.exercises;
CREATE POLICY exercises_select_client_custom ON public.exercises
  FOR SELECT USING (source = 'custom' AND user_id = auth.uid());

DROP POLICY IF EXISTS exercises_select_pt_custom ON public.exercises;
CREATE POLICY exercises_select_pt_custom ON public.exercises
  FOR SELECT USING (source = 'custom' AND user_id = auth.uid());

DROP POLICY IF EXISTS exercises_insert_client ON public.exercises;
CREATE POLICY exercises_insert_client ON public.exercises
  FOR INSERT WITH CHECK (source = 'custom' AND user_id = auth.uid());

DROP POLICY IF EXISTS exercises_insert_pt ON public.exercises;
CREATE POLICY exercises_insert_pt ON public.exercises
  FOR INSERT WITH CHECK (source = 'custom' AND user_id = auth.uid());

DROP POLICY IF EXISTS exercises_insert_exercisedb ON public.exercises;
CREATE POLICY exercises_insert_exercisedb ON public.exercises
  FOR INSERT WITH CHECK (source = 'exercisedb' AND user_id IS NULL);

DROP POLICY IF EXISTS exercises_update_own ON public.exercises;
CREATE POLICY exercises_update_own ON public.exercises
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS exercises_delete_own ON public.exercises;
CREATE POLICY exercises_delete_own ON public.exercises
  FOR DELETE USING (user_id = auth.uid());

-- ─── expense_categories ──────────────────────────────────────
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expense_categories_pt_own ON public.expense_categories;
CREATE POLICY expense_categories_pt_own ON public.expense_categories
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── expense_receipts ────────────────────────────────────────
ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expense_receipts_pt_own ON public.expense_receipts;
CREATE POLICY expense_receipts_pt_own ON public.expense_receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_receipts.expense_id AND e.pt_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_receipts.expense_id AND e.pt_id = auth.uid()
    )
  );

-- ─── expenses ────────────────────────────────────────────────
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expenses_pt_own ON public.expenses;
CREATE POLICY expenses_pt_own ON public.expenses
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── income_categories ───────────────────────────────────────
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS income_categories_pt_own ON public.income_categories;
CREATE POLICY income_categories_pt_own ON public.income_categories
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── incomes ─────────────────────────────────────────────────
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS incomes_pt_own ON public.incomes;
CREATE POLICY incomes_pt_own ON public.incomes
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── invoice_reminders ───────────────────────────────────────
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_reminders_pt_own ON public.invoice_reminders;
CREATE POLICY invoice_reminders_pt_own ON public.invoice_reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id AND i.pt_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_reminders.invoice_id AND i.pt_id = auth.uid()
    )
  );

-- ─── invoices ────────────────────────────────────────────────
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_pt_own ON public.invoices;
CREATE POLICY invoices_pt_own ON public.invoices
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS invoices_client_reads_own ON public.invoices;
CREATE POLICY invoices_client_reads_own ON public.invoices
  FOR SELECT USING (client_id = auth.uid());

-- ─── journal_categories ──────────────────────────────────────
ALTER TABLE public.journal_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_categories_select_pt ON public.journal_categories;
CREATE POLICY journal_categories_select_pt ON public.journal_categories
  FOR SELECT USING (pt_id = auth.uid());

DROP POLICY IF EXISTS journal_categories_select_client ON public.journal_categories;
CREATE POLICY journal_categories_select_client ON public.journal_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = journal_categories.pt_id
        AND tc.client_id = auth.uid()
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS journal_categories_manage_pt ON public.journal_categories;
CREATE POLICY journal_categories_manage_pt ON public.journal_categories
  FOR INSERT WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS journal_categories_update_pt ON public.journal_categories;
CREATE POLICY journal_categories_update_pt ON public.journal_categories
  FOR UPDATE USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS journal_categories_delete_pt ON public.journal_categories;
CREATE POLICY journal_categories_delete_pt ON public.journal_categories
  FOR DELETE USING (pt_id = auth.uid());

-- ─── journal_entries ─────────────────────────────────────────
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_entries_select_pt ON public.journal_entries;
CREATE POLICY journal_entries_select_pt ON public.journal_entries
  FOR SELECT USING (pt_id = auth.uid());

DROP POLICY IF EXISTS journal_entries_select_client ON public.journal_entries;
CREATE POLICY journal_entries_select_client ON public.journal_entries
  FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS journal_entries_insert_pt ON public.journal_entries;
CREATE POLICY journal_entries_insert_pt ON public.journal_entries
  FOR INSERT WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS journal_entries_update_pt ON public.journal_entries;
CREATE POLICY journal_entries_update_pt ON public.journal_entries
  FOR UPDATE USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS journal_entries_update_client ON public.journal_entries;
CREATE POLICY journal_entries_update_client ON public.journal_entries
  FOR UPDATE USING (client_id = auth.uid());

-- ─── journal_ratings ─────────────────────────────────────────
ALTER TABLE public.journal_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_ratings_select_client ON public.journal_ratings;
CREATE POLICY journal_ratings_select_client ON public.journal_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_ratings.journal_entry_id AND je.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS journal_ratings_select_pt ON public.journal_ratings;
CREATE POLICY journal_ratings_select_pt ON public.journal_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_ratings.journal_entry_id AND je.pt_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS journal_ratings_insert_client ON public.journal_ratings;
CREATE POLICY journal_ratings_insert_client ON public.journal_ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_ratings.journal_entry_id AND je.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS journal_ratings_update_client ON public.journal_ratings;
CREATE POLICY journal_ratings_update_client ON public.journal_ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_ratings.journal_entry_id AND je.client_id = auth.uid()
    )
  );

-- ─── muscles ─────────────────────────────────────────────────
ALTER TABLE public.muscles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS muscles_select_all ON public.muscles;
CREATE POLICY muscles_select_all ON public.muscles
  FOR SELECT USING (true);

-- ─── notes ───────────────────────────────────────────────────
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notes_pt_own ON public.notes;
CREATE POLICY notes_pt_own ON public.notes
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS notes_client_reads_shared ON public.notes;
CREATE POLICY notes_client_reads_shared ON public.notes
  FOR SELECT USING (client_id = auth.uid() AND is_shared = true);

-- ─── nutrition_plans ─────────────────────────────────────────
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS nutrition_plans_pt_own ON public.nutrition_plans;
CREATE POLICY nutrition_plans_pt_own ON public.nutrition_plans
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS nutrition_plans_client_reads_own ON public.nutrition_plans;
CREATE POLICY nutrition_plans_client_reads_own ON public.nutrition_plans
  FOR SELECT USING (client_id = auth.uid());

-- ─── offers ──────────────────────────────────────────────────
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS offers_pt_own ON public.offers;
CREATE POLICY offers_pt_own ON public.offers
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

DROP POLICY IF EXISTS offers_client_reads_own ON public.offers;
CREATE POLICY offers_client_reads_own ON public.offers
  FOR SELECT USING (client_id = auth.uid());

-- ─── personal_records ────────────────────────────────────────
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS personal_records_own ON public.personal_records;
CREATE POLICY personal_records_own ON public.personal_records
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS personal_records_pt_reads_clients ON public.personal_records;
CREATE POLICY personal_records_pt_reads_clients ON public.personal_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = personal_records.user_id
        AND tc.status = 'active'
    )
  );

-- ─── plan_exercises ──────────────────────────────────────────
ALTER TABLE public.plan_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plan_exercises_own ON public.plan_exercises;
CREATE POLICY plan_exercises_own ON public.plan_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_exercises.plan_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_exercises.plan_id AND p.user_id = auth.uid()
    )
  );

-- ─── plan_sets ───────────────────────────────────────────────
ALTER TABLE public.plan_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plan_sets_own ON public.plan_sets;
CREATE POLICY plan_sets_own ON public.plan_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.plan_exercises pe
      JOIN public.plans p ON p.id = pe.plan_id
      WHERE pe.id = plan_sets.plan_exercise_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plan_exercises pe
      JOIN public.plans p ON p.id = pe.plan_id
      WHERE pe.id = plan_sets.plan_exercise_id AND p.user_id = auth.uid()
    )
  );

-- ─── plan_shares ─────────────────────────────────────────────
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plan_shares_select_pt ON public.plan_shares;
CREATE POLICY plan_shares_select_pt ON public.plan_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.training_plans tp
      WHERE tp.id = plan_shares.plan_id AND tp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS plan_shares_select_client ON public.plan_shares;
CREATE POLICY plan_shares_select_client ON public.plan_shares
  FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS plan_shares_insert_pt ON public.plan_shares;
CREATE POLICY plan_shares_insert_pt ON public.plan_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_plans tp
      WHERE tp.id = plan_shares.plan_id AND tp.trainer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS plan_shares_delete_pt ON public.plan_shares;
CREATE POLICY plan_shares_delete_pt ON public.plan_shares
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.training_plans tp
      WHERE tp.id = plan_shares.plan_id AND tp.trainer_id = auth.uid()
    )
  );

-- ─── plans ───────────────────────────────────────────────────
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plans_own ON public.plans;
CREATE POLICY plans_own ON public.plans
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── profiles ────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_select_pt_reads_clients ON public.profiles;
CREATE POLICY profiles_select_pt_reads_clients ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = profiles.id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS profiles_select_client_reads_pt ON public.profiles;
CREATE POLICY profiles_select_client_reads_pt ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.client_id = auth.uid()
        AND tc.trainer_id = profiles.id
        AND tc.status = 'active'
    )
  );

DROP POLICY IF EXISTS profiles_select_public_pt ON public.profiles;
CREATE POLICY profiles_select_public_pt ON public.profiles
  FOR SELECT USING (
    role = 'pt'
    AND EXISTS (
      SELECT 1 FROM public.pt_profiles pp
      WHERE pp.id = profiles.id AND pp.is_public = true
    )
  );

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── pt_profiles ─────────────────────────────────────────────
ALTER TABLE public.pt_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pt_profiles_select_own ON public.pt_profiles;
CREATE POLICY pt_profiles_select_own ON public.pt_profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS pt_profiles_select_public ON public.pt_profiles;
CREATE POLICY pt_profiles_select_public ON public.pt_profiles
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS pt_profiles_insert_own ON public.pt_profiles;
CREATE POLICY pt_profiles_insert_own ON public.pt_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS pt_profiles_update_own ON public.pt_profiles;
CREATE POLICY pt_profiles_update_own ON public.pt_profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ─── pt_requests ─────────────────────────────────────────────
ALTER TABLE public.pt_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pt_requests_client_insert ON public.pt_requests;
CREATE POLICY pt_requests_client_insert ON public.pt_requests
  FOR INSERT WITH CHECK (from_client_id = auth.uid());

DROP POLICY IF EXISTS pt_requests_client_own ON public.pt_requests;
CREATE POLICY pt_requests_client_own ON public.pt_requests
  FOR SELECT USING (from_client_id = auth.uid());

DROP POLICY IF EXISTS pt_requests_pt_reads ON public.pt_requests;
CREATE POLICY pt_requests_pt_reads ON public.pt_requests
  FOR SELECT USING (to_pt_id = auth.uid());

DROP POLICY IF EXISTS pt_requests_pt_updates ON public.pt_requests;
CREATE POLICY pt_requests_pt_updates ON public.pt_requests
  FOR UPDATE USING (to_pt_id = auth.uid()) WITH CHECK (to_pt_id = auth.uid());

-- ─── pt_settings ─────────────────────────────────────────────
ALTER TABLE public.pt_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pt_settings_own ON public.pt_settings;
CREATE POLICY pt_settings_own ON public.pt_settings
  FOR ALL USING (pt_id = auth.uid()) WITH CHECK (pt_id = auth.uid());

-- ─── sets ────────────────────────────────────────────────────
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sets_own ON public.sets;
CREATE POLICY sets_own ON public.sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = sets.workout_session_id AND ws.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = sets.workout_session_id AND ws.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS sets_pt_reads_clients ON public.sets;
CREATE POLICY sets_pt_reads_clients ON public.sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      JOIN public.trainer_clients tc ON tc.client_id = ws.user_id
      WHERE ws.id = sets.workout_session_id
        AND tc.trainer_id = auth.uid()
        AND tc.status = 'active'
    )
  );

-- ─── trainer_clients ─────────────────────────────────────────
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trainer_clients_select_pt ON public.trainer_clients;
CREATE POLICY trainer_clients_select_pt ON public.trainer_clients
  FOR SELECT USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS trainer_clients_select_client ON public.trainer_clients;
CREATE POLICY trainer_clients_select_client ON public.trainer_clients
  FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS trainer_clients_insert_pt ON public.trainer_clients;
CREATE POLICY trainer_clients_insert_pt ON public.trainer_clients
  FOR INSERT WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS trainer_clients_update_pt ON public.trainer_clients;
CREATE POLICY trainer_clients_update_pt ON public.trainer_clients
  FOR UPDATE USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS trainer_clients_delete_pt ON public.trainer_clients;
CREATE POLICY trainer_clients_delete_pt ON public.trainer_clients
  FOR DELETE USING (trainer_id = auth.uid());

-- ─── training_plans ──────────────────────────────────────────
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS training_plans_select_pt ON public.training_plans;
CREATE POLICY training_plans_select_pt ON public.training_plans
  FOR SELECT USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS training_plans_select_client ON public.training_plans;
CREATE POLICY training_plans_select_client ON public.training_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.plan_shares ps
      WHERE ps.plan_id = training_plans.id AND ps.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS training_plans_insert_pt ON public.training_plans;
CREATE POLICY training_plans_insert_pt ON public.training_plans
  FOR INSERT WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS training_plans_update_pt ON public.training_plans;
CREATE POLICY training_plans_update_pt ON public.training_plans
  FOR UPDATE USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

DROP POLICY IF EXISTS training_plans_delete_pt ON public.training_plans;
CREATE POLICY training_plans_delete_pt ON public.training_plans
  FOR DELETE USING (trainer_id = auth.uid());

-- ─── workout_exercises ───────────────────────────────────────
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workout_exercises_own ON public.workout_exercises;
CREATE POLICY workout_exercises_own ON public.workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_exercises.workout_session_id AND ws.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_exercises.workout_session_id AND ws.user_id = auth.uid()
    )
  );

-- ─── workout_sessions ────────────────────────────────────────
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workout_sessions_own ON public.workout_sessions;
CREATE POLICY workout_sessions_own ON public.workout_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS workout_sessions_pt_reads_clients ON public.workout_sessions;
CREATE POLICY workout_sessions_pt_reads_clients ON public.workout_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = auth.uid()
        AND tc.client_id = workout_sessions.user_id
        AND tc.status = 'active'
    )
  );
