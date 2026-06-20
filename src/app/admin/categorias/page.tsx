import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from '@/components/admin/category-manager'

export const metadata = { title: 'Categorias | Admin MINI VAT' }

export default async function AdminCategorias() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, description, parent_id, sort_order, is_active')
    .is('deleted_at', null)
    .order('sort_order')

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold">Categorias</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Crie, edite, reordene e ative/desative categorias.
      </p>
      <CategoryManager categories={data ?? []} />
    </div>
  )
}
