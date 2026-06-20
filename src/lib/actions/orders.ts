'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/lib/order-status'
import type { Database } from '@/lib/supabase/types'

type OrderUpdate = Database['public']['Tables']['orders']['Update']

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = await createClient()
  const patch: OrderUpdate = { status }
  const now = new Date().toISOString()
  if (status === 'paid') patch.paid_at = now
  if (status === 'shipped') patch.shipped_at = now
  if (status === 'delivered') patch.delivered_at = now
  if (status === 'cancelled') patch.cancelled_at = now

  await supabase.from('orders').update(patch).eq('id', id)
  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${id}`)
}

export async function updateOrderNotes(id: string, internalNotes: string) {
  const supabase = await createClient()
  await supabase
    .from('orders')
    .update({ internal_notes: internalNotes })
    .eq('id', id)
  revalidatePath(`/admin/pedidos/${id}`)
}
