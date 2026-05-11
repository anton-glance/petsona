-- R0-M3: backend spine. Creates pets + ai_jobs tables, the pet-photos and
-- medcard-scans storage buckets, a set_updated_at trigger, and the full RLS
-- policy set scoped to auth.uid().
--
-- Per D-002 (Supabase + Postgres + RLS), D-004 (anonymous-first auth), and
-- 03_ARCHITECTURE.md. Bucket path convention is {user_id}/{uuid}.{ext}, so
-- (storage.foldername(name))[1] = auth.uid()::text isolates per-user access.

-- ============================================================================
-- pets
-- ============================================================================

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text,
  species text check (species in ('dog', 'cat')),
  breed text,
  breed_confidence numeric,
  birthdate date,
  weight_kg numeric,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pets_user_id_idx on public.pets (user_id);

alter table public.pets enable row level security;

create policy "pets: select own"
  on public.pets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "pets: insert own"
  on public.pets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "pets: update own"
  on public.pets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pets: delete own"
  on public.pets for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger pets_set_updated_at
  before update on public.pets
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- ai_jobs
-- ============================================================================

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  capability text not null,
  model text not null,
  prompt_version text not null,
  input_tokens int,
  output_tokens int,
  pages int,
  latency_ms int,
  cost_usd numeric(10, 6),
  status text not null,
  error_code text,
  input_hash text,
  created_at timestamptz not null default now()
);

create index ai_jobs_user_id_created_at_idx on public.ai_jobs (user_id, created_at desc);

alter table public.ai_jobs enable row level security;

-- Users read their own rows. No INSERT/UPDATE/DELETE policies are granted to
-- authenticated users -- only the service role (used by edge functions, which
-- bypasses RLS by design) writes to this table.
create policy "ai_jobs: select own"
  on public.ai_jobs for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- Storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('pet-photos', 'pet-photos', false),
  ('medcard-scans', 'medcard-scans', false);

-- ----- pet-photos: 4 policies (select/insert/update/delete) -----

create policy "pet-photos: select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet-photos: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet-photos: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet-photos: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----- medcard-scans: same 4 policies -----

create policy "medcard-scans: select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'medcard-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "medcard-scans: insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'medcard-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "medcard-scans: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'medcard-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'medcard-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "medcard-scans: delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'medcard-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
