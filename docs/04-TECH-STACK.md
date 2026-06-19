# 04 — Tech Stack

## Runtime e gestor de pacotes

| | Versão | Por quê |
|---|--------|---------|
| Node.js | **22 LTS** (mín 20.18) | LTS, native fetch, perf |
| pnpm | **9.x** | Lock determinístico, monorepo-ready |
| TypeScript | **5.6+** | Inferência atual + decorators |

## Framework e UI

| | Versão | Por quê |
|---|--------|---------|
| Next.js | **15.x** | App Router, Server Components, Server Actions, partial prerendering |
| React | **19.x** | Actions, useOptimistic, useFormStatus |
| Tailwind CSS | **4.x** | CSS-first, design tokens, build mais rápido |
| shadcn/ui | mais recente | Componentes não-empacotados, customização total |
| Radix UI Primitives | via shadcn | Acessibilidade fora da caixa |
| Lucide React | latest | Ícones, tree-shakeable |
| Tiptap | 2.x | Editor rich text para descrições no admin |
| Sonner | latest | Toasts com boa DX |
| Vaul | latest | Drawer mobile |

### Tipografia (via next/font)
- **Fraunces** (display, headings; pesos 400/600/700; opsz/SOFT)
- **Inter** (body; 400/500/600)
- **JetBrains Mono** (código no admin/docs)

## Data e backend

| | Versão | Por quê |
|---|--------|---------|
| Supabase | latest | Postgres + Auth + Storage + Realtime + RLS |
| Drizzle ORM | **0.36+** | Type-safe, edge-compatible, SQL-first |
| drizzle-kit | 0.28+ | Geração de migrations |
| postgres-js | 3.x | Driver Postgres rápido |
| Zod | **3.23+** | Validação end-to-end |
| nanoid | 5.x | IDs curtos sigilosos (cupons, tokens) |
| date-fns | 4.x | Datas locale pt-BR |

## Forms e estado

| | Versão | Por quê |
|---|--------|---------|
| react-hook-form | 7.x | Form perf + DX |
| @hookform/resolvers | 3.x | Integra com Zod |
| TanStack Query | **5.x** | Cache cliente no admin |
| TanStack Table | 8.x | Tabelas do admin |

## Integrações (clients HTTP/SDK)

| | Versão |
|---|--------|
| @mercadopago/sdk-js (browser) | latest |
| mercadopago (node) | 2.x |
| (PagBank — sem SDK oficial, usar fetch nativo) | — |
| (Melhor Envio — sem SDK oficial, fetch nativo) | — |
| resend | 4.x |
| @react-email/components | latest |

## Observabilidade

| | Versão |
|---|--------|
| @sentry/nextjs | 8.x |
| pino | 9.x |
| pino-pretty | 11.x (dev only) |

## Dev tooling

| | Versão |
|---|--------|
| ESLint | 9.x (flat config) |
| Prettier | 3.x |
| Husky | 9.x |
| lint-staged | 15.x |
| Vitest | 2.x |
| @testing-library/react | 16.x |
| Playwright | 1.49+ |
| @axe-core/playwright | latest |
| Lighthouse CI | 0.14+ |

---

## `package.json` (esqueleto)

```json
{
  "name": "minivat-ecommerce",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=20.18.0" },
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:rls": "tsx src/db/apply-rls.ts",
    "db:seed": "tsx src/db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "prepare": "husky"
  }
}
```

## `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
})
```

## `next.config.ts`

```ts
import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "minivatpremium.com.br" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    ppr: "incremental",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default withSentryConfig(config, {
  org: "sevyn-labs",
  project: "minivat",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
})
```

## Theme tokens (Tailwind v4 + CSS vars)

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg: #FAF7F2;            /* off-white quente */
  --color-fg: #14110D;            /* graphite */
  --color-muted: #6B6157;
  --color-line: #E8E2D8;

  --color-brand: #1A1614;         /* preto suave */
  --color-accent: #C4A052;        /* dourado champagne */
  --color-accent-strong: #A88137;

  --color-success: #2E7D5A;
  --color-warning: #C77F2A;
  --color-danger: #B43A2F;

  --font-display: var(--font-fraunces);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-card: 0 1px 2px rgb(20 17 13 / 0.04), 0 4px 12px rgb(20 17 13 / 0.06);
  --shadow-lifted: 0 8px 24px rgb(20 17 13 / 0.10);
}
```

## Dependências críticas — instalação inicial

