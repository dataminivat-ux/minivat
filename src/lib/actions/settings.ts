'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'

export type SettingsState = { ok?: boolean; error?: string } | null

const TEXT_KEYS = [
  'contact_email',
  'contact_whatsapp',
  'about_text',
  'shipping_policy_md',
  'return_policy_md',
  'privacy_policy_md',
  'terms_md',
]

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const rows: { key: string; value: Json }[] = []

  for (const k of TEXT_KEYS) {
    rows.push({ key: k, value: String(formData.get(k) ?? '') })
  }

  // numericos
  const maxInstallments =
    parseInt(String(formData.get('max_installments') ?? '6'), 10) || 6
  rows.push({ key: 'max_installments', value: maxInstallments })

  const freeShipReais =
    parseFloat(String(formData.get('free_shipping_threshold_reais') ?? '0')) || 0
  rows.push({
    key: 'free_shipping_threshold_cents',
    value: Math.round(freeShipReais * 100),
  })

  const minTotalReais =
    parseFloat(String(formData.get('checkout_min_total_reais') ?? '0')) || 0
  rows.push({
    key: 'checkout_min_total_cents',
    value: Math.round(minTotalReais * 100),
  })

  const supabase = await createClient()
  const { error } = await supabase
    .from('site_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) return { error: error.message }

  // revalida o que usa essas configs
  for (const path of [
    '/',
    '/institucional/sobre',
    '/institucional/frete',
    '/institucional/trocas-devolucoes',
    '/institucional/privacidade',
    '/institucional/termos',
    '/institucional/contato',
  ]) {
    revalidatePath(path)
  }

  return { ok: true }
}
