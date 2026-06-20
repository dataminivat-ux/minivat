'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useCartStore } from '@/stores/cart-store'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Quote = {
  service_id: string
  name: string
  carrier: string
  price_cents: number
  delivery_days: number
}

type Address = {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.getSubtotalCents())
  const clear = useCartStore((s) => s.clear)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [step, setStep] = useState(1)

  // etapa 1
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')

  // etapa 2
  const [address, setAddress] = useState<Address>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  // etapa 3
  const [couponCode, setCouponCode] = useState('')
  const [discountCents, setDiscountCents] = useState(0)
  const [method, setMethod] = useState<'pix' | 'credit_card'>('pix')
  const [submitting, setSubmitting] = useState(false)

  const shippingCents = selectedQuote?.price_cents ?? 0
  const totalCents = subtotal - discountCents + shippingCents

  const apiItems = useMemo(
    () =>
      items.map((i) => ({
        variant_id: i.variant_id,
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    [items]
  )

  if (!mounted) return <div className="min-h-[50vh]" />

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold">Checkout</h1>
        <p className="mt-2 text-muted-foreground">Seu carrinho esta vazio.</p>
        <Link href="/produtos" className={cn(buttonVariants(), 'mt-6')}>
          Ver produtos
        </Link>
      </div>
    )
  }

  async function lookupCep() {
    const digits = address.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`/api/cep/${digits}`)
      if (res.ok) {
        const d = await res.json()
        setAddress((a) => ({
          ...a,
          street: d.street || a.street,
          neighborhood: d.neighborhood || a.neighborhood,
          city: d.city || a.city,
          state: d.state || a.state,
        }))
      }
      const freteRes = await fetch('/api/frete/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: digits, items: apiItems }),
      })
      if (freteRes.ok) {
        const fd = await freteRes.json()
        setQuotes(fd.quotes ?? [])
        setSelectedQuote(fd.quotes?.[0] ?? null)
      }
    } catch {
      toast.error('Falha ao consultar CEP/frete.')
    } finally {
      setCepLoading(false)
    }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return
    const res = await fetch('/api/cupom/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.trim(), subtotal_cents: subtotal }),
    })
    const data = await res.json()
    if (data?.ok) {
      setDiscountCents(data.discount_cents ?? 0)
      toast.success('Cupom aplicado.')
    } else {
      setDiscountCents(0)
      toast.error('Cupom invalido.')
    }
  }

  async function finalize() {
    if (!selectedQuote) {
      toast.error('Selecione uma opcao de frete.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout/criar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          customer_name: name,
          customer_document: cpf.replace(/\D/g, '') || undefined,
          customer_phone: phone || undefined,
          shipping_address: address,
          items: apiItems,
          shipping: {
            service_id: selectedQuote.service_id,
            method: selectedQuote.name,
            carrier: selectedQuote.carrier,
            price_cents: selectedQuote.price_cents,
            estimated_days: selectedQuote.delivery_days,
          },
          coupon_code: couponCode.trim() || undefined,
          payment_method: method,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Falha ao finalizar.')
        return
      }
      clear()
      if (data.payment_pending) {
        toast.info('Pedido criado. Pagamento sera ativado com as chaves do gateway.')
      }
      router.push(`/checkout/sucesso/${data.order_number}`)
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  const canStep1 = email.trim() && name.trim()
  const canStep2 = selectedQuote && address.street && address.number && address.city

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Checkout</h1>

      {/* stepper */}
      <div className="mt-4 flex gap-2 text-sm">
        {['Identificacao', 'Entrega', 'Pagamento'].map((label, i) => (
          <span
            key={label}
            className={cn(
              'rounded-full px-3 py-1',
              step === i + 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {step === 1 && (
          <div className="space-y-4 rounded-xl border p-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF/CNPJ</Label>
                <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <Button disabled={!canStep1} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-xl border p-5">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={address.cep}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, cep: e.target.value }))
                  }
                  onBlur={lookupCep}
                />
              </div>
              <Button variant="outline" onClick={lookupCep} disabled={cepLoading}>
                {cepLoading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1.5">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  value={address.street}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, street: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number">Numero *</Label>
                <Input
                  id="number"
                  value={address.number}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, number: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={address.neighborhood}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, neighborhood: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={address.complement}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, complement: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  maxLength={2}
                  value={address.state}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, state: e.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            {quotes.length > 0 && (
              <div className="space-y-2">
                <Label>Frete</Label>
                {quotes.map((q) => (
                  <label
                    key={q.service_id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm',
                      selectedQuote?.service_id === q.service_id &&
                        'border-primary bg-primary/5'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="frete"
                        checked={selectedQuote?.service_id === q.service_id}
                        onChange={() => setSelectedQuote(q)}
                      />
                      {q.carrier} {q.name} — {q.delivery_days} dias
                    </span>
                    <span className="font-medium">{formatBRL(q.price_cents)}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button disabled={!canStep2} onClick={() => setStep(3)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-xl border p-5">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="coupon">Cupom</Label>
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>
              <Button variant="outline" onClick={applyCoupon}>
                Aplicar
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>Forma de pagamento</Label>
              <div className="flex gap-2">
                {(['pix', 'credit_card'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      'rounded-md border px-4 py-2 text-sm',
                      method === m
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    {m === 'pix' ? 'Pix' : 'Cartao'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                O processamento real do pagamento sera ativado com as chaves do
                Mercado Pago.
              </p>
            </div>

            <div className="space-y-1 rounded-md bg-muted/40 p-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Desconto</span>
                  <span>- {formatBRL(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frete</span>
                <span>{formatBRL(shippingCents)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatBRL(totalCents)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                size="lg"
                disabled={submitting}
                onClick={finalize}
              >
                {submitting ? 'Processando...' : 'Finalizar compra'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
