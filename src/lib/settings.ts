import { createClient } from '@/lib/supabase/server'

// Le um valor de site_settings (jsonb). Retorna string quando o valor
// guardado for textual, senao null.
export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (!data) return null
  return typeof data.value === 'string' ? data.value : null
}
