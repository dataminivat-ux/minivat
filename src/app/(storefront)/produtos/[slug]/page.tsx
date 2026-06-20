import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import {
  ProductPurchasePanel,
  type PanelVariant,
} from '@/components/storefront/product-purchase-panel'

type Params = Promise<{ slug: string }>

async function getProductData(slug: string) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!product) return null

  const [variantsRes, imagesRes] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id, sku, name, price_cents, stock, options')
      .eq('product_id', product.id)
      .eq('is_active', true),
    supabase
      .from('product_images')
      .select('url, alt_text, is_primary, sort_order')
      .eq('product_id', product.id)
      .order('sort_order'),
  ])

  let category: { slug: string; name: string } | null = null
  if (product.category_id) {
    const { data } = await supabase
      .from('categories')
      .select('slug, name')
      .eq('id', product.category_id)
      .maybeSingle()
    category = data
  }

  return {
    product,
    variants: variantsRes.data ?? [],
    images: imagesRes.data ?? [],
    category,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getProductData(slug)
  if (!data) return { title: 'Produto | MINI VAT PREMIUM' }
  const { product } = data
  return {
    title: product.seo_title ?? `${product.name} | MINI VAT PREMIUM`,
    description: product.seo_description ?? product.short_description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.short_description ?? undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const data = await getProductData(slug)
  if (!data) notFound()

  const { product, images, category } = data
  const variants: PanelVariant[] = data.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    price_cents: v.price_cents,
    stock: v.stock,
    options: (v.options ?? {}) as unknown as Record<string, string>,
  }))

  const primaryImage =
    images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? null

  // JSON-LD basico (Product) — schema markup para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand ?? 'MINI VAT PREMIUM' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: (product.price_cents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        {category && (
          <>
            <Link
              href={`/categorias/${category.slug}`}
              className="hover:text-foreground"
            >
              {category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* galeria */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text ?? product.name}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* info + compra */}
        <div>
          <h1 className="font-heading text-3xl font-bold">{product.name}</h1>
          {product.short_description && (
            <p className="mt-2 text-muted-foreground">
              {product.short_description}
            </p>
          )}

          <div className="mt-6">
            <ProductPurchasePanel
              product={{
                id: product.id,
                slug: product.slug,
                sku: product.sku,
                name: product.name,
                price_cents: product.price_cents,
                compare_at_price_cents: product.compare_at_price_cents,
                stock: product.stock,
                weight_g: product.weight_g,
              }}
              variants={variants}
              thumbnailUrl={primaryImage}
            />
          </div>

          {product.description && (
            <div className="mt-8 border-t pt-6">
              <h2 className="font-heading text-lg font-semibold">Descricao</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
