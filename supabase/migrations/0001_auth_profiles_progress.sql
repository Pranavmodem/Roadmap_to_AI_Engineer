-- AI ENGINEER / 180 — accounts, profiles, and synced learner state.
-- Run in the Supabase SQL editor (or `supabase db push`). Mirrors the
-- ELI5Code auth design: profiles auto-created from signup metadata,
-- username-or-email login, RLS everywhere.

-- User profiles: info collected at signup
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text,
  experience text,
  goal text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Per-user learner state: one JSONB blob (completedDays, quizScores, srs,
-- notes, bookmarks, snippets, projectChecks, activityDates, startDate, mode).
-- Client-side merge keeps schema evolution migration-free.
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "user_progress_own" on public.user_progress;
create policy "user_progress_own" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Username availability check callable pre-signup (definer bypasses RLS,
-- returns only a boolean so no profile data leaks)
create or replace function public.username_available(name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(name)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;

-- Resolve a username to its login email (for username+password sign-in).
-- Definer so anon can call it; returns only the email, nothing else.
create or replace function public.get_login_email(name text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select u.email::text
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(name)
  limit 1;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

-- Auto-create the profile row from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, username, role, experience, goal)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'role',
      new.raw_user_meta_data->>'experience',
      new.raw_user_meta_data->>'goal'
    );
  exception when unique_violation then
    -- username race: fall back to a suffixed variant so signup never breaks
    insert into public.profiles (id, username, role, experience, goal)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))
        || '_' || substr(new.id::text, 1, 4),
      new.raw_user_meta_data->>'role',
      new.raw_user_meta_data->>'experience',
      new.raw_user_meta_data->>'goal'
    );
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
