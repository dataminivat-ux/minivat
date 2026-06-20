import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/product-form'

export const metadata = { title: 'Novo produto | Admin MINI VAT' }

export default async function NovoProduto() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .is('deleted_at', null)
    .order('sort_order')

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold">Novo produto</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        As imagens podem ser adicionadas apos salvar o produto.
      </p>
      <ProductForm categories={categories ?? []} />
    </div>
  )
}
