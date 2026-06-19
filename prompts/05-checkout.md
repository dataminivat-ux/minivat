# Prompt 05 — Checkout, pagamento e frete (Sprint 2)

> **Este é o sprint mais crítico do projeto.** Cole no Claude Code após Sprint 1. Tempo: 5-7 dias.
> Erros aqui = pedidos duplicados, estoque negativo, cobrança errada, vazamento de cartão. **Não improvise.**

---

## Sua missão

Fechar o ciclo de venda: login → checkout 3 etapas → pagamento real → webhook → email → sucesso.

**Leia ANTES, na íntegra:**
- `CLAUDE.md` seções 4 (segurança) e 5 (fluxo de checkout) — **muito importante**
- `docs/INTEGRATIONS.md` seções 1 (Mercado Pago), 2 (Melhor Envio), 3 (Resend)
- `docs/SECURITY.md` seções 2, 4 (pagamentos)
- `docs/DATABASE.md` (entender orders, payments, shipments)
- `docs/SPRINTS.md` (Sprint 2 DoD)

---

## Regras de ouro (ler 2 vezes)

1. **NUNCA confie no preço, frete, cupom ou estoque enviados pelo cliente.** Tudo é recalculado no servidor.
2. **Tokenização de cartão é client-side.** Servidor nunca vê PAN.
3. **Webhook é idempotente.** UNIQUE em `mercadopago_notification_id`. Retorna 200 mesmo se já processado.
4. **Validação de assinatura do webhook é OBRIGATÓRIA.** Sem isso, qualquer um marca pedido como pago.
5. **Decremento de estoque** acontece em transação atômica com criação do pedido. Use `select ... for update` ou comparação otimista.
6. **Logs estruturados** em TODAS as etapas do checkout. Sem isso, debug fica impossível.

---

## Ordem de execução

### 1. Auth do cliente final

#### Páginas
- `/entrar` (login email+senha + magic link + Google opcional)
- `/cadastrar` (form com nome, email, senha, CPF/CNPJ opcional, opt-in marketing)
- `/recuperar-senha`
- `/conta` (dashboard básico — completa no Sprint 4)

#### Server Actions
- `signIn(email, password)`
- `signUp(formData)` — cria profile no banco também
- `signOut()`
- `sendMagicLink(email)`

#### Confirmação por email
Supabase Auth já manda email de confirmação. Customize template no Dashboard Supabase → Auth → Email Templates.

### 2. Endpoints utilitários

#### `GET /api/cep/[cep]/route.ts`
Proxy ViaCEP com cache + rate limit (60 req/min/IP via Upstash).

#### `POST /api/frete/calcular/route.ts`

```ts
// Body: { cep: string, items: [{ variant_id: string, quantity: number }] }
// 1. Valida Zod
// 2. Gera cache_key = hash(from_cep + to_cep + items_signature)
// 3. Busca em shipping_quotes_cache; se hit válido, retorna
// 4. Se miss: busca variants no banco (peso, dimensões)
// 5. Chama Melhor Envio API
// 6. Salva no cache com TTL 1h
// 7. Retorna array de cotações
```

Wrapper Melhor Envio em `src/lib/melhor-envio/calculate.ts`:

