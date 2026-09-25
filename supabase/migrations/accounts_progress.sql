-- Run once in a Supabase project (SQL Editor, or `supabase db push`). See docs/SUPABASE_SETUP.md.
-- No student writing is stored here, and every table has Row Level Security (own rows only).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  english_level text check (
    english_level is null
    or english_level in ('beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced')
  ),
  preferred_difficulty text not null default 'intermediate'
    check (preferred_difficulty in ('beginner', 'intermediate', 'advanced')),
  weekly_goal_minutes integer not null default 60
    check (weekly_goal_minutes between 10 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_type text not null check (activity_type in ('essay_check', 'quiz_completed')),
  reference_id text check (reference_id is null or char_length(reference_id) <= 64),
  score numeric check (score is null or score >= 0),
  max_score numeric check (max_score is null or max_score > 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 3600),
  mistake_counts jsonb check (mistake_counts is null or jsonb_typeof(mistake_counts) = 'object'),
  created_at timestamptz not null default now(),
  check (max_score is null or score is null or score <= max_score)
);

create index learning_activity_user_created_idx
  on public.learning_activity (user_id, created_at desc);
create index learning_activity_user_type_idx
  on public.learning_activity (user_id, activity_type, created_at desc);

create table public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) <= 64),
  position integer not null check (position >= 0),
  status text not null default 'recommended'
    check (status in ('recommended', 'in_progress', 'completed')),
  reason text not null check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index learning_path_items_user_position_idx
  on public.learning_path_items (user_id, position);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger learning_path_items_set_updated_at
  before update on public.learning_path_items
  for each row execute function public.set_updated_at();

-- security definer: the sign-up request has no session yet. It only ever uses the new user's own id.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  name text := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 40), '');
begin
  insert into public.profiles (id, display_name) values (new.id, name);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: own rows only.
alter table public.profiles enable row level security;
alter table public.learning_activity enable row level security;
alter table public.learning_path_items enable row level security;

create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Read own activity" on public.learning_activity
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own activity" on public.learning_activity
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own activity" on public.learning_activity
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Read own path" on public.learning_path_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add to own path" on public.learning_path_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own path" on public.learning_path_items
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete from own path" on public.learning_path_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Deletes only auth.uid(), the caller's own account (their rows go with it: on delete cascade).
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- The trigger functions are only for the triggers, never for API calls.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
