'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Star, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'

type Img = {
  id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export function ProductImageManager({
  productId,
  initialImages,
}: {
  productId: string
  initialImages: Img[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [busy, setBusy] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setBusy(true)
    try {
      let first = initialImages.length === 0
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${productId}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('products')
          .upload(path, file)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('products').getPublicUrl(path)
        const { error: insErr } = await supabase.from('product_images').insert({
          product_id: productId,
          url: pub.publicUrl,
          is_primary: first,
        })
        if (insErr) throw insErr
        first = false
      }
      toast.success('Imagens enviadas.')
      router.refresh()
    } catch (err) {
      toast.error(
        'Falha no upload: ' + (err instanceof Error ? err.message : 'erro')
      )
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  async function setPrimary(imgId: string) {
    setBusy(true)
    try {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)
        .eq('is_primary', true)
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imgId)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove(img: Img) {
    setBusy(true)
    try {
      await supabase.from('product_images').delete().eq('id', img.id)
      const marker = '/products/'
      const idx = img.url.indexOf(marker)
      if (idx >= 0) {
        await supabase.storage
          .from('products')
          .remove([img.url.slice(idx + marker.length)])
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-3xl rounded-xl border p-5">
      <h2 className="font-heading text-sm font-semibold text-muted-foreground">
        Imagens
      </h2>

      {initialImages.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {initialImages.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? ''}
                fill
                sizes="20vw"
                className="object-cover"
              />
              {img.is_primary && (
                <span className="absolute top-1 left-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">
                  Principal
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimary(img.id)}
                  disabled={busy}
                  title="Tornar principal"
                >
                  <Star className="size-4 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(img)}
                  disabled={busy}
                  title="Remover"
                >
                  <Trash2 className="size-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-muted">
        <Upload className="size-4" />
        {busy ? 'Enviando...' : 'Enviar imagens'}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={busy}
        />
      </label>
    </section>
  )
}
