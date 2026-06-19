# 06 — Integrações

Contratos, fluxos e código de referência para cada integração externa do MVP da Fase 1, e o que entra na Fase 2.

---

## 1. Mercado Pago — Checkout Transparente

### Por quê Mercado Pago e não PagBank

O cliente perguntou "PagBank ou Mercado Pago". Vamos com **Mercado Pago Checkout Transparente** porque (a) cobertura de meios maior (Pix, cartão 6x sem juros, Apple Pay, Google Pay nativos), (b) SDK Node oficial estável, (c) webhook com assinatura, (d) painel próprio que o cliente pode operar sozinho, (e) maturidade em Next.js. PagBank é alternativa válida — a arquitetura aqui está isolada em `/src/lib/payments/mercadopago.ts`, então trocar de gateway é refactor localizado.

### Credenciais

- **Painel:** mercadopago.com.br → Suas integrações → Credenciais
- **Teste:** `TEST-...` (public key + access token)
- **Produção:** `APP_USR-...` (gerar após ativar conta com CNPJ/MEI do cliente)

Variáveis em `.env.local`:

```
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
```

> **Pendente do Vinícius:** ele hoje usa PagBank com PF. Para Mercado Pago em produção precisa de **MEI/ME ativa**. Bloqueador comercial — comunicar antes do dev.

### Instalação

```bash
pnpm add mercadopago
```

### Wrapper `/src/lib/payments/mercadopago.ts`

```ts
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN não definido");
}

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 10_000, idempotencyKey: undefined },
});

export const payment = new Payment(mp);
export const preference = new Preference(mp);
```

### Fluxo de pagamento — cartão (Checkout Transparente)

1. Frontend coleta dados no formulário e usa o **MercadoPago.js v2** no browser para gerar `card_token` (PCI delegado).
2. POST para `/api/checkout/criar-pagamento` com `{ order_id, card_token, installments, payment_method_id, payer }`.
3. Servidor chama `payment.create({...})`.
4. Servidor grava em `payments` com `gateway_payment_id`, `status: in_process` (ou retorno imediato).
5. Webhook atualiza `payments.status` e propaga para `orders.status`.

```ts
// app/api/checkout/criar-pagamento/route.ts
import { NextRequest } from "next/server";
import { payment } from "@/lib/payments/mercadopago";
import { z } from "zod";

const Body = z.object({
  order_id: z.string().uuid(),
  card_token: z.string().optional(),     // se cartão
  installments: z.number().int().min(1).max(12).optional(),
  payment_method_id: z.string(),         // "pix", "visa", "master", etc.
  payer: z.object({
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    identification: z.object({ type: z.enum(["CPF", "CNPJ"]), number: z.string() }),
  }),
});

export async function POST(req: NextRequest) {
  const body = Body.parse(await req.json());
  // carregar order do supabase, validar valor, etc.
  // ...
  const result = await payment.create({
    body: {
      transaction_amount: amountInReais,
      description: `Pedido ${order.order_number}`,
      external_reference: order.id,
      payment_method_id: body.payment_method_id,
      token: body.card_token,
      installments: body.installments ?? 1,
      payer: body.payer,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "MINIVAT",
    },
    requestOptions: { idempotencyKey: order.id },
  });
  // gravar em public.payments
  return Response.json({
    payment_id: result.id,
    status: result.status,
    qr_code: result.point_of_interaction?.transaction_data?.qr_code ?? null,
    qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
  });
}
```

### Webhook `/api/webhooks/mercadopago`

```ts
// app/api/webhooks/mercadopago/route.ts
import crypto from "node:crypto";
import { payment } from "@/lib/payments/mercadopago";
import { createServiceClient } from "@/lib/supabase/service";

function verifySignature(req: Request, dataId: string, requestId: string) {
  const sig = req.headers.get("x-signature") ?? "";
  const parts = Object.fromEntries(sig.split(",").map(s => s.split("=")));
  const ts = parts.ts;
  const v1 = parts.v1;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET!)
    .update(manifest)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function POST(req: Request) {
  const body = await req.json();
  const dataId = body?.data?.id;
  const requestId = req.headers.get("x-request-id") ?? "";

  if (!dataId) return new Response("no data", { status: 400 });
  if (!verifySignature(req, dataId, requestId)) {
    return new Response("invalid signature", { status: 401 });
  }

  // só tratamos type=payment (não merchant_order)
  if (body.type !== "payment") return new Response("ignored", { status: 200 });

  // re-consultar pra evitar payload falsificado
  const p = await payment.get({ id: dataId });
  const supa = createServiceClient();

  await supa.from("payments").update({
    status: p.status as any,
    gateway_payload: p as any,
    approved_at: p.status === "approved" ? new Date().toISOString() : null,
  }).eq("gateway_payment_id", String(p.id));

  // propagar pro pedido
  if (p.status === "approved" && p.external_reference) {
    await supa.from("orders").update({
      status: "paid",
      paid_at: new Date().toISOString(),
    }).eq("id", p.external_reference).eq("status", "pending");
  }
  if (p.status === "rejected" || p.status === "cancelled") {
    // não cancelar o pedido aqui — cliente pode tentar de novo
  }

  return new Response("ok", { status: 200 });
}
```

