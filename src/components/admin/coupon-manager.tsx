'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

import {
  deleteCoupon,
  saveCoupon,
  toggleCouponActive,
} from '@/lib/actions/coupons'
import { formatBRL } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export type Coupon = {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  min_purchase_cents: number
  max_discount_cents: number | null
  usage_limit: number | null
  usage_limit_per_user: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
}

function valueLabel(c: Coupon): string {
  if (c.discount_type === 'percentage') return `${c.discount_value}%`
  if (c.discount_type === 'fixed') return formatBRL(c.discount_value)
  return 'Frete gratis'
}

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveCoupon, null)
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState<Coupon | null>(null)

  useEffect(() => {
    if (state?.ok) {
      toast.success('Cupom salvo.')
      setEditing(null)
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  const reais = (c: number | null | undefined) =>
    c == null ? '' : (c / 100).toString()
  const valueDefault = editing
    ? editing.discount_type === 'fixed'
      ? (editing.discount_value / 100).toString()
      : editing.discount_value.toString()
    : ''

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <form
        key={editing?.id ?? 'new'}
        action={action}
        className="h-fit space-y-4 rounded-xl border p-5"
      >
        <h2 className="text-sm font-semibold text-muted-foreground">
          {editing ? 'Editar cupom' : 'Novo cupom'}
        </h2>
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="space-y-1.5">
          <Label htmlFor="code">Codigo *</Label>
          <Input
            id="code"
            name="code"
            defaultValue={editing?.code}
            placeholder="EX: BEMVINDO10"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Descricao</Label>
          <Input
            id="description"
            name="description"
            defaultValue={editing?.description ?? ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="discount_type">Tipo</Label>
            <select
              id="discount_type"
              name="discount_type"
              defaultValue={editing?.discount_type ?? 'percentage'}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
              <option value="free_shipping">Frete gratis</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount_value">Valor</Label>
            <Input
              id="discount_value"
              name="discount_value"
              type="number"
              step="0.01"
              min="0"
              defaultValue={valueDefault}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min_purchase">Compra minima (R$)</Label>
            <Input
              id="min_purchase"
              name="min_purchase"
              type="number"
              step="0.01"
              min="0"
              defaultValue={reais(editing?.min_purchase_cents)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_discount">Desconto max (R$)</Label>
            <Input
              id="max_discount"
              name="max_discount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={reais(editing?.max_discount_cents)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="usage_limit">Limite total</Label>
            <Input
              id="usage_limit"
              name="usage_limit"
              type="number"
              min="0"
              defaultValue={editing?.usage_limit ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usage_limit_per_user">Limite por usuario</Label>
            <Input
              id="usage_limit_per_user"
              name="usage_limit_per_user"
              type="number"
              min="0"
              defaultValue={editing?.usage_limit_per_user ?? ''}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expires_at">Expira em</Label>
          <Input
            id="expires_at"
            name="expires_at"
            type="date"
            defaultValue={editing?.expires_at?.slice(0, 10) ?? ''}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={editing ? editing.is_active : true}
            className="size-4"
          />
          Ativo
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Codigo</th>
              <th className="p-3 font-medium">Desconto</th>
              <th className="p-3 font-medium">Usos</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs font-medium">{c.code}</td>
                <td className="p-3">{valueLabel(c)}</td>
                <td className="p-3 text-muted-foreground">
                  {c.used_count}
                  {c.usage_limit ? `/${c.usage_limit}` : ''}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() =>
                        toggleCouponActive(c.id, !c.is_active).then(() =>
                          router.refresh()
                        )
                      )
                    }
                  >
                    {c.is_active ? (
                      <Badge>Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </button>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(() =>
                        deleteCoupon(c.id).then(() => router.refresh())
                      )
                    }
                    className="ml-3 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="inline size-4" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Nenhum cupom ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
