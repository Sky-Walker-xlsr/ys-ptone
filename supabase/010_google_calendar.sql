create table if not exists google_calendar_connections (
  id            uuid        primary key default gen_random_uuid(),
  trainer_id    uuid        not null references auth.users(id) on delete cascade,
  access_token  text        not null,
  refresh_token text,
  token_expiry  timestamptz,
  scope         text,
  google_email  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (trainer_id)
);

alter table google_calendar_connections enable row level security;

create policy "trainer can read own google connection"
  on google_calendar_connections for select
  using (auth.uid() = trainer_id);

create policy "trainer can delete own google connection"
  on google_calendar_connections for delete
  using (auth.uid() = trainer_id);
