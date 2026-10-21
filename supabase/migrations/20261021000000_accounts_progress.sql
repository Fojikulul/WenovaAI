-- Wenova accounts, progress and learning path.
-- Run once in a Supabase project (SQL Editor, or `supabase db push`).
-- See docs/SUPABASE_SETUP.md.
--
-- Privacy (CLAUDE.md): no student writing is stored here. An essay check is
-- stored as its mistake categories (lesson ids and counts) and grade only.
-- Every table has Row Level Security, so a signed-in user can only read and
-- change their own rows.

-- ---------------------------------------------------------------------------
-- profiles: one row per account, made automatically on sign-up.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  -- Where the student thinks they are now.
  english_level text check (
    english_level is null
    or english_level in ('beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced')
  ),
  -- How challenging they want practice to be (changes quiz length and which
  -- lessons fill the learning path; see lib/learning-path.ts).
  preferred_difficulty text not null default 'intermediate'
    check (preferred_difficulty in ('beginner', 'intermediate', 'advanced')),
  weekly_goal_minutes integer not null default 60
    check (weekly_goal_minutes between 10 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- learning_activity: one row per finished essay check or quiz.
-- ---------------------------------------------------------------------------
create table public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_type text not null check (activity_type in ('essay_check', 'quiz_completed')),
  -- quiz_completed: the lesson id. essay_check: null.
  reference_id text check (reference_id is null or char_length(reference_id) <= 64),
  -- quiz_completed: right answers out of max_score.
  -- essay_check: the overall practice estimate (1-5), or null without a grade.
  score numeric check (score is null or score >= 0),
  max_score numeric check (max_score is null or max_score > 0),
  -- quiz_completed: time from "Start quiz" to the score screen (capped at 1 hour).
  duration_seconds integer check (duration_seconds is null or duration_seconds between 0 and 3600),
  -- essay_check: mistakes per lesson id, e.g. {"past-simple": 2, "articles": 1}.
  -- Never the essay text.
  mistake_counts jsonb check (mistake_counts is null or jsonb_typeof(mistake_counts) = 'object'),
  created_at timestamptz not null default now(),
  check (max_score is null or score is null or score <= max_score)
);

create index learning_activity_user_created_idx
  on public.learning_activity (user_id, created_at desc);
create index learning_activity_user_type_idx
  on public.learning_activity (user_id, activity_type, created_at desc);

-- ---------------------------------------------------------------------------
-- learning_path_items: the lessons recommended to a user, in order.
-- Rebuilt by the app after each essay check, quiz and settings change.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- updated_at on every change
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- A profile row for every new account. security definer lets it write to
-- profiles while the sign-up request itself has no session yet; it only ever
-- uses the new user's own id. The optional display name comes from the
-- sign-up form (trimmed, max 40 characters).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Row Level Security: own rows only. (select auth.uid()) is the form
-- Supabase recommends, so it's worked out once per query.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.learning_activity enable row level security;
alter table public.learning_path_items enable row level security;

-- profiles: read and edit your own. Rows are made by the trigger and removed
-- with the account, so there's no insert or delete policy.
create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- learning_activity: a history, so rows are added and read, never edited.
-- Delete is allowed so a student can erase their own history.
create policy "Read own activity" on public.learning_activity
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add own activity" on public.learning_activity
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own activity" on public.learning_activity
  for delete to authenticated using ((select auth.uid()) = user_id);

-- learning_path_items: full control over your own path.
create policy "Read own path" on public.learning_path_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Add to own path" on public.learning_path_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own path" on public.learning_path_items
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete from own path" on public.learning_path_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Delete my account: a signed-in student can delete their own account (and,
-- through "on delete cascade", all their rows above). It only ever deletes
-- auth.uid(), the caller's own id, so no secret key is needed in the app.
-- ---------------------------------------------------------------------------
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
