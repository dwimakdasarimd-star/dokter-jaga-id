export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sbmxkvujdlkpwpkdtyaa.supabase.co";

// Publishable keys are designed for browser-side use and are protected by RLS.
// Vercel environment variables can override this value in production.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_MgzZDcxM4q41W-59kDjoHw_dicj7vvR";
