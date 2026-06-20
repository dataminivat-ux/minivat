import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/order-status'

export const metadata = { title: 'Meus pedidos | MINI VAT PREMIUM' }

export default async function ContaPedidos() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total_cents, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const list = orders ?? []

  return (
    <div>
      <h2 className="text-lg font-semibold">Meus pedidos</h2>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Voce ainda nao fez nenhum pedido.
        </p>
      ) : (
        <ul className="mt-4 divide-y rounded-xl border">
          {list.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <Link
                  href={`/checkout/sucesso/${o.order_number}`}
                  className="font-mono text-sm font-medium text-accent hover:underline"
                >
                  {o.order_number}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  ORDER_STATUS_CLASSES[o.status as OrderStatus]
                )}
              >
                {ORDER_STATUS_LABELS[o.status as OrderStatus]}
              </span>
              <span className="font-semibold">{formatBRL(o.total_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
