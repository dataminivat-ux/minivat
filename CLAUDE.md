# CLAUDE.md — Source of Truth | MINI VAT PREMIUM E-commerce

> **Este arquivo é a fonte da verdade do projeto. Leia ANTES de qualquer ação. Atualize sempre que tomar decisões arquiteturais.**

---

## 0. Identidade do projeto

- **Cliente:** MINI VAT PREMIUM (Vinícius — dentista, fabricante de acessórios 3D para odontologia)
- **Marca:** MINI VAT PREMIUM
- **Domínio:** www.minivatpremium.com.br
- **Categoria:** Acessórios para impressora 3D (nicho odontológico)
- **Tom de voz:** próximo, amigável, técnico (jargão odontológico OK)
- **Referências visuais:** Apple, Samsung, Dell — clean, moderno, intuitivo
- **Paleta:** seguir manual de marca do cliente (PNG/JPG fornecidos; vetorizar logo na Fase 1)
- **Idiomas:** PT-BR (Fase 1) → EN (Fase 2, exportação global)
- **Moedas:** BRL (Fase 1) → USD/EUR (Fase 2)

---

## 1. Stack técnico (não negociável)

### Core
- **Framework:** Next.js 15 (App Router, Server Components)
- **Linguagem:** TypeScript (strict mode)
- **Estilo:** Tailwind CSS v4 + shadcn/ui
- **Validação:** Zod
- **Forms:** react-hook-form + @hookform/resolvers/zod
- **Estado global:** Zustand (carrinho, UI state)
- **Estado servidor:** TanStack Query (cache de dados Supabase)

### Backend e dados
- **BaaS:** Supabase
  - PostgreSQL (banco principal)
  - Auth (admin + cliente, magic link + senha + Google OAuth)
  - Storage (imagens de produto, banners, assets)
  - Realtime (estoque ao vivo no admin)
  - Row Level Security (RLS) **obrigatório em todas as tabelas**
- **ORM:** Prisma OU direto via supabase-js (decisão: usar supabase-js para evitar overhead de migrations; Prisma só se a complexidade do schema crescer)

### Pagamentos
- **Brasil:** Mercado Pago Checkout Transparente (SDK oficial)
  - Pix, cartão de crédito, Apple Pay, Google Pay
  - Até 6x sem juros (configurável no admin)
  - Webhook de notificação obrigatório
- **Internacional:** Stripe (Fase 2)

### Frete
- **Brasil:** Melhor Envio API v2
- **Internacional:** Correios Packet via Melhor Envio (Fase 2)
- **Origem:** CEP de Goiânia/GO (a confirmar com cliente)

### Comunicação
- **Email transacional:** Resend (templates em React Email)
- **WhatsApp:** Evolution API (instância própria) + n8n para automações (Fase 2)

### Marketing e analytics
- **GTM** (Google Tag Manager) como container — cliente adiciona tags pelo painel do Google
- **GA4** via GTM
- **Meta Pixel** via GTM
- **Eventos de e-commerce** disparados via dataLayer (view_item, add_to_cart, begin_checkout, purchase)

### Infraestrutura
- **Hospedagem:** Vercel (Pro plan recomendado)
- **DNS / CDN:** Cloudflare
- **Erros:** Sentry
- **Logs:** Vercel + Supabase Logs
- **Uptime:** UptimeRobot ou BetterStack

---

## 2. Estrutura de pastas

