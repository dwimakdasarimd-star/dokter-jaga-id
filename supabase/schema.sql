-- Dokter Jaga Clinical: initial relational schema
-- Run this in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.doctor_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  license_number text,
  specialty text default 'Dokter Umum',
  clinic_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  medical_record_no text not null,
  full_name text not null,
  sex text check (sex in ('L','P')),
  birth_date date,
  phone text,
  address text,
  allergies text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, medical_record_no)
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_date timestamptz not null default now(),
  chief_complaint text,
  subjective jsonb not null default '{}'::jsonb,
  objective jsonb not null default '{}'::jsonb,
  assessment jsonb not null default '{}'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','signed','amended')),
  signed_at timestamptz,
  rule_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  encounter_id uuid references public.encounters(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','signed','cancelled')),
  items jsonb not null default '[]'::jsonb,
  notes text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  visit_type text not null default 'Konsultasi',
  status text not null default 'scheduled' check (status in ('scheduled','waiting','in_progress','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  body text not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.doctor_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.encounters enable row level security;
alter table public.prescriptions enable row level security;
alter table public.appointments enable row level security;
alter table public.templates enable row level security;
alter table public.audit_logs enable row level security;

create policy "doctor profiles own row" on public.doctor_profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "patients own rows" on public.patients for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "encounters own rows" on public.encounters for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "prescriptions own rows" on public.prescriptions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "appointments own rows" on public.appointments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "templates own or shared" on public.templates for select using (owner_id = auth.uid() or is_shared = true);
create policy "templates own insert" on public.templates for insert with check (owner_id = auth.uid());
create policy "templates own update" on public.templates for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "templates own delete" on public.templates for delete using (owner_id = auth.uid());
create policy "audit own rows" on public.audit_logs for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index if not exists patients_owner_name_idx on public.patients(owner_id, full_name);
create index if not exists encounters_owner_date_idx on public.encounters(owner_id, encounter_date desc);
create index if not exists appointments_owner_start_idx on public.appointments(owner_id, starts_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.doctor_profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