### Gotchas

- Configurar a URL do webhook no painel do Mercado Pago **e** habilitar "Pagamentos".
- O `idempotencyKey` no `payment.create` evita cobrança dupla quando o cliente clica duas vezes.
- Pix: `point_of_interaction.transaction_data.qr_code_base64` é a imagem (PNG base64) pra renderizar.
- Cartão: `status_detail` traz o motivo da recusa. Mapear pros copy do storefront (`cc_rejected_insufficient_amount`, `cc_rejected_bad_filled_card_number`, etc.).
- O webhook não é estritamente sequencial — sempre re-consultar pelo `id` antes de gravar.

---

## 2. Melhor Envio

### Por quê

Cobre Correios (PAC, SEDEX, Mini Envios), Jadlog, Loggi, Latam Cargo, Azul Cargo, J&T. Sem mensalidade, comissão embutida. Painel próprio que o cliente já vai usar pra comprar etiqueta.

### Credenciais

- **Painel:** melhorenvio.com.br → Aplicativos → Tokens
- Gerar **token de produção** (long-lived). Pra dev usar **sandbox** (`sandbox.melhorenvio.com.br`).

```
MELHORENVIO_TOKEN=
MELHORENVIO_BASE_URL=https://www.melhorenvio.com.br
MELHORENVIO_FROM_CEP=
```

### Headers obrigatórios

```ts
{
  Authorization: `Bearer ${process.env.MELHORENVIO_TOKEN}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "MINI VAT PREMIUM (contato@minivatpremium.com.br)",
}
```

> Sem `User-Agent` válido o ME bloqueia em produção.

### Wrapper `/src/lib/shipping/melhorenvio.ts`

```ts
const BASE = process.env.MELHORENVIO_BASE_URL!;
const HEADERS = {
  Authorization: `Bearer ${process.env.MELHORENVIO_TOKEN}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "MINI VAT PREMIUM (contato@minivatpremium.com.br)",
};

export interface QuoteItem {
  width: number;   // cm
  height: number;
  length: number;
  weight: number;  // kg
  insurance_value: number;
  quantity: number;
}

export async function quote(toCep: string, items: QuoteItem[]) {
  const res = await fetch(`${BASE}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      from: { postal_code: process.env.MELHORENVIO_FROM_CEP },
      to: { postal_code: toCep.replace(/\D/g, "") },
      products: items,
      options: { receipt: false, own_hand: false, insurance_value: items.reduce((s, i) => s + i.insurance_value * i.quantity, 0) },
    }),
  });
  if (!res.ok) throw new Error(`Melhor Envio cotação falhou: ${res.status}`);
  return (await res.json()) as Array<{
    id: number;
    name: string;
    price: string;
    custom_price: string;
    delivery_time: number;
    company: { name: string };
    error?: string;
  }>;
}
```

### Fluxo de etiqueta (admin)

1. Admin abre o pedido pago → clica "Comprar etiqueta".
2. POST `/api/admin/orders/[id]/shipping-label` chama:
   - `POST /api/v2/me/cart` (adiciona ao carrinho do ME)
   - `POST /api/v2/me/shipment/checkout` (pago com saldo ME)
   - `POST /api/v2/me/shipment/generate` (gera etiqueta)
   - `POST /api/v2/me/shipment/print` (retorna URL do PDF)
3. Salvar `me_label_id`, `tracking_code`, `label_url` em `shipments`.
4. Atualizar `orders.status = 'shipped'`.

### Cotação no checkout (cliente)

`POST /api/checkout/cotar-frete` com `{ cep, items }`. Cache em `shipping_quotes_cache` por 5 min. Devolver lista ordenada por preço.

### Gotchas

- Em sandbox, "PAC" e "SEDEX" vêm com IDs diferentes de produção. Não fixar ID — usar `name` ou `company.name`.
- Quando o produto não tem dimensão cadastrada, ME retorna `error` no item — fallback: bloquear checkout e logar no Sentry com `productId`.
- Insurance value precisa ser > R$ 0 senão alguns serviços rejeitam.
- `from_cep` é o CEP de **origem do remetente** (galpão/casa do Vinícius), não da empresa.

---

## 3. Resend — e-mails transacionais

### Por quê

Modelo simples, React Email integrado, DNS fácil, free tier suficiente pra Fase 1 (3k e-mails/mês).

### Credenciais

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=pedidos@minivatpremium.com.br
RESEND_REPLY_TO=contato@minivatpremium.com.br
```

