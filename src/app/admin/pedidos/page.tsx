import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  type OrderStatus,
} from '@/lib/order-status'

export const metadata = { title: 'Pedidos | Admin MINI VAT' }

type SearchParams = Promise<{ status?: string }>

export default async function AdminPedidos({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const active = sp.status as OrderStatus | undefined

  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, total_cents, status, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (active && ORDER_STATUS_ORDER.includes(active)) {
    query = query.eq('status', active)
  }

  const { data: orders } = await query
  const list = orders ?? []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/pedidos"
          className={cn(
            'rounded-full border px-3 py-1 text-sm',
            !active ? 'border-primary bg-primary/5' : 'text-muted-foreground'
          )}
        >
          Todos
        </Link>
        {ORDER_STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/admin/pedidos?status=${s}`}
            className={cn(
              'rounded-full border px-3 py-1 text-sm',
              active === s
                ? 'border-primary bg-primary/5'
                : 'text-muted-foreground'
            )}
          >
            {ORDER_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Numero</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-mono text-xs font-medium text-primary hover:underline"
                  >
                    {o.order_number}
                  </Link>
                </td>
                <td className="p-3">
                  <div>{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.customer_email}
                  </div>
                </td>
                <td className="p-3 font-medium">{formatBRL(o.total_cents)}</td>
                <td className="p-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      ORDER_STATUS_CLASSES[o.status]
                    )}
                  >
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Nenhum pedido {active ? 'com esse status' : 'ainda'}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
