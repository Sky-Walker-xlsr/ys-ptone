-- 011_drive.sql — Supabase Storage: PT file sharing system
--
-- Bucket structure  (bucket: ptone_drive)
-- ─────────────────────────────────────────────────────────────────
-- {pt_id}/
--   my_files/                       ← PT personal files
--   videos/                         ← PT exercise videos (clients can view in workout)
--   invoices/                       ← PT archive of ALL client invoices
--   clients/
--     {client_id}/
--       documents/                  ← Files for this client (optional subfolders)
--         {subfolder}/
--       invoices/                   ← Invoices for this client (client can view)
-- ─────────────────────────────────────────────────────────────────

-- ── Tables ───────────────────────────────────────────────────────────────────

drop table if exists public.pt_client_folders cascade;
drop table if exists public.pt_files          cascade;

create table public.pt_files (
  id           uuid        primary key default gen_random_uuid(),
  trainer_id   uuid        not null references auth.users(id) on delete cascade,
  client_id    uuid        references auth.users(id) on delete set null,
  name         text        not null,
  storage_path text        not null unique,
  size_bytes   bigint,
  mime_type    text,
  section      text        not null
               check (section in ('my_files','videos','client_documents','client_invoices','pt_invoices')),
  subfolder    text,    -- for client_documents: custom subfolder name, null = root
  created_at   timestamptz not null default now()
);

-- Custom document subfolders the PT creates per client
create table public.pt_client_folders (
  id         uuid        primary key default gen_random_uuid(),
  trainer_id uuid        not null references auth.users(id) on delete cascade,
  client_id  uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  unique (trainer_id, client_id, name)
);

alter table public.pt_files          enable row level security;
alter table public.pt_client_folders enable row level security;

-- ── pt_files RLS ─────────────────────────────────────────────────────────────

-- Trainer: full CRUD on their own rows
create policy "pt_files_trainer_all"
  on public.pt_files for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Client: read files in their own documents + invoice folders (read-only)
create policy "pt_files_client_select"
  on public.pt_files for select
  using (
    client_id = auth.uid()
    and section in ('client_documents', 'client_invoices')
  );

-- ── pt_client_folders RLS ────────────────────────────────────────────────────

create policy "pt_client_folders_trainer_all"
  on public.pt_client_folders for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "pt_client_folders_client_select"
  on public.pt_client_folders for select
  using (client_id = auth.uid());

-- ── Storage object policies (bucket: ptone_drive) ─────────────────────────────

drop policy if exists "ptone_drive_insert" on storage.objects;
drop policy if exists "ptone_drive_update" on storage.objects;
drop policy if exists "ptone_drive_delete" on storage.objects;
drop policy if exists "ptone_drive_select" on storage.objects;

-- Trainers: full write access within their own prefix ({pt_id}/...)
create policy "ptone_drive_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'ptone_drive'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "ptone_drive_update"
  on storage.objects for update
  using (
    bucket_id = 'ptone_drive'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "ptone_drive_delete"
  on storage.objects for delete
  using (
    bucket_id = 'ptone_drive'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Read access:
--   1. Trainer reads anything under their prefix
--   2. Client reads their own subfolder:  {pt_id}/clients/{client_id}/...
--   3. Client reads PT videos (for workout preview):  {pt_id}/videos/...
--
-- storage.foldername('a/b/c/d/file.txt') → ['a','b','c','d']
-- [1]=pt_id  [2]=section  [3]=client_id
create policy "ptone_drive_select"
  on storage.objects for select
  using (
    bucket_id = 'ptone_drive'
    and (
      -- Trainer reads their own prefix
      auth.uid()::text = (storage.foldername(name))[1]

      or (
        -- Client reads their own client subfolder
        (storage.foldername(name))[2] = 'clients'
        and auth.uid()::text = (storage.foldername(name))[3]
        and exists (
          select 1 from public.trainer_clients tc
          where tc.client_id        = auth.uid()
            and tc.trainer_id::text = (storage.foldername(name))[1]
            and tc.status           = 'active'
        )
      )

      or (
        -- Client reads PT exercise videos
        (storage.foldername(name))[2] = 'videos'
        and exists (
          select 1 from public.trainer_clients tc
          where tc.client_id        = auth.uid()
            and tc.trainer_id::text = (storage.foldername(name))[1]
            and tc.status           = 'active'
        )
      )
    )
  );
