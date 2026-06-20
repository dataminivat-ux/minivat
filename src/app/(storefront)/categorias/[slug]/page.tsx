import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { withPrimaryImages } from '@/lib/catalog'
import { ProductCard } from '@/components/storefront/product-card'

type Params = Promise<{ slug: string }>

async function getCategory(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return { title: 'Categoria | MINI VAT PREMIUM' }
  return {
    title: `${category.name} | MINI VAT PREMIUM`,
    description: category.description ?? undefined,
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) notFound()

  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, name, price_cents, compare_at_price_cents, stock')
    .eq('is_active', true)
    .eq('category_id', category.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const list = await withPrimaryImages(supabase, products ?? [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">{category.name}</h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {category.description}
        </p>
      )}

      {list.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Nenhum produto nesta categoria ainda.
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