### DNS (Cloudflare)

- `TXT` SPF: `v=spf1 include:_spf.resend.com -all`
- `TXT` DKIM (Resend dá no painel)
- `MX` opcional se for receber e-mails (não é o caso, encaminhar pra Gmail do Vinícius)

### Instalação

```bash
pnpm add resend react-email @react-email/components
```

### Templates obrigatórios em `/src/emails/`

- `order-confirmation.tsx` — pedido criado (não pago)
- `payment-approved.tsx` — pagamento aprovado
- `pix-pending.tsx` — Pix gerado (com QR e prazo)
- `shipping-update.tsx` — código de rastreio
- `delivered.tsx` — entregue (pedindo review)
- `abandoned-cart.tsx` — Fase 2
- `password-reset.tsx`
- `magic-link.tsx`

### Wrapper

```ts
// src/lib/email/send.ts
import { Resend } from "resend";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(args: {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}) {
  return resend.emails.send({
    from: `MINI VAT PREMIUM <${process.env.RESEND_FROM_EMAIL}>`,
    to: args.to,
    subject: args.subject,
    react: args.react,
    replyTo: args.replyTo ?? process.env.RESEND_REPLY_TO,
  });
}
```

---

## 4. GTM + GA4 + Meta Pixel

### Estratégia

O cliente perguntou se ele mesmo pode instalar Pixel/Analytics sem mexer no código. **Sim.** Embarcamos o **Google Tag Manager** uma única vez no site; dentro do GTM ele instala GA4, Meta Pixel, Google Ads, conversões — tudo pelo painel do GTM. A gente entrega um `dataLayer` rico com os eventos padrão de e-commerce já populados.

### Variáveis

```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Componente

```tsx
// src/components/analytics/GTM.tsx
"use client";
import Script from "next/script";

export function GTM() {
  const id = process.env.NEXT_PUBLIC_GTM_ID;
  if (!id) return null;
  return (
    <>
      <Script id="gtm-base" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          functionality_storage: 'granted',
          security_storage: 'granted',
          wait_for_update: 500
        });
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');
      `}</Script>
      <noscript>
        <iframe src={`https://www.googletagmanager.com/ns.html?id=${id}`}
                height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
      </noscript>
    </>
  );
}
```

### Helper de eventos (GA4 Enhanced Ecommerce)

```ts
// src/lib/analytics/events.ts
declare global {
  interface Window { dataLayer: any[] }
}

export const track = (event: string, payload: Record<string, any> = {}) => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ecommerce: null });   // limpar contexto
  window.dataLayer.push({ event, ...payload });
};

export const trackViewItem = (item: GAItem) =>
  track("view_item", { ecommerce: { currency: "BRL", value: item.price, items: [item] } });

export const trackAddToCart = (item: GAItem) =>
  track("add_to_cart", { ecommerce: { currency: "BRL", value: item.price * item.quantity, items: [item] } });

export const trackBeginCheckout = (items: GAItem[], value: number) =>
  track("begin_checkout", { ecommerce: { currency: "BRL", value, items } });

export const trackPurchase = (orderId: string, items: GAItem[], value: number, shipping: number, tax = 0) =>
  track("purchase", {
    ecommerce: { transaction_id: orderId, currency: "BRL", value, shipping, tax, items }
  });

export interface GAItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}
```

### Consent Mode v2 (LGPD)

Banner em `/src/components/consent/CookieBanner.tsx` atualiza:

```ts
gtag("consent", "update", {
  ad_storage: choice.marketing ? "granted" : "denied",
  ad_user_data: choice.marketing ? "granted" : "denied",
  ad_personalization: choice.marketing ? "granted" : "denied",
  analytics_storage: choice.analytics ? "granted" : "denied",
});
```

### Eventos cobertos na Fase 1

`view_item_list`, `view_item`, `select_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `sign_up`, `login`, `search`, `view_promotion`, `select_promotion`.

