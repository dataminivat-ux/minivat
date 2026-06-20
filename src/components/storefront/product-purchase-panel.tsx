'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

import { useCartStore, type CartItem } from '@/stores/cart-store'
import { formatBRL, formatInstallments } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type PanelVariant = {
  id: string
  sku: string
  name: string
  price_cents: number | null
  stock: number
  options: Record<string, string>
}

export type PanelProduct = {
  id: string
  slug: string
  sku: string
  name: string
  price_cents: number
  compare_at_price_cents: number | null
  stock: number
  weight_g: number
}

export function ProductPurchasePanel({
  product,
  variants,
  thumbnailUrl,
}: {
  product: PanelProduct
  variants: PanelVariant[]
  thumbnailUrl: string | null
}) {
  const addItem = useCartStore((s) => s.addItem)
  const [variantId, setVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  )
  const [qty, setQty] = useState(1)

  const variant = variants.find((v) => v.id === variantId) ?? null
  const priceCents = variant?.price_cents ?? product.price_cents
  const stock = variant ? variant.stock : product.stock
  const outOfStock = stock <= 0
  const lowStock = !outOfStock && stock <= 5
  const onSale =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > priceCents

  function handleAdd() {
    if (outOfStock) return
    const item: CartItem = {
      variant_id: variant?.id ?? product.id,
      product_id: product.id,
      sku: variant?.sku ?? product.sku,
      product_name: product.name,
      variant_name: variant?.name ?? null,
      thumbnail_url: thumbnailUrl,
      price_cents: priceCents,
      quantity: qty,
      weight_g: product.weight_g,
      slug: product.slug,
      attributes: variant?.options ?? {},
    }
    addItem(item)
    toast.success('Adicionado ao carrinho', { description: product.name })
  }

  return (
    <div className="space-y-5">
      {/* preco */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">{formatBRL(priceCents)}</span>
          {onSale && product.compare_at_price_cents != null && (
            <span className="text-lg text-muted-foreground line-through">
              {formatBRL(product.compare_at_price_cents)}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          ou {formatInstallments(priceCents)} sem juros
        </p>
      </div>

      {/* estoque */}
      <div>
        {outOfStock ? (
          <Badge variant="secondary">Esgotado</Badge>
        ) : lowStock ? (
          <Badge variant="destructive">Ultimas {stock} unidades</Badge>
        ) : (
          <Badge>Em estoque</Badge>
        )}
      </div>

      {/* variacoes */}
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Variacao</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition',
                  v.id === variantId
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-foreground/30',
                  v.stock <= 0 && 'opacity-50'
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* quantidade + adicionar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Diminuir quantidade"
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Aumentar quantidade"
          >
            <Plus />
          </Button>
        </div>

        <Button
          className="flex-1"
          size="lg"
          disabled={outOfStock}
          onClick={handleAdd}
        >
          <ShoppingCart />
          {outOfStock ? 'Indisponivel' : 'Adicionar ao carrinho'}
        </Button>
      </div>
    </div>
  )
}
