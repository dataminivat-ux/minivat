import { createClient } from '@/lib/supabase/server'
import {
  SettingsForm,
  type SettingsValues,
} from '@/components/admin/settings-form'

export const metadata = { title: 'Configuracoes | Admin MINI VAT' }

export default async function AdminConfiguracoes() {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key, value')
  const map = new Map((data ?? []).map((s) => [s.key, s.value]))

  const str = (k: string) => {
    const v = map.get(k)
    return typeof v === 'string' ? v : ''
  }
  const num = (k: string) => {
    const v = map.get(k)
    return typeof v === 'number' ? v : 0
  }

  const values: SettingsValues = {
    contact_email: str('contact_email'),
    contact_whatsapp: str('contact_whatsapp'),
    about_text: str('about_text'),
    shipping_policy_md: str('shipping_policy_md'),
    return_policy_md: str('return_policy_md'),
    privacy_policy_md: str('privacy_policy_md'),
    terms_md: str('terms_md'),
    max_installments: num('max_installments') || 6,
    free_shipping_threshold_reais: num('free_shipping_threshold_cents') / 100,
    checkout_min_total_reais: num('checkout_min_total_cents') / 100,
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Configuracoes</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Contato, regras da loja e textos das paginas institucionais.
      </p>
      <SettingsForm values={values} />
    </div>
  )
}