```ts
export async function calculateShipping(input: {
  from: string
  to: string
  products: Array<{ weight: number; width: number; height: number; length: number; quantity: number; insurance_value: number }>
}) {
  const res = await fetch(`${process.env.MELHOR_ENVIO_BASE_URL}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Authorization: process.env.MELHOR_ENVIO_TOKEN!,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': process.env.MELHOR_ENVIO_USER_AGENT!,
    },
    body: JSON.stringify({ from: { postal_code: input.from }, to: { postal_code: input.to }, products: input.products }),
  })
  if (!res.ok) throw new Error(`ME error ${res.status}`)
  return res.json()
}
```

#### `POST /api/cupom/validar/route.ts`
Chama a função `validate_coupon` no Supabase. Body: `{ code, subtotal_cents }`.

### 3. Checkout — UI em 3 etapas

`src/app/(storefront)/checkout/page.tsx` com state machine (Zustand `useCheckoutStore` ou XState):

#### Etapa 1: Identificação
- Se logado: skip
- Se não: input email → se já tem conta, pede senha; se não, oferece cadastro rápido ou continuar como guest

#### Etapa 2: Entrega
- Form completo de endereço
- Input CEP com autocompletar via ViaCEP
- Após CEP válido: chamar `/api/frete/calcular`
- Mostra lista de opções de frete (PAC, SEDEX, etc.) com preço e prazo
- Cliente seleciona uma opção (salvar no state)

#### Etapa 3: Pagamento
- Input de cupom (opcional)
- Resumo do pedido: subtotal, desconto, frete, total
- Tabs: Pix | Cartão | Apple/Google Pay
- **Pix:** botão "Gerar Pix" → cria pedido → mostra QR + copia/cola + countdown
- **Cartão:** `<CardPayment />` do SDK Mercado Pago React (tokeniza no cliente)
- **Apple/Google Pay:** componente do SDK

### 4. Endpoint de criar pagamento — o coração

`POST /api/checkout/criar-pagamento/route.ts`:

```ts
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { mp } from '@/lib/mercadopago/client'
import { checkoutSchema } from '@/lib/validators/checkout'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()
  const log = logger.child({ requestId, route: 'criar-pagamento' })

  try {
    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'INVALID_INPUT', details: parsed.error.flatten() }, { status: 400 })
    }
    const input = parsed.data

    const supabase = createAdminClient()

    // 1. RECARREGAR variantes do banco (não confiar no client)
    const variantIds = input.items.map(i => i.variant_id)
    const { data: variants, error: vErr } = await supabase
      .from('product_variants')
      .select('id, product_id, sku, name, price_cents, stock_quantity, weight_g, length_cm, width_cm, height_cm, is_active, products!inner(name, slug, default_weight_g)')
      .in('id', variantIds)
      .eq('is_active', true)
    if (vErr || !variants?.length) {
      log.error({ err: vErr }, 'failed to load variants')
      return Response.json({ error: 'VARIANTS_NOT_FOUND' }, { status: 400 })
    }

    // 2. VALIDAR estoque
    for (const item of input.items) {
      const variant = variants.find(v => v.id === item.variant_id)
      if (!variant) return Response.json({ error: 'VARIANT_NOT_FOUND' }, { status: 400 })
      if (variant.stock_quantity < item.quantity) {
        return Response.json({ error: 'INSUFFICIENT_STOCK', variant_id: variant.id }, { status: 400 })
      }
    }

    // 3. RECALCULAR subtotal
    const subtotalCents = input.items.reduce((acc, item) => {
      const v = variants.find(v => v.id === item.variant_id)!
      return acc + v.price_cents * item.quantity
    }, 0)

    // 4. RECALCULAR frete (refazer a cotação OU validar o quote_id salvo)
    // Recomendado: refazer cotação no servidor com mesmos parâmetros e usar o resultado
    const shippingCents = await recalculateShipping(input, variants)

    // 5. VALIDAR cupom (function do Supabase)
    let discountCents = 0
    let couponId: string | null = null
    if (input.coupon_code) {
      const { data: coupon } = await supabase.rpc('validate_coupon', {
        p_code: input.coupon_code,
        p_subtotal_cents: subtotalCents,
      })
      if (coupon?.[0]?.is_valid) {
        discountCents = coupon[0].discount_cents
        couponId = coupon[0].coupon_id
      } else {
        return Response.json({ error: 'INVALID_COUPON', message: coupon?.[0]?.message }, { status: 400 })
      }
    }

    const totalCents = subtotalCents - discountCents + shippingCents

    // 6. CRIAR pedido em transação + decrementar estoque
    const { data: order, error: orderErr } = await supabase.rpc('create_order_with_items', {
      // (criar essa SQL function — ou usar transaction manual)
      // pseudocódigo:
      // begin;
      //   insert into orders (...) returning *;
      //   insert into order_items (...);
      //   update product_variants set stock_quantity = stock_quantity - X where id = Y and stock_quantity >= X;
      // commit;
    })

    if (orderErr) {
      log.error({ err: orderErr }, 'order creation failed')
      return Response.json({ error: 'ORDER_FAILED' }, { status: 500 })
    }

    // 7. CRIAR pagamento no Mercado Pago
    let payment
    if (input.payment_method === 'pix') {
      payment = await mp.payment.create({
        body: {
          transaction_amount: totalCents / 100,
          description: `Pedido ${order.order_number}`,
          payment_method_id: 'pix',
          payer: {
            email: input.email,
            first_name: input.customer_name.split(' ')[0],
            last_name: input.customer_name.split(' ').slice(1).join(' '),
            identification: { type: input.customer_document.length === 11 ? 'CPF' : 'CNPJ', number: input.customer_document },
          },
          notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
          external_reference: order.id,
        },
      })
    } else if (input.payment_method === 'credit_card') {
      payment = await mp.payment.create({
        body: {
          transaction_amount: totalCents / 100,
          token: input.card_token, // vem tokenizado do client
          description: `Pedido ${order.order_number}`,
          installments: input.installments ?? 1,
          payment_method_id: input.card_brand, // visa, master, etc.
          issuer_id: input.issuer_id,
          payer: { email: input.email, identification: { type: 'CPF', number: input.customer_document } },
          notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
          external_reference: order.id,
        },
      })
    }

    // 8. Salvar payment no banco
    await supabase.from('payments').insert({
      order_id: order.id,
      mercadopago_payment_id: String(payment.id),
      method: input.payment_method,
      status: mapMPStatus(payment.status),
      amount_cents: totalCents,
      installments: input.installments ?? 1,
      pix_qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code,
      pix_expires_at: payment.date_of_expiration,
      card_last_four: payment.card?.last_four_digits,
      card_brand: payment.card?.first_six_digits, // (na verdade brand vem em outro campo)
      raw_response: payment,
    })

    log.info({ orderId: order.id, paymentId: payment.id }, 'payment created')

    return Response.json({
      order_id: order.id,
      order_number: order.order_number,
      payment_id: payment.id,
      status: payment.status,
      pix: payment.point_of_interaction?.transaction_data,
    })
  } catch (err) {
    log.error({ err }, 'unexpected error')
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
```

### 5. Webhook do Mercado Pago

`POST /api/webhooks/mercadopago/route.ts`:

```ts
export async function POST(req: Request) {
  const signature = req.headers.get('x-signature') || ''
  const requestId = req.headers.get('x-request-id') || ''
  const url = new URL(req.url)
  const dataId = url.searchParams.get('data.id') || ''
  const type = url.searchParams.get('type')

  // 1. Validar assinatura
  if (!verifyWebhookSignature(signature, requestId, dataId, process.env.MERCADOPAGO_WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // 2. Só processar pagamentos
  if (type !== 'payment') return new Response('OK', { status: 200 })

  // 3. Idempotência
  const supabase = createAdminClient()
  const notificationId = requestId
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('mercadopago_notification_id', notificationId)
    .maybeSingle()
  if (existing) return new Response('OK', { status: 200 })

  // 4. Buscar pagamento atualizado no MP
  const payment = await mp.payment.get({ id: dataId })

  // 5. Atualizar payment + order
  await supabase
    .from('payments')
    .update({
      status: mapMPStatus(payment.status),
      mercadopago_notification_id: notificationId,
      raw_response: payment,
      paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
    })
    .eq('mercadopago_payment_id', String(payment.id))

  // Se aprovado, mudar status do pedido
  if (payment.status === 'approved') {
    await supabase
      .from('orders')
      .update({ status: 'pagamento_aprovado', paid_at: new Date().toISOString() })
      .eq('id', payment.external_reference!)

    // Dispara email
    await sendOrderApprovedEmail(payment.external_reference!)
  } else if (payment.status === 'rejected') {
    await supabase
      .from('orders')
      .update({ status: 'falha_pagamento' })
      .eq('id', payment.external_reference!)
  }

  return new Response('OK', { status: 200 })
}
```

### 6. Polling de Pix no frontend

`/checkout/pagamento/pix/page.tsx`:
- Mostra QR + copia/cola
- Hook `usePixStatus` que faz polling em `/api/orders/[id]/status` a cada 5s, máx 5min
- Quando vê `pagamento_aprovado`, redireciona para `/checkout/sucesso/[order_number]`

### 7. Emails (Resend + React Email)

Templates em `src/lib/email/templates/`:
- `OrderConfirmation.tsx` (quando criado, antes do pagamento)
- `PaymentApproved.tsx` (quando webhook confirma)
- `OrderShipped.tsx` (quando admin adiciona tracking)
- `OrderDelivered.tsx` (Fase 2)
- `Welcome.tsx` (no signup)

Helper `src/lib/email/send.ts`:

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail<T>(opts: {
  to: string
  subject: string
  template: ReactElement
}) {
  return resend.emails.send({
    from: process.env.RESEND_FROM!,
    to: opts.to,
    subject: opts.subject,
    react: opts.template,
  })
}
```

### 8. Página de sucesso

`/checkout/sucesso/[order_number]/page.tsx`:
- Server Component
- Busca pedido pelo `order_number`
- Mostra resumo, próximos passos, link pra `/conta/pedidos/[id]`
- Dispara evento GA4 `purchase` (client component que recebe order como prop)

### 9. Rate limiting

Adicione `apiRateLimit` em `/api/cep`, `/api/frete`, `/api/cupom`, e `checkoutRateLimit` em `/api/checkout/criar-pagamento`.

---

## Definition of Done

- [ ] Pedido teste **R$ 1 em sandbox** (cartão + Pix) finalizado completo
- [ ] Email de confirmação chega no inbox
- [ ] Webhook atualiza status corretamente
- [ ] Estoque decrementa
- [ ] Pedido aparece no painel admin (admin pode estar minimal nesse sprint)
- [ ] Idempotência testada (mandar 2x mesmo webhook não duplica)
- [ ] Logs estruturados em todas as etapas
- [ ] Validação de assinatura do webhook bloqueia payload adulterado
- [ ] CSP não bloqueia SDK MP
- [ ] Pedido teste **R$ 1 em PRODUÇÃO** (cartão real, depois estornar)

## Pegadinhas

- **`external_reference`:** sempre usar `order.id` (UUID). Sem isso o webhook não sabe qual pedido atualizar.
- **`notification_url`:** precisa ser HTTPS público. Em dev, use `ngrok` ou Vercel preview deploy.
- **`raw_response`:** sempre salvar pra ter debug se algo der errado.
- **Decremento de estoque:** use `update product_variants set stock_quantity = stock_quantity - $1 where id = $2 and stock_quantity >= $1`. Se affected rows = 0 = sem estoque, aborta tudo.
- **Pix timeout:** se cliente não pagar em 30min, libera estoque (job cron Vercel cron de 5 em 5min).
- **Cupom:** incrementa `current_uses` na confirmação do pagamento, não na criação do pedido (senão cupom esgota com pedido pendente).

## Se travar

PARE. Esse fluxo afeta dinheiro real. Pergunte ao Diego.
