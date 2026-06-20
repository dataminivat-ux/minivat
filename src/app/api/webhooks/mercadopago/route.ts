import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  getMpPayment,
  mapMpStatus,
  verifyMpSignature,
} from '@/lib/mercadopago/client'
import type { Database, Json } from '@/lib/supabase/types'

type MpPayment = {
  id: number | string
  status: string
  external_reference?: string
}

// Webhook do Mercado Pago: valida assinatura, idempotencia e atualiza
// pagamento + pedido. Inativo enquanto o webhook secret nao estiver definido.
export async function POST(req: Request) {
  const log = logger.child({ route: 'webhook-mp' })

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret || secret.includes('xxx')) {
    log.warn({}, 'webhook secret nao configurado')
    return new Response('Not configured', { status: 503 })
  }

  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const url = new URL(req.url)
  const dataId =
    url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? ''
  const type = url.searchParams.get('type') ?? url.searchParams.get('topic')

  // 1. Assinatura obrigatoria.
  if (!verifyMpSignature({ xSignature, xRequestId, dataId, secret })) {
    return new Response('Invalid signature', { status: 401 })
  }

  // 2. So pagamentos.
  if (type !== 'payment') return new Response('OK', { status: 200 })

  const supabase = createAdminClient()

  // 3. Idempotencia (UNIQUE provider+event_id).
  const eventId = xRequestId || dataId
  const { error: idemErr } = await supabase
    .from('webhook_events')
    .insert({ provider: 'mercadopago', event_id: eventId })
  if (idemErr) {
    if (idemErr.code === '23505') return new Response('OK', { status: 200 })
    log.error({ err: idemErr.message }, 'falha idempotencia')
  }

  // 4. Busca o pagamento atualizado no MP.
  const payment = (await getMpPayment(dataId)) as MpPayment
  const approved = payment.status === 'approved'

  // 5. Atualiza payment + order.
  await supabase
    .from('payments')
    .update({
      status: mapMpStatus(
        payment.status
      ) as Database['public']['Enums']['payment_status'],
      gateway_payload: payment as unknown as Json,
      approved_at: approved ? new Date().toISOString() : null,
    })
    .eq('gateway_payment_id', String(payment.id))

  if (payment.external_reference) {
    if (approved) {
      await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', payment.external_reference)
      // TODO(chaves): enviar e-mail (Resend) + incrementar uso de cupom
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await supabase
        .from('orders')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', payment.external_reference)
    }
  }

  return new Response('OK', { status: 200 })
}
