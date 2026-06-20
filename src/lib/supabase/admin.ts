import { createClient } from '@supabase/supabase-js'

import type { Database } from './types'

// Client com a service_role key: BYPASSA o RLS.
// SOMENTE no servidor (webhooks, jobs, mutacoes financeiras validadas).
// NUNCA importar em Client Components nem expor a chave no browser.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
