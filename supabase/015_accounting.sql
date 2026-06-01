-- ─── Invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_number     text NOT NULL,
  title              text NOT NULL,
  status             text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','overdue','reminder1','reminder2','paid','cancelled')),
  issue_date         date NOT NULL DEFAULT CURRENT_DATE,
  due_date           date NOT NULL,
  subtotal           numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate           numeric(5,2)  NOT NULL DEFAULT 0,
  tax_amount         numeric(10,2) NOT NULL DEFAULT 0,
  total              numeric(10,2) NOT NULL DEFAULT 0,
  notes              text,
  pdf_url            text,
  sent_at            timestamptz,
  paid_at            timestamptz,
  reminder1_sent_at  timestamptz,
  reminder2_sent_at  timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── Invoice line items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  text NOT NULL,
  quantity     numeric(10,2) NOT NULL DEFAULT 1,
  unit_price   numeric(10,2) NOT NULL,
  total        numeric(10,2) NOT NULL,
  position     integer NOT NULL DEFAULT 0
);

-- ─── Expense entries ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_entries (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title              text NOT NULL,
  amount             numeric(10,2) NOT NULL,
  category           text NOT NULL DEFAULT 'other',
  date               date NOT NULL DEFAULT CURRENT_DATE,
  notes              text,
  receipt_url        text,
  is_recurring       boolean NOT NULL DEFAULT false,
  recurring_interval text CHECK (recurring_interval IN ('weekly','monthly','quarterly','yearly')),
  next_occurrence    date,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── Extend accounting_settings ───────────────────────────────────────────────
ALTER TABLE public.accounting_settings
  ADD COLUMN IF NOT EXISTS email_auto_send   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_email text;

-- ─── RLS: invoices ────────────────────────────────────────────────────────────
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_pt_own ON public.invoices;
CREATE POLICY invoices_pt_own ON public.invoices
  USING (auth.uid() = pt_id) WITH CHECK (auth.uid() = pt_id);

-- ─── RLS: invoice_items ───────────────────────────────────────────────────────
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_items_pt_own ON public.invoice_items;
CREATE POLICY invoice_items_pt_own ON public.invoice_items
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = invoice_items.invoice_id AND pt_id = auth.uid()
    )
  );

-- ─── RLS: expense_entries ─────────────────────────────────────────────────────
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expense_entries_pt_own ON public.expense_entries;
CREATE POLICY expense_entries_pt_own ON public.expense_entries
  USING (auth.uid() = pt_id) WITH CHECK (auth.uid() = pt_id);

-- ─── Storage bucket for accounting files ──────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('accounting', 'accounting', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS accounting_storage_own ON storage.objects;
CREATE POLICY accounting_storage_own ON storage.objects
  FOR ALL USING (
    bucket_id = 'accounting' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
