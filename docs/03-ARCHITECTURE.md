# 03 — Architecture

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                              │
│             (DNS, CDN, WAF, Rate Limit, Bot Mgmt)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │       VERCEL        │
                  │   (Next.js 15 App)  │
                  │  Storefront         │
                  │  Admin Panel        │
                  │  API Routes         │
                  │  Edge Middleware    │
                  └──────────┬──────────┘
                             │
            ┌────────────────┼────────────────┬────────────┐
            │                │                │            │
       ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐   ┌───▼───┐
       │SUPABASE │    │  MERCADO    │   │ MELHOR  │   │RESEND │
       │ Postgres│    │   PAGO      │   │  ENVIO  │   │E-mail │
       │ Auth    │    │  PagBank    │   │ Correios│   └───────┘
       │ Storage │    │ (gateway)   │   │ Jadlog  │
       │ Realtime│    └─────────────┘   │ Loggi   │
       └─────────┘                      └─────────┘
            │                                            ┌───────┐
            └─────────► Sentry ◄──────────────────────  │WATIDY │
                                                         │WhatsApp│
                                                         └───────┘
```

## Princípios arquiteturais

### Rendering
| Rota | Estratégia |
|------|-----------|
| Home | Static + revalidate on-demand |
| Categoria | ISR 5min + tag |
| Produto | ISR 1min + tag |
| Busca | SSR dinâmico |
| Carrinho/Checkout/Conta | Dynamic autenticado |
| Admin | Dynamic, no-cache |

### Data fetching
- **Reads (SC):** Drizzle direto no Server Component
- **Reads (CC):** TanStack Query → Server Action → Drizzle
- **Writes:** sempre Server Action com Zod
- **Realtime:** Supabase Realtime opcional para estoque ao vivo no admin

### Auth boundaries
- **Visitante:** cookie `session_id` (UUID)
- **Cliente:** Supabase Auth (JWT) em cookie httpOnly
- **Admin:** Supabase Auth + check `admin_users.is_active` no middleware
- **Service role:** apenas server-side em Server Actions/Routes; nunca no cliente

### Segurança em camadas
- **Edge:** Cloudflare WAF + rate limit por IP
- **App:** Next middleware (auth gate + CSRF para mutações sensíveis)
- **DB:** RLS habilitado, policies explícitas por tabela
- **Secrets:** Vercel Env (encrypted at rest)

---

## Fluxos críticos

### Fluxo 1 — Compra com Pix

```
Cliente → /produto/[slug] → addToCart (SA)
Cliente → /checkout → quoteShipping (SA → Melhor Envio)
Cliente → submitCheckout (SA → cria order pending; MP createPayment Pix)
Cliente vê QR + copia-cola; polling status (5s)
MP webhook → atualiza order.status = paid, decrementa estoque, dispara e-mail/WhatsApp
Cliente → /pedido/[id]/confirmacao
```

### Fluxo 2 — Cartão de crédito

```
Cliente preenche cartão no MP Bricks (frontend gera card_token; cartão nunca toca o servidor)
submitCheckout(payment_method='card', card_token) →
  MP createPayment (síncrono):
    approved → status = paid, estoque, e-mail
    in_process → status = pending_review (antifraude)
    rejected → mensagem clara + sugestão (mudar cartão/parcelas)
```

### Fluxo 3 — Cotação de frete

```
checkout: input CEP → debounce 500ms → quoteShipping(origem, destino, items[])
Server calcula pacote (peso + dim somadas) → Melhor Envio /shipment/calculate
Filtra transportadoras habilitadas + aplica regras locais (frete grátis acima de X)
Retorna [{ service, name, price, deadline_days }]
```

### Fluxo 4 — Emissão de etiqueta (admin)

```
Admin → /admin/pedidos/[id] → "Emitir etiqueta" → createShippingLabel(orderId, serviceId)
Melhor Envio /shipment/checkout (compra com saldo) → /shipment/generate (PDF) → /shipment/print
Salva URL no order; atualiza status = shipping; salva tracking_code
markAsShipped (manual) → dispara e-mail + WhatsApp
```

### Fluxo 5 — Recuperação de carrinho abandonado

```
Cron Vercel (a cada 30min):
  carts com items + sem order + last_update > 1h + sem e-mail enviado:
    com e-mail → envia recuperação (Resend), marca abandoned_email_sent_at
    após 24h sem ação + telefone → envia WhatsApp (Watidy)
  carts expiram após 7 dias
