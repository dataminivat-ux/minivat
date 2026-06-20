import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/storefront/product-card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()

  const [featuredRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('slug, name, price_cents, compare_at_price_cents, stock')
      .eq('is_active', true)
      .eq('is_featured', true)
      .is('deleted_at', null)
      .limit(8),
    supabase
      .from('categories')
      .select('slug, name, description')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order'),
  ])

  const featured = featuredRes.data ?? []
  const categories = categoriesRes.data ?? []

  return (
    <div>
      {/* hero */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            MINI VAT PREMIUM
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Acessorios premium para impressao 3D odontologica. Precisao,
            durabilidade e acabamento de alto padrao.
          </p>
          <Link
            href="/produtos"
            className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}
          >
            Ver produtos
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* categorias */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-heading text-2xl font-semibold">Categorias</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="group rounded-xl border p-6 transition hover:border-foreground/30 hover:bg-muted/40"
            >
              <p className="font-medium">{c.name}</p>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                Ver produtos <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* destaques */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              Produtos em destaque
            </h2>
            <Link
              href="/produtos"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
