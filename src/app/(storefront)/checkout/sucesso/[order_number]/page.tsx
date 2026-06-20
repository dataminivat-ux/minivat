import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { createAdminClient } from '@/lib/supabase/admin'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { PurchaseTracker } from '@/components/shared/purchase-tracker'

export default async function SucessoPage({
  params,
}: {
  params: Promise<{ order_number: string }>
}) {
  const { order_number } = await params
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_number, customer_name, subtotal_cents, discount_cents, shipping_cents, total_cents, status'
    )
    .eq('order_number', order_number)
    .maybeSingle()

  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, total_cents')
    .eq('order_id', order.id)

  const isPending = order.status === 'pending'

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <PurchaseTracker
        orderNumber={order.order_number}
        totalReais={order.total_cents / 100}
      />

      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-primary" />
        <h1 className="mt-4 font-heading text-2xl font-bold">
          Pedido recebido!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pedido <span className="font-mono">{order.order_number}</span>
        </p>
        {isPending && (
          <p className="mt-2 text-sm text-muted-foreground">
            Aguardando pagamento. (O gateway sera ativado com as chaves do
            Mercado Pago.)
          </p>
        )}
      </div>

      <div className="mt-8 rounded-xl border p-5">
        <h2 className="font-heading text-sm font-semibold text-muted-foreground">
          Resumo
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(items ?? []).map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {it.quantity}x {it.product_name}
              </span>
              <span>{formatBRL(it.total_cents)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBRL(order.subtotal_cents)}</span>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-primary">
              <span>Desconto</span>
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
      </div>

      <Link href="/produtos" className={cn(buttonVariants(), 'mt-8 w-full')}>
        Continuar comprando
      </Link>
    </div>
  )
}
