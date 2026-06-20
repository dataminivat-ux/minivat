import { createClient } from '@/lib/supabase/server'

type ServerClient = Awaited<ReturnType<typeof createClient>>

// Anexa a URL da imagem principal a uma lista de produtos (1 query extra).
// Respeita o RLS (product_images tem leitura publica).
export async function withPrimaryImages<T extends { id: string }>(
  supabase: ServerClient,
  products: T[]
): Promise<Array<T & { primary_image_url: string | null }>> {
  if (products.length === 0) return []

  const ids = products.map((p) => p.id)
  const { data: images } = await supabase
    .from('product_images')
    .select('product_id, url, is_primary')
    .in('product_id', ids)

  const map = new Map<string, string>()
  for (const img of images ?? []) {
    if (img.is_primary || !map.has(img.product_id)) {
      map.set(img.product_id, img.url)
    }
  }

  return products.map((p) => ({
    ...p,
    primary_image_url: map.get(p.id) ?? null,
  }))
}
