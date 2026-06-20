import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/storefront/header'
import { Footer } from '@/components/storefront/footer'
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={categories ?? []} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </div>
  )
}
