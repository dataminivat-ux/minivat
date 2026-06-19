# MINI VAT PREMIUM — E-commerce

E-commerce custom para a MINI VAT PREMIUM, fabricante de acessórios 3D para odontologia digital, construído pela Sevyn Labs.

## Quick start

```bash
# 1. Instalar dependências
pnpm install

# 2. Copiar variáveis de ambiente
cp .env.example .env.local
# (preencher as variáveis)

# 3. Rodar migrations do Supabase
supabase db push

# 4. Subir o servidor de dev
pnpm dev
```

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage + RLS)
- Mercado Pago Checkout Transparente
- Melhor Envio API
- Resend (e-mail transacional)
- Tailwind CSS v4 + shadcn/ui
- Zustand + TanStack Query
- Vercel (deploy) + Cloudflare (DNS/CDN)

## Documentação

Toda a documentação técnica está em `/docs`:

- [01-OVERVIEW.md](./docs/01-OVERVIEW.md) — Quem é o cliente, produto, persona
- [02-PRD.md](./docs/02-PRD.md) — Visão de produto, escopo, métricas
- [03-ARCHITECTURE.md](./docs/03-ARCHITECTURE.md) — Decisões arquiteturais, ADRs
- [04-TECH-STACK.md](./docs/04-TECH-STACK.md) — Stack detalhada com versões
- [05-DATABASE-SCHEMA.md](./docs/05-DATABASE-SCHEMA.md) — Schema SQL completo + RLS
- [06-INTEGRATIONS.md](./docs/06-INTEGRATIONS.md) — Mercado Pago, Melhor Envio, Resend, GTM
- [07-SECURITY-LGPD.md](./docs/07-SECURITY-LGPD.md) — Segurança, RLS, LGPD, checklist
- [08-SEO-ANALYTICS.md](./docs/08-SEO-ANALYTICS.md) — SEO técnico, Schema markup, GA4
- [10-ADMIN-PANEL-SPEC.md](./docs/10-ADMIN-PANEL-SPEC.md) — Especificação do admin
- [11-STOREFRONT-SPEC.md](./docs/11-STOREFRONT-SPEC.md) — Especificação da loja
- [12-SPRINTS-ROADMAP.md](./docs/12-SPRINTS-ROADMAP.md) — Roadmap de 6 sprints
- [13-DEPLOYMENT.md](./docs/13-DEPLOYMENT.md) — Deploy Vercel + Cloudflare + Supabase
- [14-TESTING.md](./docs/14-TESTING.md) — Estratégia de testes
- [RESPOSTAS-CLIENTE.md](./docs/RESPOSTAS-CLIENTE.md) — Respostas comerciais para o Vinícius

## Para o Claude Code

**Leia primeiro o [CLAUDE.md](./CLAUDE.md) na raiz.** Ele é a fonte da verdade.

Prompts sequenciais de desenvolvimento estão em `/prompts/`:

1. [`01-setup-inicial.md`](./prompts/01-setup-inicial.md) — Bootstrap do projeto (Sprint 0)
2. [`02-database.md`](./prompts/02-database.md) — Schema Supabase e migrations (Sprint 0)
3. [`03-storefront.md`](./prompts/03-storefront.md) — Loja pública (Sprint 1)
4. [`04-admin.md`](./prompts/04-admin.md) — Painel administrativo (Sprint 3)
5. [`05-checkout.md`](./prompts/05-checkout.md) — Checkout + pagamento + frete (Sprint 2)
6. [`06-integracoes.md`](./prompts/06-integracoes.md) — GTM, SEO, polimento final (Sprint 5)

## Estrutura

Ver [CLAUDE.md seção 2](./CLAUDE.md#2-estrutura-de-pastas).

## Deploy

- **Produção:** branch `main` → deploy automático na Vercel
- **Staging:** branch `develop` → preview deploy
- **Domínio:** www.minivatpremium.com.br (Cloudflare DNS → Vercel)

## Suporte

Sevyn Labs — Diego — Uberlândia, MG
