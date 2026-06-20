'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function setReviewPublished(id: string, published: boolean) {
  const supabase = await createClient()
  await supabase
    .from('reviews')
    .update({
      is_published: published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', id)
  revalidatePath('/admin/avaliacoes')
}

export async function deleteReview(id: string) {
  const supabase = await createClient()
  await supabase.from('reviews').delete().eq('id', id)
  revalidatePath('/admin/avaliacoes')
}
