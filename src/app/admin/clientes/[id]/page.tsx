import { notFound } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/order-status'

export default async function AdminClienteDetalhe({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, cpf, phone, role, marketing_opt_in, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!profile) notFound()

  const [ordersRes, addressesRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, order_number, total_cents, status, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('street, number, city, state, cep')
      .eq('user_id', id),
  ])

  const orders = ordersRes.data ?? []
  const addresses = addressesRes.data ?? []
  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((acc, o) => acc + o.total_cents, 0)

  return (
    <div className="p-6">
      <Link
        href="/admin/clientes"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Clientes
      </Link>
      <h1 className="mt-2 text-2xl font-bold">
        {profile.full_name ?? '(sem nome)'}
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">Pedidos</h2>
          <ul className="mt-3 divide-y">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href={`/admin/pedidos/${o.id}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {o.order_number}
                </Link>
                <span className="text-muted-foreground">
                  {ORDER_STATUS_LABELS[o.status as OrderStatus]}
                </span>
                <span className="font-medium">{formatBRL(o.total_cents)}</span>
              </li>
            ))}
            {orders.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">
                Nenhum pedido.
              </li>
            )}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border p-5 text-sm">
            <h2 className="text-sm font-semibold text-muted-foreground">Dados</h2>
            <div className="mt-2 space-y-1">
              <p>{profile.email}</p>
              {profile.phone && <p>{profile.phone}</p>}
              {profile.cpf && <p>CPF: {profile.cpf}</p>}
              <p className="text-muted-foreground">
                Marketing: {profile.marketing_opt_in ? 'sim' : 'nao'}
              </p>
            </div>
          </section>

          <section className="rounded-xl border p-5 text-sm">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Total gasto
            </h2>
            <p className="mt-2 text-2xl font-bold">{formatBRL(totalSpent)}</p>
          </section>

          <section className="rounded-xl border p-5 text-sm">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Enderecos
            </h2>
            {addresses.length === 0 ? (
              <p className="mt-2 text-muted-foreground">Nenhum endereco.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {addresses.map((a, i) => (
                  <li key={i} className="text-muted-foreground">
                    {a.street}, {a.number} — {a.city}/{a.state} ({a.cep})
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
