'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import { useCartStore } from '@/stores/cart-store'
import { trackViewCart } from '@/lib/analytics/events'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Drawer do carrinho: gatilho (icone com badge) + conteudo lateral.
export function CartDrawer() {
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const subtotal = useCartStore((s) => s.getSubtotalCents())
  const totalQty = useCartStore((s) => s.getTotalQuantity())

  // evita mismatch de hidratacao (store persistido so existe no client)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [open, setOpen] = useState(false)
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && items.length > 0) {
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
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Abrir carrinho"
          />
        }
      >
        <ShoppingCart className="size-5" />
        {mounted && totalQty > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {totalQty}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Seu carrinho</SheetTitle>
        </SheetHeader>

        {!mounted || items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            Seu carrinho esta vazio.
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {items.map((item) => (
              <div key={item.variant_id} className="flex gap-3">
                <div className="size-16 shrink-0 rounded-md bg-muted" />
                <div className="flex-1">
                  <p className="line-clamp-2 text-sm font-medium">
                    {item.product_name}
                  </p>
                  {item.variant_name && (
                    <p className="text-xs text-muted-foreground">
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
                    <span className="w-6 text-center text-sm">
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
                      className="ml-auto text-muted-foreground"
                      onClick={() => removeItem(item.variant_id)}
                      aria-label="Remover"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {formatBRL(item.price_cents * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        )}

        <SheetFooter>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatBRL(subtotal)}</span>
          </div>
          <SheetClose
            nativeButton={false}
            render={
              <Link
                href="/carrinho"
                className={cn(
                  buttonVariants(),
                  'w-full',
                  (!mounted || items.length === 0) &&
                    'pointer-events-none opacity-50'
                )}
              />
            }
          >
            Ver carrinho
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
