import 'server-only'
import crypto from 'crypto'

// Wrapper REST do Mercado Pago (sem SDK). Ativa-se quando o access token
// real estiver no .env.local; ate la, isMercadoPagoConfigured() retorna false.
const MP_BASE = 'https://api.mercadopago.com'

export function isMercadoPagoConfigured(): boolean {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN
  return Boolean(t && !t.includes('xxxx'))
}

export async function createMpPayment(
  body: Record<string, unknown>,
  idempotencyKey: string
) {
  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`MP create ${res.status}: ${JSON.stringify(json)}`)
  }
  return json
}

export async function getMpPayment(id: string) {
  const res = await fetch(`${MP_BASE}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`MP get ${res.status}`)
  return json
}

// MP status -> enum payment_status (ver docs/05).
export function mapMpStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    in_process: 'in_process',
    approved: 'approved',
    authorized: 'authorized',
    in_mediation: 'in_mediation',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'charged_back',
  }
  return map[status] ?? 'pending'
}

// Verifica a assinatura x-signature do webhook (HMAC-SHA256).
// Formato do header: "ts=<timestamp>,v1=<hash>".
export function verifyMpSignature(opts: {
  xSignature: string
  xRequestId: string
  dataId: string
  secret: string
}): boolean {
  const parts: Record<string, string> = {}
  for (const seg of opts.xSignature.split(',')) {
    const [k, v] = seg.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:${opts.dataId};request-id:${opts.xRequestId};ts:${ts};`
  const hmac = crypto
    .createHmac('sha256', opts.secret)
    .update(manifest)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1))
  } catch {
    return false
  }
}
