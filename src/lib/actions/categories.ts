'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'

export type CategoryState = { error?: string; ok?: boolean } | null

export async function saveCategory(
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  const id = String(formData.get('id') ?? '').trim() || null
  const name = String(formData.get('name') ?? '').trim()
  let slug = String(formData.get('slug') ?? '').trim()
  if (!name) return { error: 'O nome e obrigatorio.' }
  if (!slug) slug = slugify(name)

  const payload = {
    name,
    slug,
    description: String(formData.get('description') ?? '').trim() || null,
    parent_id: String(formData.get('parent_id') ?? '').trim() || null,
    sort_order: parseInt(String(formData.get('sort_order') ?? '0'), 10) || 0,
    is_active: formData.get('is_active') === 'on',
  }

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from('categories').update(payload).eq('id', id)
    : await supabase.from('categories').insert(payload)

  if (error) {
    if (error.code === '23505') return { error: 'Esse slug ja existe.' }
    return { error: error.message }
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  await supabase
    .from('categories')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/categorias')
  revalidatePath('/')
}

export async function toggleCategoryActive(id: string, next: boolean) {
  const supabase = await createClient()
  await supabase.from('categories').update({ is_active: next }).eq('id', id)
  revalidatePath('/admin/categorias')
  revalidatePath('/')
}
