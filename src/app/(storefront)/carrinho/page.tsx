'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'

import { useCartStore } from '@/stores/cart-store'
import { trackViewCart } from '@/lib/analytics/events'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'

export default function CarrinhoPage() {
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const subtotal = useCartStore((s) => s.getSubtotalCents())

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // view_cart ao abrir a pagina do carrinho
  useEffect(() => {
    if (!mounted || items.length === 0) return
    trackViewCart(
      items.map((i) => ({
        item_id: i.sku,
        item_name: i.product_name,
        item_variant: i.variant_name ?? undefined,
        price: i.price_cents / 100,
        quantity: i.quantity,
      })),
      subtotal / 100
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  if (!mounted) {
    return <div className="mx-auto min-h-[40vh] max-w-4xl px-4 py-10" />
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">Seu carrinho</h1>
        <p className="mt-2 text-muted-foreground">
          Seu carrinho esta vazio.
        </p>
        <Link href="/produtos" className={cn(buttonVariants(), 'mt-6')}>
          Ver produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Seu carrinho</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.variant_id} className="flex gap-4 py-4">
              <Link
                href={`/produtos/${item.slug}`}
                className="size-20 shrink-0 rounded-md bg-muted"
              />
              <div className="flex-1">
                <Link
                  href={`/produtos/${item.slug}`}
                  className="font-medium hover:underline"
                >
                  {item.product_name}
                </Link>
                {item.variant_name && (
                  <p className="text-sm text-muted-foreground">
                    {item.variant_name}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      updateQuantity(item.variant_id, item.quantity - 1)
                    }
                    aria-label="Diminuir"
                  >
                    <Minus />
                  </Button>
                  <span className="w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      updateQuantity(item.variant_id, item.quantity + 1)
                    }
                    aria-label="Aumentar"
                  >
                    <Plus />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="ml-2 text-muted-foreground"
                    onClick={() => removeItem(item.variant_id)}
                    aria-label="Remover"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="text-right font-medium">
                {formatBRL(item.price_cents * item.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-lg font-semibold">{formatBRL(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Frete calculado no checkout.
          </p>
          <Link
            href="/checkout"
            className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full')}
          >
            Finalizar compra
          </Link>
          <Link
            href="/produtos"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'mt-2 w-full'
            )}
          >
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