```
minivat-ecommerce/
├── CLAUDE.md                          # Este arquivo (NÃO DELETE)
├── README.md                          # Setup do projeto
├── .env.example                       # Template de variáveis
├── .env.local                         # Não comitar
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── components.json                    # shadcn/ui config
├── middleware.ts                      # Auth + rate limit
│
├── docs/                              # Documentação técnica
│   ├── 01-OVERVIEW.md
│   ├── 02-PRD.md
│   ├── 03-ARCHITECTURE.md
│   ├── 04-TECH-STACK.md
│   ├── 05-DATABASE-SCHEMA.md
│   ├── 06-INTEGRATIONS.md
│   ├── 07-SECURITY-LGPD.md
│   ├── 08-SEO-ANALYTICS.md
│   ├── 10-ADMIN-PANEL-SPEC.md
│   ├── 11-STOREFRONT-SPEC.md
│   ├── 12-SPRINTS-ROADMAP.md
│   ├── 13-DEPLOYMENT.md
│   ├── 14-TESTING.md
│   └── RESPOSTAS-CLIENTE.md
│
├── supabase/
│   ├── migrations/                    # SQL migrations
│   ├── seed.sql                       # Dados iniciais
│   └── functions/                     # Edge functions (opcional)
│
├── prompts/                           # Prompts para o Claude Code
│   ├── 01-setup-inicial.md
│   ├── 02-database.md
│   ├── 03-storefront.md
│   ├── 04-admin.md
│   ├── 05-checkout.md
│   └── 06-integracoes.md
│
├── public/
│   ├── images/
│   ├── icons/
│   ├── robots.txt
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── (storefront)/              # Layout público
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Home
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx           # Listagem
│   │   │   │   └── [slug]/page.tsx    # PDP
│   │   │   ├── categorias/
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── carrinho/page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pagamento/page.tsx
│   │   │   │   └── sucesso/[id]/page.tsx
│   │   │   ├── conta/
│   │   │   │   ├── page.tsx           # Dashboard cliente
│   │   │   │   ├── pedidos/page.tsx
│   │   │   │   ├── pedidos/[id]/page.tsx
│   │   │   │   ├── lista-desejos/page.tsx
│   │   │   │   └── enderecos/page.tsx
│   │   │   ├── institucional/
│   │   │   │   ├── sobre/page.tsx
│   │   │   │   ├── contato/page.tsx
│   │   │   │   ├── trocas-devolucoes/page.tsx
│   │   │   │   ├── privacidade/page.tsx
│   │   │   │   └── termos/page.tsx
│   │   │   ├── busca/page.tsx
│   │   │   └── (auth)/
│   │   │       ├── entrar/page.tsx
│   │   │       └── cadastrar/page.tsx
│   │   │
│   │   ├── admin/                     # Painel admin
│   │   │   ├── layout.tsx             # Auth-guarded
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── produtos/
│   │   │   ├── pedidos/
│   │   │   ├── clientes/
│   │   │   ├── cupons/
│   │   │   ├── banners/
│   │   │   ├── categorias/
│   │   │   ├── frete/
│   │   │   ├── avaliacoes/
│   │   │   └── configuracoes/
│   │   │
│   │   ├── api/
│   │   │   ├── checkout/
│   │   │   │   ├── criar-pagamento/route.ts
│   │   │   │   └── pix/route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── mercadopago/route.ts
│   │   │   │   └── melhor-envio/route.ts
│   │   │   ├── frete/calcular/route.ts
│   │   │   ├── cep/[cep]/route.ts     # ViaCEP proxy
│   │   │   ├── cupom/validar/route.ts
│   │   │   ├── upload/route.ts        # Signed URLs Supabase Storage
│   │   │   └── revalidate/route.ts    # On-demand ISR
│   │   │
│   │   ├── sitemap.ts                 # Sitemap dinâmico
│   │   ├── robots.ts
│   │   └── opengraph-image.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── storefront/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── product-card.tsx
│   │   │   ├── product-gallery.tsx
│   │   │   ├── cart-drawer.tsx
│   │   │   ├── checkout-form.tsx
│   │   │   ├── shipping-calculator.tsx
│   │   │   ├── reviews-list.tsx
│   │   │   ├── hero-banner.tsx
│   │   │   └── ...
│   │   ├── admin/
│   │   │   ├── data-table.tsx
│   │   │   ├── product-form.tsx
│   │   │   ├── order-status-flow.tsx
│   │   │   └── ...
│   │   └── shared/
│   │       ├── analytics.tsx          # GTM + GA4
│   │       ├── seo.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   ├── server.ts              # Server client (cookies)
│   │   │   ├── admin.ts               # Service role
│   │   │   └── types.ts               # Database types (gen)
│   │   ├── mercadopago/
│   │   │   ├── client.ts
│   │   │   ├── create-payment.ts
│   │   │   ├── verify-webhook.ts
│   │   │   └── types.ts
│   │   ├── melhor-envio/
│   │   │   ├── client.ts
│   │   │   ├── calculate.ts
│   │   │   ├── cart.ts                # Carrinho ME (gera etiqueta)
│   │   │   └── types.ts
│   │   ├── email/
│   │   │   ├── client.ts              # Resend
│   │   │   └── templates/
│   │   ├── analytics/
│   │   │   ├── gtm.ts
│   │   │   └── events.ts              # Funções de tracking
│   │   ├── validators/                # Schemas Zod
│   │   ├── utils/
│   │   │   ├── format.ts              # Moeda, CEP, CPF
│   │   │   ├── slug.ts
│   │   │   └── cn.ts
│   │   └── constants.ts
│   │
│   ├── hooks/
│   │   ├── use-cart.ts                # Zustand store
│   │   ├── use-user.ts
│   │   └── ...
│   │
│   ├── stores/
│   │   └── cart-store.ts
│   │
│   └── types/
│       ├── product.ts
│       ├── order.ts
│       └── ...
│
└── tests/                             # Vitest + Playwright (opcional Fase 1)
```

