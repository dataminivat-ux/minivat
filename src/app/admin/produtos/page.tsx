import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Produtos | Admin MINI VAT' }

export default async function AdminProdutos() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, sku, name, price_cents, stock, is_active, low_stock_threshold')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const list = products ?? []

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Produtos</h1>
        <Link href="/admin/produtos/novo" className={cn(buttonVariants())}>
          + Novo produto
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Preco</th>
              <th className="p-3 font-medium">Estoque</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{formatBRL(p.price_cents)}</td>
                <td className="p-3">
                  {p.stock <= p.low_stock_threshold ? (
                    <span className="font-medium text-destructive">{p.stock}</span>
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="p-3">
                  {p.is_active ? (
                    <Badge>Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/produtos/${p.id}`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Nenhum produto ainda. Crie o primeiro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
