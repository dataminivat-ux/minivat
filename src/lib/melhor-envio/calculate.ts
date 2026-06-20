import 'server-only'

export type ShippingQuote = {
  service_id: string
  name: string
  carrier: string
  price_cents: number
  delivery_days: number
}

export type ShippingProduct = {
  weight: number // kg
  width: number
  height: number
  length: number
  quantity: number
  insurance_value: number
}

export function isMelhorEnvioConfigured(): boolean {
  const token = process.env.MELHOR_ENVIO_TOKEN
  const from = process.env.MELHOR_ENVIO_FROM_CEP
  return Boolean(
    token &&
      !token.includes('...') &&
      !token.includes('xxx') &&
      from &&
      from !== '00000000'
  )
}

// Cotacao real no Melhor Envio.
export async function calculateShipping(input: {
  from: string
  to: string
  products: ShippingProduct[]
}): Promise<ShippingQuote[]> {
  const res = await fetch(
    `${process.env.MELHOR_ENVIO_BASE_URL}/api/v2/me/shipment/calculate`,
    {
      method: 'POST',
      headers: {
        Authorization: process.env.MELHOR_ENVIO_TOKEN!,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': process.env.MELHOR_ENVIO_USER_AGENT ?? 'MiniVatPremium',
      },
      body: JSON.stringify({
        from: { postal_code: input.from },
        to: { postal_code: input.to },
        products: input.products,
      }),
    }
  )
  if (!res.ok) throw new Error(`Melhor Envio ${res.status}`)
  const data: unknown[] = await res.json()

  return (data as Array<Record<string, unknown>>)
    .filter((o) => !o.error && o.price)
    .map((o) => ({
      service_id: String(o.id),
      name: String(o.name),
      carrier:
        (o.company as Record<string, unknown> | undefined)?.name?.toString() ??
        '',
      price_cents: Math.round(parseFloat(String(o.price)) * 100),
      delivery_days: Number(o.delivery_time ?? 0),
    }))
}

// Fallback enquanto o Melhor Envio nao esta configurado (Sprint 2 base).
export function mockShipping(): ShippingQuote[] {
  return [
    {
      service_id: 'mock-pac',
      name: 'PAC',
      carrier: 'Correios',
      price_cents: 1500,
      delivery_days: 7,
    },
    {
      service_id: 'mock-sedex',
      name: 'SEDEX',
      carrier: 'Correios',
      price_cents: 3000,
      delivery_days: 3,
    },
  ]
}