---

## 3. Convenções de código

- **Idioma:** código em inglês, conteúdo do usuário em PT-BR
- **Nomes de arquivos:** `kebab-case.tsx`
- **Componentes:** PascalCase
- **Funções/variáveis:** camelCase
- **Constantes:** UPPER_SNAKE_CASE
- **Tabelas Supabase:** snake_case plural (`products`, `order_items`)
- **Colunas Supabase:** snake_case (`created_at`, `total_amount`)
- **Server Components por padrão**, Client Components apenas quando precisa de estado/interação
- **Server Actions** para mutations sempre que possível (evita criar rotas API desnecessárias)
- **Nunca expor service_role no frontend**
- **Toda mutação financeira** (pedido, pagamento) passa por API route ou Server Action validada
- **Comentários em português** para o cliente entender; nomes de identificadores em inglês

---

## 4. Regras de segurança críticas

1. **RLS habilitado em TODAS as tabelas** (sem exceção)
2. **Variáveis sensíveis** apenas em `.env.local` (Mercado Pago access token, service_role key, Melhor Envio token)
3. **Validação dupla:** cliente (UX) + servidor (verdade)
4. **Webhook do Mercado Pago:** validar assinatura `x-signature` antes de processar
5. **Rate limit** em endpoints públicos (/api/cep, /api/frete, /api/checkout) via middleware
6. **CORS restrito** ao próprio domínio nos endpoints sensíveis
7. **HTTPS obrigatório** (Vercel + Cloudflare já provê)
8. **LGPD:**
   - Banner de consentimento de cookies (analytics/marketing OPT-IN)
   - Política de privacidade e termos de uso publicados antes do go-live
   - Endpoint de portabilidade/exclusão de dados do usuário (`/conta/privacidade`)
9. **Senhas:** Supabase Auth gerencia (bcrypt embaixo); nunca armazenar manualmente
10. **CPF/CNPJ:** armazenar mas nunca exibir completo após cadastro (mostrar últimos 4)

---

## 5. Fluxo de checkout (crítico — leia antes de implementar)

```
1. Cliente clica "Finalizar Compra" no carrinho
   ↓
2. Etapa 1: Identificação (email + cadastro/login)
   ↓
3. Etapa 2: Entrega
   - Input CEP → calcular frete (Melhor Envio)
   - Selecionar opção de frete (PAC, SEDEX, etc.)
   - Endereço completo
   ↓
4. Etapa 3: Pagamento
   - Opção 1: Pix (gera QR Code, polling de status)
   - Opção 2: Cartão de crédito (tokenização client-side)
   - Opção 3: Apple Pay / Google Pay (Mercado Pago)
   ↓
5. POST /api/checkout/criar-pagamento
   - Valida tudo no servidor (preço, estoque, cupom, frete)
   - Cria pedido em "aguardando_pagamento"
   - Cria preferência no Mercado Pago
   - Retorna ID + URL/QR Code
   ↓
6. Mercado Pago processa → webhook em /api/webhooks/mercadopago
   - Valida assinatura
   - Atualiza status do pedido
   - Decrementa estoque
   - Dispara email de confirmação (Resend)
   - Dispara evento purchase no GTM
   - (Fase 2) Cria envio no Melhor Envio (cart) automaticamente
   ↓
7. Cliente é redirecionado para /checkout/sucesso/[id]
```

**Regras de ouro:**
- **Nunca** confiar no preço/frete enviado pelo cliente — recalcule no servidor
- **Idempotência** no webhook (mesma notificação chega 2x: trate como já processada)
- **Reserva de estoque** ao criar pedido pendente (libera em 30min se Pix não pago)
- **Logs estruturados** em todas as etapas (debug pós-incidente)

---

## 6. Variáveis de ambiente (.env.local)

Ver `.env.example` para a lista completa. Resumo:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                # NUNCA expor

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=                 # Server only
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Melhor Envio
MELHOR_ENVIO_TOKEN=                       # Bearer
MELHOR_ENVIO_FROM_CEP=
MELHOR_ENVIO_SANDBOX=true                 # false em produção

