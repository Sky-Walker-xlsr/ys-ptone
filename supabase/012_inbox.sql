-- 012_inbox.sql — Contact requests from landing page to PT inbox

drop table if exists public.contact_requests cascade;

create table public.contact_requests (
  id         uuid        primary key default gen_random_uuid(),
  pt_id      uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  email      text        not null,
  message    text,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_requests enable row level security;

-- Anyone (including anon) can submit a contact request
create policy "contact_requests_anon_insert"
  on public.contact_requests for insert
  with check (true);

-- PT reads their own inbox
create policy "contact_requests_pt_select"
  on public.contact_requests for select
  using (pt_id = auth.uid());

-- PT marks messages as read
create policy "contact_requests_pt_update"
  on public.contact_requests for update
  using (pt_id = auth.uid())
  with check (pt_id = auth.uid());

-- PT can delete messages
create policy "contact_requests_pt_delete"
  on public.contact_requests for delete
  using (pt_id = auth.uid());
