import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { withPrimaryImages } from '@/lib/catalog'
import { ProductCard } from '@/components/storefront/product-card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BENEFITS = [
  {
    icon: Truck,
    title: 'Entrega para todo o Brasil',
    desc: 'Frete calculado pelo seu CEP no checkout.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagamento seguro',
    desc: 'Pix e cartao via Mercado Pago.',
  },
  {
    icon: Sparkles,
    title: 'Qualidade premium',
    desc: 'Materiais duraveis e de alta precisao.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()

  const [featuredRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, name, price_cents, compare_at_price_cents, stock')
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

  const featured = await withPrimaryImages(supabase, featuredRes.data ?? [])
  const categories = categoriesRes.data ?? []
  const heroImage = featured.find((f) => f.primary_image_url)?.primary_image_url

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-muted/60 via-background to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3" /> Acessorios 3D para odontologia
            </span>
            <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Precisao premium para sua{' '}
              <span className="text-primary">impressao 3D</span>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Cubetas, mesas e acessorios de alta durabilidade para laboratorios
              e clinicas odontologicas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className={cn(buttonVariants({ size: 'lg' }))}
              >
                Ver produtos
                <ArrowRight />
              </Link>
              <Link
                href="/categorias/mini-vat"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
              >
                Mini VATs
              </Link>
            </div>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted shadow-xl">
            {heroImage && (
              <Image
                src={heroImage}
                alt="Produto MINI VAT PREMIUM"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            )}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <b.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-heading text-2xl font-bold">Categorias</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="group rounded-2xl border p-6 transition hover:border-foreground/20 hover:shadow-md"
            >
              <p className="text-lg font-semibold">{c.name}</p>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Explorar
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold">Em destaque</h2>
            <Link
              href="/produtos"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
