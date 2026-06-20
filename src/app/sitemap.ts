import type { MetadataRoute } from 'next'

import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .is('deleted_at', null),
    supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true)
      .is('deleted_at', null),
  ])

  const staticRoutes: MetadataRoute.Sitemap = ['', '/produtos'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.8,
  }))

  const productRoutes: MetadataRoute.Sitemap = (productsRes.data ?? []).map(
    (p) => ({
      url: `${base}/produtos/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  )

  const categoryRoutes: MetadataRoute.Sitemap = (categoriesRes.data ?? []).map(
    (c) => ({
      url: `${base}/categorias/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  )

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
