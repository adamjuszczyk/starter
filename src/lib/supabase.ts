import { createClient } from '@supabase/supabase-js'

// Strip any invisible/non-ASCII characters (BOM, zero-width spaces, etc.) that
// can be accidentally introduced when copy-pasting values into a hosting dashboard.
// These characters are above U+007E and cause "non ISO-8859-1 code point" errors
// in the Authorization header across all browsers.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string ?? '')
  .replace(/[^\x20-\x7E]/g, '')
  .trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string ?? '')
  .replace(/[^\x20-\x7E]/g, '')
  .trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in your project values.',
  )
}

// The key supabase-js keeps the session under in the browser's localStorage. It is supabase-js's own default (`sb-<project>-auth-token`, from
// the project's host name; SupabaseClient.ts, auth-js 2.110.0), written out and handed back to it, so a sign-out that cannot reach the server
// can name the session it has to remove from this device (features/auth/authService.ts, `signOut`). Nothing changes for a session already
// stored: the key is the one it was stored under.
export const AUTH_STORAGE_KEY = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { storageKey: AUTH_STORAGE_KEY } })
