'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { saveProduct } from '@/lib/actions/products'
import { slugify } from '@/lib/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ProductValues = {
  id: string
  sku: string
  slug: string
  name: string
  brand: string | null
  category_id: string | null
  short_description: string | null
  description: string | null
  price_cents: number
  compare_at_price_cents: number | null
  cost_cents: number | null
  stock: number
  low_stock_threshold: number
  weight_g: number
  width_cm: number
  height_cm: number
  length_cm: number
  is_active: boolean
  is_featured: boolean
  requires_shipping: boolean
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
}

type Category = { id: string; name: string }

const reais = (c: number | null | undefined) =>
  c == null ? '' : (c / 100).toString()

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border p-5">
      <h2 className="font-heading text-sm font-semibold text-muted-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductValues
  categories: Category[]
}) {
  const [state, action, pending] = useActionState(saveProduct, null)
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug))

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  const effectiveSlug = slugTouched ? slug : slugify(name)

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Section title="Geral">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" name="sku" defaultValue={product?.sku} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand">Marca</Label>
            <Input
              id="brand"
              name="brand"
              defaultValue={product?.brand ?? 'MINI VAT PREMIUM'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Categoria</Label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={product?.category_id ?? ''}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="short_description">Descricao curta</Label>
          <Textarea
            id="short_description"
            name="short_description"
            rows={2}
            defaultValue={product?.short_description ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Descricao completa</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? ''}
          />
        </div>
      </Section>

      <Section title="Precos (em reais)">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Preco *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={reais(product?.price_cents)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compare_at_price">Preco "de"</Label>
            <Input
              id="compare_at_price"
              name="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={reais(product?.compare_at_price_cents)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost">Custo</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={reais(product?.cost_cents)}
            />
          </div>
        </div>
      </Section>

      <Section title="Estoque">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stock">Quantidade</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              defaultValue={product?.stock ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="low_stock_threshold">Alerta de estoque baixo</Label>
            <Input
              id="low_stock_threshold"
              name="low_stock_threshold"
              type="number"
              min="0"
              defaultValue={product?.low_stock_threshold ?? 5}
            />
          </div>
        </div>
      </Section>

      <Section title="Dimensoes (frete)">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="weight_g">Peso (g)</Label>
            <Input
              id="weight_g"
              name="weight_g"
              type="number"
              min="0"
              defaultValue={product?.weight_g ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="width_cm">Largura (cm)</Label>
            <Input
              id="width_cm"
              name="width_cm"
              type="number"
              min="0"
              defaultValue={product?.width_cm ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height_cm">Altura (cm)</Label>
            <Input
              id="height_cm"
              name="height_cm"
              type="number"
              min="0"
              defaultValue={product?.height_cm ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="length_cm">Comprimento (cm)</Label>
            <Input
              id="length_cm"
              name="length_cm"
              type="number"
              min="0"
              defaultValue={product?.length_cm ?? 0}
            />
          </div>
        </div>
      </Section>

      <Section title="SEO">
        <div className="space-y-1.5">
          <Label htmlFor="seo_title">Titulo SEO</Label>
          <Input
            id="seo_title"
            name="seo_title"
            defaultValue={product?.seo_title ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seo_description">Descricao SEO</Label>
          <Textarea
            id="seo_description"
            name="seo_description"
            rows={2}
            defaultValue={product?.seo_description ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seo_keywords">Palavras-chave (separadas por virgula)</Label>
          <Input
            id="seo_keywords"
            name="seo_keywords"
            defaultValue={(product?.seo_keywords ?? []).join(', ')}
          />
        </div>
      </Section>

      <Section title="Status">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={product ? product.is_active : true}
              className="size-4"
            />
            Ativo (visivel na loja)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              className="size-4"
            />
            Em destaque (aparece na home)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="requires_shipping"
              defaultChecked={product ? product.requires_shipping : true}
              className="size-4"
            />
            Requer envio
          </label>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Salvando...' : product ? 'Salvar alteracoes' : 'Criar produto'}
        </Button>
      </div>
    </form>
  )
}
