// Supabase settings from .env.local (see .env.example and
// docs/SUPABASE_SETUP.md). Both are safe to show in the browser: the
// publishable key only allows what the Row Level Security policies allow.
// The service-role (secret) key is never used in this app.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// Without these, accounts are switched off: the Essay Checker and Lessons
// work as before, and the account pages explain that sign-in isn't set up.
export const isSupabaseConfigured = SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";
