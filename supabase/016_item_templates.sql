-- Adds saved item templates to accounting_settings (JSON array of {name, items[]})
ALTER TABLE public.accounting_settings
  ADD COLUMN IF NOT EXISTS item_templates jsonb DEFAULT '[]'::jsonb;
