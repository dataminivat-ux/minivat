import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import {
  ProductForm,
  type ProductValues,
} from '@/components/admin/product-form'
import { ProductImageManager } from '@/components/admin/product-image-manager'

export default async function EditProduto({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!product) notFound()

  const [categoriesRes, imagesRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .is('deleted_at', null)
      .order('sort_order'),
    supabase
      .from('product_images')
      .select('id, url, alt_text, is_primary, sort_order')
      .eq('product_id', id)
      .order('sort_order'),
  ])

  const values: ProductValues = {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category_id: product.category_id,
    short_description: product.short_description,
    description: product.description,
    price_cents: product.price_cents,
    compare_at_price_cents: product.compare_at_price_cents,
    cost_cents: product.cost_cents,
    stock: product.stock,
    low_stock_threshold: product.low_stock_threshold,
    weight_g: product.weight_g,
    width_cm: product.width_cm,
    height_cm: product.height_cm,
    length_cm: product.length_cm,
    is_active: product.is_active,
    is_featured: product.is_featured,
    requires_shipping: product.requires_shipping,
    seo_title: product.seo_title,
    seo_description: product.seo_description,
    seo_keywords: product.seo_keywords,
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="font-heading text-2xl font-bold">Editar produto</h1>
      <ProductForm categories={categoriesRes.data ?? []} product={values} />
      <ProductImageManager productId={id} initialImages={imagesRes.data ?? []} />
    </div>
  )
}
