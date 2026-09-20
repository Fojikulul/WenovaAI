# Setting up accounts (Supabase, free plan)

Accounts are optional. Without Supabase, the Essay Checker and Lessons work exactly as
before, and My progress, Settings and Sign in show "Accounts aren't set up yet".

With Supabase connected, students 13+ can create an account to save essay-check mistake
categories, quiz scores and settings, and get a learning path. Essay text is never saved.

## 1. Create a free project

1. Go to https://supabase.com, sign in, and click **New project** (Free plan).
2. Pick a name (e.g. `wenova`), a strong database password (keep it in a password manager;
   the app doesn't need it), and the region closest to your users (e.g. East US).

## 2. Create the tables

1. In the project, open **SQL Editor** → **New query**.
2. Paste all of `supabase/migrations/20261021000000_accounts_progress.sql` and click **Run**.
3. Check **Table Editor**: `profiles`, `learning_activity` and `learning_path_items` exist, and
   each shows **RLS enabled**.

(With the Supabase CLI instead: `supabase link` then `supabase db push`.)

## 3. Auth settings

**Authentication → URL Configuration**
- **Site URL**: your live site, e.g. `https://your-app.vercel.app`
- **Redirect URLs**: add
  - `http://localhost:3000/auth/confirm`
  - `https://your-app.vercel.app/auth/confirm`
  - (optional, for Vercel preview links) `https://*-your-team.vercel.app/auth/confirm`

**Authentication → Sign In / Providers → Email**
- Email + password is on by default. Leave other providers off.
- **Confirm email**: on by default. Supabase's built-in email service is free but only sends
  a few emails per hour, and is meant for testing. For a demo or judging, either:
  - turn **Confirm email** off (accounts work right after sign-up), or
  - set up custom SMTP later (Authentication → Emails → SMTP).
- The confirmation link must be opened in the same browser where the student signed up.

## 4. Connect the app

1. **Project Settings → API Keys**: copy the **Project URL** and the **Publishable key**
   (`sb_publishable_…`). Never use the secret / service-role key: this app doesn't need it.
2. In the project folder, copy `.env.example` to `.env.local` (if you don't have one) and set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
3. Restart `npm run dev`.
4. On Vercel: **Project → Settings → Environment Variables**, add the same two variables
   (Production and Preview), then redeploy.

## 5. Check it works

1. Open `/login`, create an account, confirm the email if that's on.
2. Check an essay (needs a real `ANTHROPIC_API_KEY`; sample feedback isn't saved), then finish
   a lesson quiz. Both should show on `/progress`.
3. Change the preferred difficulty in `/settings`: the quiz slider starts at 5 / 7 / 10, and
   the learning path is rebuilt.
4. Row Level Security check: create a second account in a private window. It must show an
   empty `/progress`, never the first account's data.

## What's stored (see /privacy)

| Table | What | Never |
| --- | --- | --- |
| `profiles` | display name, English level, preferred difficulty, weekly goal | |
| `learning_activity` | essay check: mistakes per lesson id + practice estimate; quiz: lesson, score, time | essay text, mistake words |
| `learning_path_items` | recommended lessons, order, status, reason | |

Every table has Row Level Security: a signed-in student can only read and change their own
rows. `delete_my_account()` deletes only the caller's own account (and, through
`on delete cascade`, all of their rows).
