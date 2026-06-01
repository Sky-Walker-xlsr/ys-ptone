-- The invoices table already existed with different columns.
-- This adds the columns needed by the accounting module.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS title         text         DEFAULT '',
  ADD COLUMN IF NOT EXISTS status        text         NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS subtotal      numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount    numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total         numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_at       timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at       timestamptz,
  ADD COLUMN IF NOT EXISTS reminder1_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder2_sent_at timestamptz;

-- Backfill subtotal/total from existing amount columns
UPDATE public.invoices
SET
  subtotal = COALESCE(amount, 0),
  total    = COALESCE(amount_with_tax, amount, 0)
WHERE subtotal = 0;

-- Map existing payment_status → new status field
UPDATE public.invoices
SET status = CASE payment_status::text
  WHEN 'bezahlt' THEN 'paid'
  ELSE 'draft'
END;
