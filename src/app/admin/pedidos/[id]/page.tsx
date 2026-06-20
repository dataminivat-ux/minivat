import { notFound } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from '@/lib/order-status'
import { OrderStatusSelect } from '@/components/admin/order-status-select'

type Address = {
  recipient_name?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

export default async function AdminPedidoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  const [itemsRes, paymentsRes, historyRes] = await Promise.all([
    supabase
      .from('order_items')
      .select('product_name, variant_name, product_sku, quantity, unit_price_cents, total_cents')
      .eq('order_id', id),
    supabase
      .from('payments')
      .select('method, status, amount_cents, installments, gateway_payment_id')
      .eq('order_id', id),
    supabase
      .from('order_status_history')
      .select('from_status, to_status, created_at')
      .eq('order_id', id)
      .order('created_at', { ascending: false }),
  ])

  const items = itemsRes.data ?? []
  const payment = paymentsRes.data?.[0] ?? null
  const history = historyRes.data ?? []
  const addr = (order.shipping_address ?? {}) as Address

  return (
    <div className="p-6">
      <Link
        href="/admin/pedidos"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Pedidos
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold">{order.order_number}</h1>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            ORDER_STATUS_CLASSES[order.status]
          )}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* esquerda */}
        <div className="space-y-6">
          <section className="rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground">Cliente</h2>
            <div className="mt-2 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-muted-foreground">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-muted-foreground">{order.customer_phone}</p>
              )}
              {order.customer_cpf && (
                <p className="text-muted-foreground">CPF/CNPJ: {order.customer_cpf}</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Endereco de entrega
            </h2>
            <p className="mt-2 text-sm">
              {addr.street}, {addr.number}
              {addr.complement ? ` - ${addr.complement}` : ''}
              <br />
              {addr.neighborhood} - {addr.city}/{addr.state}
              <br />
              CEP {addr.cep}
            </p>
            {(order.shipping_method || order.shipping_carrier) && (
              <p className="mt-2 text-sm text-muted-foreground">
                Frete: {order.shipping_carrier} {order.shipping_method}
                {order.shipping_estimated_days
                  ? ` (${order.shipping_estimated_days} dias)`
                  : ''}
              </p>
            )}
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground">Itens</h2>
            <ul className="mt-3 divide-y">
              {items.map((it, i) => (
                <li key={i} className="flex justify-between py-2 text-sm">
                  <span>
                    {it.quantity}x {it.product_name}
                    {it.variant_name ? ` (${it.variant_name})` : ''}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {it.product_sku}
                    </span>
                  </span>
                  <span className="font-medium">{formatBRL(it.total_cents)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBRL(order.subtotal_cents)}</span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Desconto {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span>- {formatBRL(order.discount_cents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatBRL(order.shipping_cents)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <span>Total</span>
                <span>{formatBRL(order.total_cents)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* direita */}
        <div className="space-y-6">
          <section className="rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground">Status</h2>
            <div className="mt-3">
              <OrderStatusSelect id={order.id} current={order.status as OrderStatus} />
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Pagamento
            </h2>
            {payment ? (
              <div className="mt-2 space-y-1 text-sm">
                <p>Metodo: {payment.method}</p>
                <p>Status: {payment.status}</p>
                <p>Valor: {formatBRL(payment.amount_cents)}</p>
                <p>Parcelas: {payment.installments}x</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Sem pagamento registrado (gateway inativo).
              </p>
            )}
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Historico
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{ORDER_STATUS_LABELS[h.to_status]}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
