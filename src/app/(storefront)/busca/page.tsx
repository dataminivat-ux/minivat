import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import {
  ProductCard,
  type ProductCardData,
} from '@/components/storefront/product-card'
import { SearchTracker } from '@/components/shared/search-tracker'

export const metadata: Metadata = {
  title: 'Busca | MINI VAT PREMIUM',
}

type SearchParams = Promise<{ q?: string | string[] }>

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const q = (typeof sp.q === 'string' ? sp.q : '').trim()

  let list: ProductCardData[] = []
  if (q) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('slug, name, price_cents, compare_at_price_cents, stock')
      .textSearch('search_tsv', q, { type: 'websearch', config: 'portuguese' })
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(50)
    list = data ?? []
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {q && <SearchTracker term={q} />}
      <h1 className="font-heading text-2xl font-bold">
        {q ? `Resultados para "${q}"` : 'Busca'}
      </h1>

      {!q ? (
        <p className="mt-4 text-muted-foreground">
          Digite um termo na barra de busca.
        </p>
      ) : list.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Nenhum produto encontrado para &quot;{q}&quot;.
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
