import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import {
  calculateShipping,
  isMelhorEnvioConfigured,
  mockShipping,
} from '@/lib/melhor-envio/calculate'

const schema = z.object({
  cep: z.string().min(8),
  items: z
    .array(
      z.object({
        variant_id: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
})

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }
  const to = parsed.data.cep.replace(/\D/g, '')

  // Sem token do Melhor Envio -> cotacao mock (Sprint 2 base).
  if (!isMelhorEnvioConfigured()) {
    return NextResponse.json({ quotes: mockShipping(), mock: true })
  }

  // Carrega dimensoes (variant_id pode ser o product_id em produtos sem variacao).
  const supabase = await createClient()
  const ids = parsed.data.items.map((i) => i.variant_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, weight_g, width_cm, height_cm, length_cm, price_cents')
    .in('id', ids)

  const map = new Map((products ?? []).map((p) => [p.id, p]))
  const payload = parsed.data.items.map((i) => {
    const p = map.get(i.variant_id)
    return {
      weight: (p?.weight_g ?? 300) / 1000,
      width: Math.max(p?.width_cm ?? 11, 11),
      height: Math.max(p?.height_cm ?? 2, 2),
      length: Math.max(p?.length_cm ?? 16, 16),
      quantity: i.quantity,
      insurance_value: (p?.price_cents ?? 0) / 100,
    }
  })

  try {
    const quotes = await calculateShipping({
      from: process.env.MELHOR_ENVIO_FROM_CEP!,
      to,
      products: payload,
    })
    return NextResponse.json({ quotes })
  } catch {
    return NextResponse.json({ quotes: mockShipping(), mock: true, fallback: true })
  }
}
