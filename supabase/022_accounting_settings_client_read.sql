-- Allow active clients to read their trainer's accounting settings
-- (needed for client-side PDF generation: currency, colors, IBAN, footer)
DROP POLICY IF EXISTS accounting_settings_client_read ON public.accounting_settings;
CREATE POLICY accounting_settings_client_read ON public.accounting_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients tc
      WHERE tc.trainer_id = accounting_settings.pt_id
        AND tc.client_id  = auth.uid()
        AND tc.status     = 'active'
    )
  );
