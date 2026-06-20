import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/storefront/header'
import { Footer } from '@/components/storefront/footer'
import { Analytics } from '@/components/shared/analytics'
import { CookieBanner } from '@/components/shared/cookie-banner'
import { Toaster } from '@/components/ui/sonner'

// Layout da area publica: header (com categorias do banco), footer e toasts.
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, name')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order')

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.minivatpremium.com.br'
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MINI VAT PREMIUM',
    url: siteUrl,
    description:
      'Acessorios premium para impressao 3D odontologica: cubetas, mesas e mais.',
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <Analytics />
      <Header categories={categories ?? []} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
      <Toaster />
    </div>
  )
}
