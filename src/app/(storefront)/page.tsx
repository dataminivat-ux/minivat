import { createClient } from '@/lib/supabase/server'

// Home temporaria — valida a conexao com o Supabase listando as categorias
// ativas (seed). Sera substituida pela home real no Sprint 1.
export default async function HomePage() {
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <main className="mx-auto min-h-screen max-w-2xl p-8">
      <h1 className="text-4xl font-bold">MINI VAT PREMIUM</h1>
      <p className="text-muted-foreground mt-2">Em construcao</p>

      <h2 className="mt-8 text-2xl font-semibold">Categorias</h2>
      <ul className="mt-4 list-disc pl-6">
        {categories?.map((c) => <li key={c.slug}>{c.name}</li>)}
      </ul>
      {error && <p className="mt-4 text-destructive">{error.message}</p>}
    </main>
  )
}