# Resend
RESEND_API_KEY=
RESEND_FROM=contato@minivatpremium.com.br

# GTM / Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Sentry
SENTRY_DSN=

# App
NEXT_PUBLIC_SITE_URL=https://www.minivatpremium.com.br
ADMIN_EMAILS=vst2002@gmail.com            # CSV de admins
```

---

## 7. Roadmap por sprints (alto nível)

| Sprint | Duração | Entrega |
|---|---|---|
| 0 | 1-2 dias | Setup: repo, Supabase, Vercel, domínio, .env, shadcn |
| 1 | 5-7 dias | Storefront público: home, catálogo, PDP, carrinho |
| 2 | 5-7 dias | Checkout completo: frete + Mercado Pago + emails |
| 3 | 5-7 dias | Admin: produtos, pedidos, cupons, banners, categorias |
| 4 | 3-5 dias | Área cliente: login, pedidos, wishlist, endereços |
| 5 | 3-5 dias | SEO, GTM, sitemap, schema markup, performance |
| 6 | FASE 2 | ERP (Bling), NF-e (WebmaniaBR), WhatsApp, internacional |

**Total Fase 1 (MVP transacional):** 22-30 dias úteis
Ver `docs/12-SPRINTS-ROADMAP.md` para detalhamento.

---

## 8. Decisões arquiteturais documentadas (ADRs)

| # | Decisão | Justificativa |
|---|---|---|
| 001 | Next.js custom em vez de WooCommerce | Stack Sevyn padrão; performance; TypeScript; cliente pediu TS |
| 002 | Supabase em vez de Postgres standalone | Auth + Storage + RLS no mesmo serviço; Sevyn padrão |
| 003 | Mercado Pago em vez de PagBank | Apple/Google Pay nativo; SDK maduro; cliente sem preferência |
| 004 | Melhor Envio em vez de Frenet | Plugin oficial; cliente já planeja usar |
| 005 | GTM como camada de tags | Cliente gerencia Pixel/GA sem mexer no código (responde Q4) |
| 006 | Sem ERP na Fase 1 | Volume não justifica; Bling entra na Fase 2 |
| 007 | NF-e via WebmaniaBR (Fase 2) | Cliente sem A1; WebmaniaBR resolve sem self-managed |

---

## 9. Pendências e bloqueios para o Vinícius

Antes do go-live, o cliente precisa providenciar:

- [ ] **Abertura de MEI ou ME** (CPF não emite NF-e modelo 55)
- [ ] **Vetorização da logo** (.svg ou .ai) — ofereça serviço pela Sevyn
- [ ] **Fotos profissionais de todos os SKUs** (hoje só "alguns")
- [ ] **Descrições completas de todos os SKUs**
- [ ] **Política de troca e devolução finalizada** (hoje é rascunho)
- [ ] **CEP de origem para frete**
- [ ] **Conta business no Mercado Pago** (após MEI)
- [ ] **Conta no Melhor Envio + recarga de saldo**
- [ ] **Conta GA4 + Tag Manager + Meta Business Manager**
- [ ] **DPO/responsável LGPD nomeado** (pode ser ele mesmo)
- [ ] **Certificado digital A1** (Fase 2, para NF-e self-managed) OU contratar WebmaniaBR
- [ ] **Definição de regime tributário** (com contador)

---

## 10. Quando estiver em dúvida

- **Sobre arquitetura:** consulte `docs/03-ARCHITECTURE.md`
- **Sobre stack/versões:** consulte `docs/04-TECH-STACK.md`
- **Sobre schema do banco:** consulte `docs/05-DATABASE-SCHEMA.md`
- **Sobre integrações específicas:** consulte `docs/06-INTEGRATIONS.md`
- **Sobre segurança/LGPD:** consulte `docs/07-SECURITY-LGPD.md`
- **Sobre SEO/analytics:** consulte `docs/08-SEO-ANALYTICS.md`
- **Sobre o próximo sprint:** consulte `docs/12-SPRINTS-ROADMAP.md`
- **Sobre como falar com o cliente:** consulte `docs/RESPOSTAS-CLIENTE.md`
- **Se ainda em dúvida:** PARE e pergunte ao Diego (Sevyn Labs)

---

**Última atualização:** sprint 0 (setup inicial)
**Mantido por:** Diego (Sevyn Labs)
**Cliente:** Vinícius — MINI VAT PREMIUM
