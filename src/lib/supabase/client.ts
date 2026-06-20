import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './types'

// Client do Supabase para uso no browser (Client Components).
// Usa a anon key + RLS.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