```

### Fluxo 6 — Login admin

```
/admin/login → Supabase signInWithPassword → session JWT
Server check: existe em admin_users + is_active
Sim → cookie httpOnly + redirect /admin
Middleware /admin/* verifica session + role a cada request
```

---

## Decisões arquiteturais (trade-offs)

| Decisão | Por quê | Trade-off |
|---------|---------|-----------|
| **Next.js App Router** | Server Components reduzem JS no cliente; streaming melhora LCP; Server Actions eliminam REST interno | Curva de aprendizado; alguns plugins legados |
| **Drizzle ORM** | Type-safety por inferência; edge-compatible; SQL-first; bundle 10x menor que Prisma | Comunidade menor; menos features de migration UI |
| **Supabase** | Postgres + Auth + Storage + Realtime + RLS num só stack | Acoplamento; troca exige refactor de auth/storage |
| **MP Bricks** | Único com Pix nativo; antifraude próprio; tokenização evita escopo PCI | UX do Bricks tem limites de customização |
| **Server Actions** | Tipo nativo Next 15; sem deps; integra com forms; sem boilerplate | Sem cache automático tipo tRPC (mitigado com unstable_cache) |
| **Cloudflare na frente** | WAF e rate limit superiores ao Vercel Pro; cache agressivo; bot mgmt | Setup inicial mais complexo |
| **Resend** | DX excelente; templates React Email; reputação BR | Quotas iniciais baixas; SES como fallback se exceder |
| **Sem Redis na v1** | ISR + RSC cobrem 90%; rate limit via Vercel KV se preciso | Cotação de frete repete em cache miss. Aceitável até ~1k pedidos/dia |

---

## Estratégia de cache

| Camada | TTL | Invalidação |
|--------|-----|-------------|
| Cloudflare | 1 ano (assets, hash) | hash no nome |
| Vercel CDN | tag-based | `revalidateTag()` em Server Action |
| Next fetch | configurável | `revalidateTag/Path` |
| Browser | 1 ano (images, fonts) | hash |

### Tags

- `products` (criar/editar produto)
- `product:${slug}` (produto específico)
- `categories` (categoria editada)
- `banners` (banner editado)
- `settings` (settings editadas)

---

## Idempotência e consistência

### Pedidos
- Cliente gera `idempotency_key` (UUID) no submit
- Servidor armazena em `orders.idempotency_key` (UNIQUE)
- Submit duplicado retorna mesmo `order_id` sem cobrar de novo

### Webhooks
- Sempre validado por assinatura HMAC
- `external_id` único por evento; já processado → 200 OK sem reprocessar
- Tabela `webhook_events` audita tudo

### Estoque
- Decremento em transação atômica em `payment.approved`
- Reserva temporária no `pending` (10min) opcional na Fase 2
- Estouro de estoque entre cotação e pagamento → reembolso automático + e-mail

---

## Observabilidade

- **Logs:** Pino estruturado JSON → Vercel Logs (→ Axiom/Logtail opcional Fase 2)
- **Erros:** Sentry frontend + backend
- **Performance:** Sentry Tracing + Web Vitals
- **Uptime:** UptimeRobot externo apontado para `/api/health`
- **Métricas de negócio:** dashboard em `/admin` (DB direto)

### `/api/health`

```ts
GET /api/health
{
  "status": "ok",
  "checks": { "db": "ok", "supabase_storage": "ok", "mercado_pago": "ok", "melhor_envio": "ok" },
  "version": "1.0.0",
  "uptime_s": 12345
}
```

---

## Escalabilidade

Roda bem até ~5k pedidos/mês sem refactor:
- Vercel auto-scale serverless
- Supabase pooler até 200 conn concorrentes
- ISR reduz pressão no DB
- Imagens via CDN

Para Fase 2 (5k–20k pedidos/mês):
- Postgres upgrade tier ou read replicas
- Filas (Inngest/Trigger.dev) para webhooks e e-mails
- Upstash Redis para cache distribuído
- ERP integrado (Bling) para multi-canal
