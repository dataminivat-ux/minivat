'use server'

import { createClient } from '@/lib/supabase/server'

export type NewsletterResult = { ok: boolean; message: string }

// Inscreve um e-mail na newsletter (RLS: policy "anyone subscribes").
export async function subscribeNewsletter(
  _prev: NewsletterResult | null,
  formData: FormData
): Promise<NewsletterResult> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, message: 'Informe um e-mail valido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email, source: 'storefront' })

  if (error) {
    if (error.code === '23505') {
      return { ok: true, message: 'Voce ja esta inscrito!' }
    }
    return { ok: false, message: 'Nao foi possivel inscrever. Tente novamente.' }
  }

  return { ok: true, message: 'Inscricao confirmada! Obrigado.' }
}
