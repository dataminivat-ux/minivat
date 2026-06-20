import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'

import { formatBRL } from '@/lib/format'
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

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group block overflow-hidden rounded-xl ring-1 ring-foreground/10 transition hover:ring-foreground/20"
    >
      <div className="relative aspect-square bg-muted">
        {product.primary_image_url ? (
          <Image
            src={product.primary_image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-10" />
          </div>
        )}
        {onSale && <Badge className="absolute top-2 left-2">Oferta</Badge>}
        {outOfStock && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            Esgotado
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold">{formatBRL(product.price_cents)}</span>
          {onSale && product.compare_at_price_cents != null && (
            <span className="text-xs text-muted-foreground line-through">
              {formatBRL(product.compare_at_price_cents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
