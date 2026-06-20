import { Star } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { ReviewActions } from '@/components/admin/review-actions'

export const metadata = { title: 'Avaliacoes | Admin MINI VAT' }

export default async function AdminAvaliacoes() {
  const supabase = await createClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_published, created_at, product_id')
    .order('created_at', { ascending: false })
    .limit(200)

  const list = reviews ?? []
  const productIds = [...new Set(list.map((r) => r.product_id))]
  const { data: products } = productIds.length
    ? await supabase.from('products').select('id, name').in('id', productIds)
    : { data: [] }
  const names = new Map((products ?? []).map((p) => [p.id, p.name]))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Avaliacoes</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Modere as avaliacoes — apenas as publicadas aparecem na loja.
      </p>

      <div className="space-y-4">
        {list.map((r) => (
          <div key={r.id} className="rounded-xl border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.rating
                            ? 'size-4 fill-amber-400 text-amber-400'
                            : 'size-4 text-muted-foreground/30'
                        }
                      />
                    ))}
                  </span>
                  {r.is_published ? (
                    <Badge>Publicada</Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium">
                  {names.get(r.product_id) ?? 'Produto'}
                </p>
                {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
                {r.body && (
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                )}
              </div>
              <ReviewActions id={r.id} published={r.is_published} />
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="rounded-xl border p-8 text-center text-muted-foreground">
            Nenhuma avaliacao ainda.
          </p>
        )}
      </div>
    </div>
  )
}
