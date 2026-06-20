'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

import {
  deleteCategory,
  saveCategory,
  toggleCategoryActive,
} from '@/lib/actions/categories'
import { slugify } from '@/lib/slug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export type Cat = {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  sort_order: number
  is_active: boolean
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveCategory, null)
  const [, startTransition] = useTransition()

  const [editing, setEditing] = useState<Cat | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (state?.ok) {
      toast.success('Categoria salva.')
      setEditing(null)
      setName('')
      setSlug('')
      setSlugTouched(false)
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const effectiveSlug = slugTouched ? slug : slugify(name)

  function startEdit(c: Cat) {
    setEditing(c)
    setName(c.name)
    setSlug(c.slug)
    setSlugTouched(true)
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
    setSlug('')
    setSlugTouched(false)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      {/* formulario */}
      <form
        key={editing?.id ?? 'new'}
        action={action}
        className="h-fit space-y-4 rounded-xl border p-5"
      >
        <h2 className="font-heading text-sm font-semibold text-muted-foreground">
          {editing ? 'Editar categoria' : 'Nova categoria'}
        </h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Nome *</Label>
          <Input
            id="cat-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input
            id="cat-slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-desc">Descricao</Label>
          <Textarea
            id="cat-desc"
            name="description"
            rows={2}
            defaultValue={editing?.description ?? ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-sort">Ordem</Label>
            <Input
              id="cat-sort"
              name="sort_order"
              type="number"
              defaultValue={editing?.sort_order ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-parent">Categoria pai</Label>
            <select
              id="cat-parent"
              name="parent_id"
              defaultValue={editing?.parent_id ?? ''}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Nenhuma</option>
              {categories
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={editing ? editing.is_active : true}
            className="size-4"
          />
          Ativa
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* lista */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Ordem</th>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3">{c.sort_order}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {c.slug}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() =>
                        toggleCategoryActive(c.id, !c.is_active).then(() =>
                          router.refresh()
                        )
                      )
                    }
                  >
                    {c.is_active ? (
                      <Badge>Ativa</Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() =>
                        deleteCategory(c.id).then(() => router.refresh())
                      )
                    }
                    className="ml-3 text-muted-foreground hover:text-destructive"
                    title="Desativar"
                  >
                    <Trash2 className="inline size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Nenhuma categoria ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
