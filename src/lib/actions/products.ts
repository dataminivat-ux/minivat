'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'

export type SaveProductState = { error: string } | null

// Converte um input em reais (ex: "1299.90") para centavos (integer).
function reaisToCents(value: FormDataEntryValue | null): number {
  const n = parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

function reaisToCentsNullable(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

function toInt(value: FormDataEntryValue | null): number {
  const n = parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : 0
}

function checkbox(formData: FormData, key: string): boolean {
  const v = formData.get(key)
  return v === 'on' || v === 'true'
}

export async function saveProduct(
  _prev: SaveProductState,
  formData: FormData
): Promise<SaveProductState> {
  const id = String(formData.get('id') ?? '').trim() || null
  const name = String(formData.get('name') ?? '').trim()
  const sku = String(formData.get('sku') ?? '').trim()
  let slug = String(formData.get('slug') ?? '').trim()

  if (!name) return { error: 'O nome e obrigatorio.' }
  if (!sku) return { error: 'O SKU e obrigatorio.' }
  if (!slug) slug = slugify(name)

  const keywords = String(formData.get('seo_keywords') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const payload = {
    sku,
    slug,
    name,
    brand: String(formData.get('brand') ?? '').trim() || null,
    category_id: String(formData.get('category_id') ?? '').trim() || null,
    short_description: String(formData.get('short_description') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
    price_cents: reaisToCents(formData.get('price')),
    compare_at_price_cents: reaisToCentsNullable(formData.get('compare_at_price')),
    cost_cents: reaisToCentsNullable(formData.get('cost')),
    stock: toInt(formData.get('stock')),
    low_stock_threshold: toInt(formData.get('low_stock_threshold')),
    weight_g: toInt(formData.get('weight_g')),
    width_cm: toInt(formData.get('width_cm')),
    height_cm: toInt(formData.get('height_cm')),
    length_cm: toInt(formData.get('length_cm')),
    is_active: checkbox(formData, 'is_active'),
    is_featured: checkbox(formData, 'is_featured'),
    requires_shipping: checkbox(formData, 'requires_shipping'),
    seo_title: String(formData.get('seo_title') ?? '').trim() || null,
    seo_description: String(formData.get('seo_description') ?? '').trim() || null,
    seo_keywords: keywords.length ? keywords : null,
  }

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from('products').update(payload).eq('id', id)
    : await supabase.from('products').insert(payload)

  if (error) {
    if (error.code === '23505') {
      return { error: 'SKU ou slug ja existe. Use valores unicos.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
  revalidatePath(`/produtos/${slug}`)
  redirect('/admin/produtos')
}

// Soft-delete (mantem historico): marca inativo + deleted_at.
export async function deleteProduct(id: string) {
  const supabase = await createClient()
  await supabase
    .from('products')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
}

export async function toggleProductActive(id: string, next: boolean) {
  const supabase = await createClient()
  await supabase.from('products').update({ is_active: next }).eq('id', id)
  revalidatePath('/admin/produtos')
  revalidatePath('/produtos')
}
