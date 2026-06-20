'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

import { deleteAddress, saveAddress } from '@/lib/actions/addresses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export type Address = {
  id: string
  recipient_name: string
  cep: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  is_default: boolean
}

type FormState = Omit<Address, 'id' | 'complement'> & { complement: string }

const EMPTY: FormState = {
  recipient_name: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  is_default: false,
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveAddress, null)
  const [, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [f, setF] = useState<FormState>(EMPTY)

  useEffect(() => {
    if (state?.ok) {
      toast.success('Endereco salvo.')
      setEditingId(null)
      setF(EMPTY)
      router.refresh()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  function startEdit(a: Address) {
    setEditingId(a.id)
    setF({ ...a, complement: a.complement ?? '' })
  }

  async function lookupCep() {
    const digits = f.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    try {
      const res = await fetch(`/api/cep/${digits}`)
      if (res.ok) {
        const d = await res.json()
        setF((s) => ({
          ...s,
          street: d.street || s.street,
          neighborhood: d.neighborhood || s.neighborhood,
          city: d.city || s.city,
          state: d.state || s.state,
        }))
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Enderecos</h2>

      {addresses.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl border p-4 text-sm">
              <div className="flex items-start justify-between">
                <p className="font-medium">{a.recipient_name}</p>
                {a.is_default && <Badge>Padrao</Badge>}
              </div>
              <p className="mt-1 text-muted-foreground">
                {a.street}, {a.number}
                {a.complement ? ` - ${a.complement}` : ''}
                <br />
                {a.neighborhood} - {a.city}/{a.state}
                <br />
                CEP {a.cep}
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="text-primary hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() =>
                      deleteAddress(a.id).then(() => router.refresh())
                    )
                  }
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="inline size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="space-y-4 rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {editingId ? 'Editar endereco' : 'Novo endereco'}
        </h3>
        {editingId && <input type="hidden" name="id" value={editingId} />}

        <div className="space-y-1.5">
          <Label htmlFor="recipient_name">Destinatario *</Label>
          <Input
            id="recipient_name"
            name="recipient_name"
            value={f.recipient_name}
            onChange={(e) => setF({ ...f, recipient_name: e.target.value })}
            required
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="cep">CEP *</Label>
            <Input
              id="cep"
              name="cep"
              value={f.cep}
              onChange={(e) => setF({ ...f, cep: e.target.value })}
              onBlur={lookupCep}
              required
            />
          </div>
          <Button type="button" variant="outline" onClick={lookupCep}>
            Buscar
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div className="space-y-1.5">
            <Label htmlFor="street">Rua *</Label>
            <Input
              id="street"
              name="street"
              value={f.street}
              onChange={(e) => setF({ ...f, street: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="number">Numero *</Label>
            <Input
              id="number"
              name="number"
              value={f.number}
              onChange={(e) => setF({ ...f, number: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={f.neighborhood}
              onChange={(e) => setF({ ...f, neighborhood: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              name="complement"
              value={f.complement}
              onChange={(e) => setF({ ...f, complement: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
          <div className="space-y-1.5">
            <Label htmlFor="city">Cidade *</Label>
            <Input
              id="city"
              name="city"
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">UF *</Label>
            <Input
              id="state"
              name="state"
              maxLength={2}
              value={f.state}
              onChange={(e) =>
                setF({ ...f, state: e.target.value.toUpperCase() })
              }
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_default"
            checked={f.is_default}
            onChange={(e) => setF({ ...f, is_default: e.target.checked })}
            className="size-4"
          />
          Usar como endereco padrao
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : editingId ? 'Salvar' : 'Adicionar'}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null)
                setF(EMPTY)
              }}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
