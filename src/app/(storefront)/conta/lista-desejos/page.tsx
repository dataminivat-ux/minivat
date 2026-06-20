import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { withPrimaryImages } from '@/lib/catalog'
import { formatBRL } from '@/lib/format'
import { removeFromWishlist } from '@/lib/actions/wishlist'

export const metadata = { title: 'Lista de desejos | MINI VAT PREMIUM' }

export default async function ContaWishlist() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', user!.id)

  const ids = (items ?? []).map((i) => i.product_id)
  let products: Array<{
    id: string
    slug: string
    name: string
    price_cents: number
    primary_image_url: string | null
  }> = []

  if (ids.length) {
    const { data } = await supabase
      .from('products')
      .select('id, slug, name, price_cents')
      .in('id', ids)
      .eq('is_active', true)
      .is('deleted_at', null)
    products = await withPrimaryImages(supabase, data ?? [])
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Lista de desejos</h2>
      {products.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Sua lista esta vazia. Toque no coracao nos produtos para salvar.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border">
              <Link
                href={`/produtos/${p.slug}`}
                className="relative block aspect-square bg-muted"
              >
                {p.primary_image_url ? (
                  <Image
                    src={p.primary_image_url}
                    alt={p.name}
                    fill
                    sizes="33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </Link>
              <div className="p-3">
                <Link
                  href={`/produtos/${p.slug}`}
                  className="line-clamp-2 text-sm font-medium hover:underline"
                >
                  {p.name}
                </Link>
                <p className="mt-1 text-sm font-semibold">
                  {formatBRL(p.price_cents)}
                </p>
                <form action={removeFromWishlist.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remover
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
