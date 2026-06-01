-- Allow clients to read invoice line items for their own invoices
DROP POLICY IF EXISTS invoice_items_client_read ON public.invoice_items;
CREATE POLICY invoice_items_client_read ON public.invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE id = invoice_items.invoice_id AND client_id = auth.uid()
    )
  );
