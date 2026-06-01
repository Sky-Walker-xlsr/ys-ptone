-- Allow clients to read invoices where they are the client
DROP POLICY IF EXISTS invoices_client_read ON public.invoices;
CREATE POLICY invoices_client_read ON public.invoices
  FOR SELECT USING (auth.uid() = client_id);