```bash
pnpm create next-app@latest minivat-ecommerce \
  --typescript --tailwind --app --src-dir --import-alias "@/*" --turbopack

cd minivat-ecommerce

# UI
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
         @radix-ui/react-popover @radix-ui/react-select \
         @radix-ui/react-tabs @radix-ui/react-toast \
         class-variance-authority clsx tailwind-merge \
         lucide-react sonner vaul

# Forms
pnpm add react-hook-form @hookform/resolvers zod

# DB
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# Estado
pnpm add @tanstack/react-query @tanstack/react-table

# Datas
pnpm add date-fns

# IDs
pnpm add nanoid

# Pagamentos
pnpm add mercadopago

# E-mail
pnpm add resend @react-email/components @react-email/render

# Observabilidade
pnpm add @sentry/nextjs pino

# Editor
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-link

# Imagens (server)
pnpm add sharp

# Tests
pnpm add -D vitest @vitejs/plugin-react @testing-library/react \
            @testing-library/jest-dom jsdom vite-tsconfig-paths \
            playwright @playwright/test @axe-core/playwright \
            msw

# Dev tools
pnpm add -D eslint prettier prettier-plugin-tailwindcss \
            husky lint-staged \
            tsx @types/node
```

## Estrutura de pastas (alto nível)

```
minivat-ecommerce/
├── .github/workflows/
├── docs/                          # (esta documentação)
├── public/
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── categoria/[slug]/
│   │   │   ├── produto/[slug]/
│   │   │   ├── busca/
│   │   │   ├── carrinho/
│   │   │   ├── checkout/
│   │   │   ├── pedido/[orderNumber]/confirmacao/
│   │   │   ├── conta/
│   │   │   └── (institucional)/
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   ├── produtos/
│   │   │   ├── pedidos/
│   │   │   ├── clientes/
│   │   │   ├── cupons/
│   │   │   ├── banners/
│   │   │   ├── frete/
│   │   │   ├── configuracoes/
│   │   │   └── avaliacoes/
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   ├── og/[productId]/route.tsx
│   │   │   ├── webhooks/
│   │   │   │   ├── mercado-pago/route.ts
│   │   │   │   ├── pagbank/route.ts
│   │   │   │   ├── melhor-envio/route.ts
│   │   │   │   └── watidy/route.ts
│   │   │   └── cron/
│   │   │       ├── abandoned-carts/route.ts
│   │   │       ├── review-requests/route.ts
│   │   │       ├── anonymize-deleted/route.ts
│   │   │       └── refresh-melhor-envio-token/route.ts
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn
│   │   ├── storefront/
│   │   ├── admin/
│   │   └── seo/
│   ├── server/
│   │   ├── actions/               # Server Actions por domínio
│   │   ├── services/              # lógica de negócio
│   │   ├── integrations/
│   │   │   ├── mercado-pago/
│   │   │   ├── pagbank/
│   │   │   ├── melhor-envio/
│   │   │   ├── resend/
│   │   │   ├── watidy/
│   │   │   └── viacep/
│   │   └── auth/
│   ├── db/
│   │   ├── schema/                # 1 arquivo por agregado
│   │   ├── migrations/
│   │   ├── rls/                   # policies SQL
│   │   ├── seeds/
│   │   ├── client.ts
│   │   ├── supabase-admin.ts
│   │   ├── migrate.ts
│   │   └── seed.ts
│   ├── lib/
│   │   ├── format.ts
│   │   ├── cep.ts
│   │   ├── gtm.ts
│   │   ├── result.ts
│   │   └── utils.ts
│   ├── emails/                    # React Email templates
│   ├── test/
│   │   ├── setup.ts
│   │   ├── fixtures/
│   │   └── mocks/
│   ├── middleware.ts
│   └── env.ts                     # validação Zod das envs
├── e2e/                            # Playwright
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── drizzle.config.ts
├── next.config.ts
├── playwright.config.ts
├── tsconfig.json
├── vercel.json
├── vitest.config.ts
├── CLAUDE.md
└── package.json
```

## Convenções de código

- **Imports:** alias `@/` para `src/`
- **Server-only:** arquivos com `import "server-only"` no topo
- **Server Actions:** arquivos com `"use server"` no topo, exportações nomeadas
- **Tipos:** `type` para uniões/objetos; `interface` só quando necessário
- **Naming:** camelCase para vars/funcs; PascalCase para componentes; UPPER_SNAKE para constantes; kebab-case para arquivos
- **Sem `any`** — uso pontual com `// eslint-disable` justificado
- **Result type** para Server Actions: `Result<T> = { ok: true, data: T } | { ok: false, error: string }`
- **Conteúdo em PT-BR**, código em inglês