### CAPI (Facebook Conversion API)

Fica para Fase 2 com `@meta/conversions-api` server-side disparado do webhook do MP.

---

## 5. ViaCEP — autocomplete de endereço

```ts
// src/lib/shipping/viacep.ts
export async function lookupCep(cep: string) {
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${c}/json/`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return {
    cep: c, street: data.logradouro, neighborhood: data.bairro,
    city: data.localidade, state: data.uf,
  };
}
```

---

## 6. Sentry — monitoramento de erros

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configuração: tracesSampleRate 0.1 em prod, 1.0 em dev. Capturar usuário logado (`Sentry.setUser`). Excluir dados sensíveis (cartão, senha, CPF, qr_code) via `beforeSend`.

```
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

---

## 7. Cloudflare

- DNS apontando `www.minivatpremium.com.br` (CNAME → `cname.vercel-dns.com`) e apex (A → IPs Vercel).
- **WAF managed rules** ativadas.
- **Rate limit** em `/api/checkout/*` (60 req/min/IP).
- **Bot Fight Mode**.
- **SSL/TLS:** Full (strict). Vercel já provisiona certificado.

---

## 8. Upstash Redis — rate limit aplicacional

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Middleware:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const rl = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

Aplicar em: criar pagamento, cotar frete, validar cupom, criar conta, login, recuperar senha, newsletter.

---

## 9. Fase 2 — integrações posteriores

### 9.1 Bling ERP
Sincronizar produtos ↔ Bling (estoque, NF-e, faturamento). API v3, OAuth2. Webhook de baixa de estoque.

### 9.2 WebmaniaBR — NF-e modelo 55
- Precisa de **certificado A1** PJ.
- Emite NF-e modelo 55 (e-commerce) ao mudar pedido pra `shipped`.
- Guardar XML, chave de acesso e protocolo SEFAZ em `tax_invoices`.

### 9.3 Evolution API + n8n (migrar Watidy)
- Workflow n8n: pedido pago → mensagem WhatsApp de confirmação.
- Rastreamento: mudança em `shipments` dispara mensagem.
- Carrinho abandonado: cron de 1h após `last_activity`.

### 9.4 Stripe — internacional
- Cartões, Apple Pay, Google Pay, PayPal, USD/EUR.
- Disparo via flag `international = true` no checkout.

### 9.5 Sync de marketplace
- Mercado Livre, Shopee, Amazon via Bling ou via SaaS (Olist, Tray).

### 9.6 Multi-idioma / multi-moeda
- `next-intl` com EN/PT.
- Tabela `products_i18n` e `multi_currency_prices`.

### 9.7 Afiliados / cupons rastreáveis
- Tabela `affiliates`, `affiliate_links`, `affiliate_commissions`.
- Cookie de atribuição 30 dias.

### 9.8 Reviews verificadas com fotos
- Upload via Supabase Storage; moderação no admin.

---

## 10. Tabela-resumo de integrações

| Serviço | Fase | Plano | Crítico? | Dono no cliente |
|---|---|---|---|---|
| Mercado Pago | 1 | Sem mensalidade, taxa por venda | Sim — bloqueador | Vinícius (precisa MEI) |
| Melhor Envio | 1 | Sem mensalidade, comissão embutida | Sim | Vinícius |
| Resend | 1 | Free 3k/mês → US$20/mês | Sim | Sevyn |
| GTM/GA4 | 1 | Free | Sim | Vinícius opera; Sevyn instala |
| Meta Pixel | 1 | Free | Recomendado | Vinícius |
| Sentry | 1 | Free 5k events → US$26/mês | Recomendado | Sevyn |
| Cloudflare | 1 | Free | Sim | Sevyn |
| Upstash | 1 | Free 10k req/dia | Sim | Sevyn |
| ViaCEP | 1 | Free, sem limite oficial | Sim | — |
| Vercel | 1 | Pro US$20/mês | Sim | Sevyn |
| Supabase | 1 | Pro US$25/mês | Sim | Sevyn |
| Bling | 2 | a partir de R$ 35/mês | Não | Vinícius |
| WebmaniaBR | 2 | a partir de R$ 49/mês + A1 | Sim para NF-e | Vinícius |
| Evolution API | 2 | self-hosted | Não | Sevyn |
| Stripe | 2 | Taxa por venda | Não na Fase 1 | Sevyn |
