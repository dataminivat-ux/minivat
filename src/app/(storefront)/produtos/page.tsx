import type { Metadata } from 'next'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { withPrimaryImages } from '@/lib/catalog'
import { ProductCard } from '@/components/storefront/product-card'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Produtos | MINI VAT PREMIUM',
  description: 'Catalogo completo de acessorios para impressao 3D odontologica.',
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const SORTS = [
  { key: 'mais_recentes', label: 'Mais recentes' },
  { key: 'preco_asc', label: 'Menor preco' },
  { key: 'preco_desc', label: 'Maior preco' },
]

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const ordenar = typeof sp.ordenar === 'string' ? sp.ordenar : 'mais_recentes'

  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('id, slug, name, price_cents, compare_at_price_cents, stock')
    .eq('is_active', true)
    .is('deleted_at', null)

  if (ordenar === 'preco_asc') {
    query = query.order('price_cents', { ascending: true })
  } else if (ordenar === 'preco_desc') {
    query = query.order('price_cents', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query.limit(60)
  const list = await withPrimaryImages(supabase, products ?? [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold">Produtos</h1>
        <div className="flex gap-2">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={`/produtos?ordenar=${s.key}`}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition',
                ordenar === s.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
