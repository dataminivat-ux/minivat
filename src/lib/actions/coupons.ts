'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export type CouponState = { error?: string; ok?: boolean } | null

function toCentsNullable(formData: FormData, key: string): number | null {
  const v = String(formData.get(key) ?? '').trim()
  if (!v) return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

function toIntNullable(formData: FormData, key: string): number | null {
  const v = String(formData.get(key) ?? '').trim()
  if (!v) return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

export async function saveCoupon(
  _prev: CouponState,
  formData: FormData
): Promise<CouponState> {
  const id = String(formData.get('id') ?? '').trim() || null
  const code = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase()
  if (!code) return { error: 'O codigo e obrigatorio.' }

  const discountType = String(formData.get('discount_type') ?? 'percentage')
  const rawValue = parseFloat(String(formData.get('discount_value') ?? '0')) || 0
  let discountValue = 0
  if (discountType === 'percentage') discountValue = Math.round(rawValue)
  else if (discountType === 'fixed') discountValue = Math.round(rawValue * 100)

  const payload = {
    code,
    description: String(formData.get('description') ?? '').trim() || null,
    discount_type: discountType,
    discount_value: discountValue,
    min_purchase_cents: toCentsNullable(formData, 'min_purchase') ?? 0,
    max_discount_cents: toCentsNullable(formData, 'max_discount'),
    usage_limit: toIntNullable(formData, 'usage_limit'),
    usage_limit_per_user: toIntNullable(formData, 'usage_limit_per_user'),
    expires_at: String(formData.get('expires_at') ?? '').trim() || null,
    is_active: formData.get('is_active') === 'on',
  }

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from('coupons').update(payload).eq('id', id)
    : await supabase.from('coupons').insert(payload)

  if (error) {
    if (error.code === '23505') return { error: 'Esse codigo ja existe.' }
    return { error: error.message }
  }

  revalidatePath('/admin/cupons')
  return { ok: true }
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient()
  await supabase.from('coupons').delete().eq('id', id)
  revalidatePath('/admin/cupons')
}

export async function toggleCouponActive(id: string, next: boolean) {
  const supabase = await createClient()
  await supabase.from('coupons').update({ is_active: next }).eq('id', id)
  revalidatePath('/admin/cupons')
}
