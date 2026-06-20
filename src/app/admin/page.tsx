import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [productsC, categoriesC, ordersC] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Produtos', value: productsC.count ?? 0 },
    { label: 'Categorias', value: categoriesC.count ?? 0 },
    { label: 'Pedidos', value: ordersC.count ?? 0 },
  ]

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Faturamento, alertas e graficos entram quando o checkout (Sprint 2)
        comecar a gerar pedidos.
      </p>
    </div>
  )
}
