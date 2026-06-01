-- Adds IBAN and creditor address fields to accounting_settings for Swiss QR invoices
ALTER TABLE public.accounting_settings
  ADD COLUMN IF NOT EXISTS iban                  text,
  ADD COLUMN IF NOT EXISTS creditor_name         text,
  ADD COLUMN IF NOT EXISTS creditor_street       text,
  ADD COLUMN IF NOT EXISTS creditor_postal_code  text,
  ADD COLUMN IF NOT EXISTS creditor_city         text,
  ADD COLUMN IF NOT EXISTS creditor_country      text DEFAULT 'CH';
