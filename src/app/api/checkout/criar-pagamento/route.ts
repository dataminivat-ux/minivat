import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkoutSchema } from '@/lib/validators/checkout'
import { logger } from '@/lib/logger'
import {
  createMpPayment,
  isMercadoPagoConfigured,
  mapMpStatus,
} from '@/lib/mercadopago/client'
import type { Database, Json } from '@/lib/supabase/types'

type MpPayment = {
  id: number | string
  status: string
  external_reference?: string
  date_of_expiration?: string
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string }
  }
  card?: { last_four_digits?: string }
}

type CouponResult = {
  ok?: boolean
  discount_cents?: number
  coupon_id?: string
}

// O coracao do checkout: recalcula TUDO no servidor (preco, estoque, frete,
// cupom), cria o pedido em transacao atomica e (se configurado) o pagamento MP.
export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  const log = logger.child({ requestId, route: 'criar-pagamento' })

  try {
    const parsed = checkoutSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const input = parsed.data
    const supabase = createAdminClient()

    // 1. Recarrega produtos do banco (nunca confiar no client).
    const ids = input.items.map((i) => i.product_id)
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id, sku, name, slug, price_cents, stock, weight_g')
      .in('id', ids)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (pErr || !products || products.length === 0) {
      log.error({ err: pErr?.message }, 'falha ao carregar produtos')
      return NextResponse.json({ error: 'PRODUCTS_NOT_FOUND' }, { status: 400 })
    }
    const pmap = new Map(products.map((p) => [p.id, p]))

    // 2. Valida estoque + 3. recalcula subtotal.
    let subtotal = 0
    for (const item of input.items) {
      const p = pmap.get(item.product_id)
      if (!p) {
        return NextResponse.json(
          { error: 'PRODUCT_NOT_FOUND', id: item.product_id },
          { status: 400 }
        )
      }
      if (p.stock < item.quantity) {
        return NextResponse.json(
          { error: 'INSUFFICIENT_STOCK', id: p.id },
          { status: 400 }
        )
      }
      subtotal += p.price_cents * item.quantity
    }

    // 4. Frete: o servidor confia no valor cotado (base). Com Melhor Envio
    //    real, recalcular aqui antes de fechar o total.
    const shippingCents = input.shipping.price_cents

    // 5. Cupom (funcao do banco).
    let discountCents = 0
    let couponId: string | null = null
    if (input.coupon_code) {
      const { data } = await supabase.rpc('validate_coupon', {
        p_code: input.coupon_code,
        p_subtotal_cents: subtotal,
        p_user_id: null,
      })
      const coupon = data as CouponResult | null
      if (coupon?.ok) {
        discountCents = coupon.discount_cents ?? 0
        couponId = coupon.coupon_id ?? null
      } else {
        return NextResponse.json({ error: 'INVALID_COUPON' }, { status: 400 })
      }
    }

    const totalCents = subtotal - discountCents + shippingCents

    // 6. Cria pedido + itens + decrementa estoque (RPC atomica).
    const orderItems = input.items.map((item) => {
      const p = pmap.get(item.product_id)!
      const isVariant = item.variant_id !== item.product_id
      return {
        product_id: p.id,
        variant_id: isVariant ? item.variant_id : null,
        product_name: p.name,
        product_sku: p.sku,
        variant_name: null,
        product_image_url: null,
        quantity: item.quantity,
        unit_price_cents: p.price_cents,
      }
    })

    const orderHeader = {
      user_id: null,
      customer_email: input.email,
      customer_name: input.customer_name,
      customer_cpf: input.customer_document ?? null,
      customer_phone: input.customer_phone ?? null,
      subtotal_cents: subtotal,
      discount_cents: discountCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      shipping_method: input.shipping.method ?? null,
      shipping_carrier: input.shipping.carrier ?? null,
      shipping_service_id: input.shipping.service_id ?? null,
      shipping_estimated_days: input.shipping.estimated_days ?? null,
      shipping_address: input.shipping_address,
      billing_address: null,
      coupon_code: input.coupon_code ?? null,
      coupon_id: couponId,
    }

    const { data: order, error: orderErr } = await supabase.rpc(
      'create_order_with_items',
      { p_order: orderHeader, p_items: orderItems }
    )

    if (orderErr || !order) {
      const msg = orderErr?.message ?? ''
      log.error({ err: msg }, 'falha ao criar pedido')
      if (msg.includes('INSUFFICIENT_STOCK')) {
        return NextResponse.json({ error: 'INSUFFICIENT_STOCK' }, { status: 400 })
      }
      return NextResponse.json({ error: 'ORDER_FAILED' }, { status: 500 })
    }

    // 7. Pagamento Mercado Pago (so quando configurado).
    if (!isMercadoPagoConfigured()) {
      log.info(
        { orderId: order.id },
        'pedido criado (MP nao configurado — pendente)'
      )
      return NextResponse.json({
        order_id: order.id,
        order_number: order.order_number,
        payment_pending: true,
        message:
          'Pedido criado. O pagamento sera ativado quando as chaves do Mercado Pago forem configuradas.',
      })
    }

    const [firstName, ...rest] = input.customer_name.split(' ')
    const payerIdentification = input.customer_document
      ? {
          identification: {
            type: input.customer_document.length > 11 ? 'CNPJ' : 'CPF',
            number: input.customer_document,
          },
        }
      : {}

    const mpBase = {
      transaction_amount: totalCents / 100,
      description: `Pedido ${order.order_number}`,
      notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
      external_reference: order.id,
      payer: {
        email: input.email,
        first_name: firstName,
        last_name: rest.join(' '),
        ...payerIdentification,
      },
    }

    const mpBody =
      input.payment_method === 'pix'
        ? { ...mpBase, payment_method_id: 'pix' }
        : {
            ...mpBase,
            token: input.card_token,
            installments: input.installments ?? 1,
          }

    const payment = (await createMpPayment(mpBody, order.id)) as MpPayment
    const poi = payment.point_of_interaction?.transaction_data

    await supabase.from('payments').insert({
      order_id: order.id,
      gateway: 'mercadopago',
      gateway_payment_id: String(payment.id),
      method: input.payment_method === 'credit_card' ? 'credit_card' : 'pix',
      status: mapMpStatus(
        payment.status
      ) as Database['public']['Enums']['payment_status'],
      amount_cents: totalCents,
      installments: input.installments ?? 1,
      gateway_payload: payment as unknown as Json,
      qr_code: poi?.qr_code ?? null,
      qr_code_base64: poi?.qr_code_base64 ?? null,
      pix_expires_at: payment.date_of_expiration ?? null,
      card_last_four: payment.card?.last_four_digits ?? null,
    })

    log.info({ orderId: order.id, paymentId: payment.id }, 'pagamento criado')

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      payment_id: payment.id,
      status: payment.status,
      pix: poi ?? null,
    })
  } catch (err) {
    log.error({ err: String(err) }, 'erro inesperado')
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
