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
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute top-10 left-10 size-72 rounded-full bg-cyan-500 mix-blend-screen blur-3xl" />
          <div className="absolute right-10 bottom-0 size-72 rounded-full bg-blue-500 mix-blend-screen blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300">
              <Sparkles className="size-3" /> Acessorios 3D para odontologia
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-bold md:text-5xl">
              Precisao premium para sua{' '}
              <span className="text-gradient-cyan">impressao 3D</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">
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
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/30 px-5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Conhecer Mini VATs
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="gradient-minivat-cyan absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl" />
            <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-white/10 shadow-premium-dark">
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
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <b.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold">Categorias</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="group rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-premium"
            >
              <p className="text-lg font-semibold">{c.name}</p>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </p>
              )}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
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
            <h2 className="text-3xl font-bold">Em destaque</h2>
            <Link
              href="/produtos"
              className="text-sm font-medium text-accent hover:underline"
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
