import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'

import { formatBRL, formatInstallments } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

export type ProductCardData = {
  slug: string
  name: string
  price_cents: number
  compare_at_price_cents: number | null
  stock: number
  primary_image_url?: string | null
}

// Card de produto reutilizavel (Server Component — sem estado).
export function ProductCard({ product }: { product: ProductCardData }) {
  const onSale =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents
  const outOfStock = product.stock <= 0
  const discount = onSale
    ? Math.round(
        (1 - product.price_cents / (product.compare_at_price_cents as number)) *
          100
      )
    : 0

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-lg hover:shadow-foreground/5"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.primary_image_url ? (
          <Image
            src={product.primary_image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageIcon className="size-10" />
          </div>
        )}
        {onSale && (
          <Badge className="absolute top-3 left-3 shadow-sm">-{discount}%</Badge>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Badge variant="secondary">Esgotado</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">
          {product.name}
        </h3>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold">
              {formatBRL(product.price_cents)}
            </span>
            {onSale && product.compare_at_price_cents != null && (
              <span className="text-xs text-muted-foreground line-through">
                {formatBRL(product.compare_at_price_cents)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatInstallments(product.price_cents)}
          </p>
        </div>
      </div>
    </Link>
  )
}
