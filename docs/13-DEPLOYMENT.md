# 13 — Deployment

## Visão geral da infra

```
┌──────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                           │
│        DNS · CDN · WAF · Rate Limit · Bot Mgmt · SSL         │
└────────────────────────────┬─────────────────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │       VERCEL        │
                  │   Production env    │
                  │   Preview envs (PR) │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │      SUPABASE       │
                  │   Postgres + Auth   │
                  │   Storage + Realtime│
                  └─────────────────────┘
```

## Ambientes

| Ambiente | Vercel | Supabase | URL |
|----------|--------|----------|-----|
| Dev (local) | `pnpm dev` | Projeto Supabase `minivat-dev` | http://localhost:3000 |
| Staging | Branch `develop` | Projeto Supabase `minivat-staging` | https://staging.minivatpremium.com.br |
| Produção | Branch `main` | Projeto Supabase `minivat-prod` | https://minivatpremium.com.br |
| Preview (PR) | Cada PR | Projeto `minivat-dev` (compartilhado) | https://minivat-pr-NN.vercel.app |

> Bancos separados garantem que migrations/seeds em dev/staging não afetam produção.

## Setup inicial

### 1. Domínio (Cloudflare)

1. Registrar/transferir `minivatpremium.com.br` para Cloudflare
2. Nameservers do registro alterados para os indicados pela Cloudflare
3. Aguardar propagação (~24h)

### 2. Cloudflare → Vercel

- Adicionar `minivatpremium.com.br` no Vercel project
- Vercel gera registros CNAME (`cname.vercel-dns.com`)
- No Cloudflare, criar:
  - `@` → CNAME → `cname.vercel-dns.com` (Proxy: laranja, modo CDN)
  - `www` → CNAME → `cname.vercel-dns.com` (Proxy: laranja)
  - `staging` → CNAME → `cname.vercel-dns.com` (Proxy: laranja)
- SSL mode no Cloudflare: **Full (strict)**

### 3. Supabase

1. Criar 3 projetos (dev, staging, prod) na mesma org Supabase
2. Em cada um, copiar `URL`, `anon key`, `service_role key`, `database password`
3. Configurar Auth providers (e-mail+senha habilitado; SMTP custom usando Resend)
4. Criar bucket `products` em Storage (public, com CDN)
5. Aplicar migrations Drizzle + RLS policies + triggers via scripts

### 4. Vercel project

1. Importar repo do GitHub
2. Configurar variáveis de ambiente (do `.env.example`) por ambiente
3. Habilitar Vercel Cron Jobs
4. Configurar webhook do GitHub (auto-deploy em push)
5. Adicionar membros do time

### 5. Integrações de produção

| Serviço | Setup |
|---------|-------|
| Mercado Pago | Conta verificada (CNPJ); credenciais produção; webhook URL `https://minivatpremium.com.br/api/webhooks/mercado-pago` |
| PagBank | Conta verificada; token produção; webhook URL análogo |
| Melhor Envio | Conta + saldo + token produção; webhook URL análogo |
| Resend | Conta + domínio verificado (DKIM/SPF/DMARC); API key produção |
| Watidy | Instance ID + API key |
| Sentry | Projeto criado; DSN copiado; auth token para source maps |
| UptimeRobot | Apontar para `/api/health` (1min interval); alertas por e-mail+WhatsApp |
| Google Search Console | Verificar propriedade; submeter sitemap |

---

## CI/CD

### GitHub Actions

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request: { branches: [main, develop] }
  push:        { branches: [main, develop] }

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
        env:
          # secrets de build (vars NEXT_PUBLIC_* + chaves de build)
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL_STAGING }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}

  lighthouse:
    needs: validate
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm dlx @lhci/cli@latest autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  e2e:
    needs: validate
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install --with-deps
      - run: pnpm test:e2e
```

### Pré-commit (Husky + lint-staged)

`.husky/pre-commit`:
```bash
#!/usr/bin/env sh
pnpm lint-staged
```

`package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,yml}": ["prettier --write"]
}
```

### Deploys (Vercel)

- Push em `develop` → deploy automático para staging
- Push em `main` → deploy automático para produção
- PRs → deploy preview com URL única
- Build falha automaticamente se `pnpm typecheck` ou `pnpm lint` quebrar

### Migrations

Migrations são commitadas e executadas no deploy. Fluxo:

```bash
# Local, após alterar src/db/schema/*
pnpm db:generate         # gera SQL em src/db/migrations
git add . && git commit  # commita SQL

# No CI, antes do build:
pnpm db:migrate          # roda migrations pendentes no Supabase do ambiente
```

Para RLS policies (não cobertas pelo Drizzle), arquivos `.sql` em `src/db/migrations/rls/` são executados via script `pnpm db:rls`.

---

## Vercel Cron Jobs

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/abandoned-carts", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/review-requests", "schedule": "0 13 * * *" },
    { "path": "/api/cron/anonymize-deleted", "schedule": "0 6 * * *" },
    { "path": "/api/cron/refresh-melhor-envio-token", "schedule": "0 5 1 * *" }
  ]
}
```

> Horários em UTC. Cron de UTC 13h = 10h BRT.

Todos os endpoints de cron exigem header `Authorization: Bearer ${CRON_SECRET}`.

---

## Variáveis de ambiente (Vercel)

Configurar em **Settings → Environment Variables** com escopo:
- **Production** — branch `main`
- **Preview** — todos os PRs
- **Development** — `vercel dev` local

Variáveis sensíveis (service_role, tokens MP/PagBank/MEnvio) marcadas como **encrypted**.

**Boa prática:** usar `vercel env pull .env.local` para sincronizar local com staging.

---

## Domínio + SSL

- SSL via Cloudflare (Universal SSL automático)
- HSTS preload habilitado após verificar funcionamento (`hstspreload.org/?domain=minivatpremium.com.br`)
- Redirect `www` → root (configurar em Cloudflare Page Rules)
- Redirect `http` → `https` (configurar no Vercel + Cloudflare)

---

## Monitoramento

### UptimeRobot
- Monitor HTTP em `https://minivatpremium.com.br/api/health` a cada 1min
- Alerta por e-mail + Telegram + WhatsApp (via Watidy webhook)

### Sentry
- Projetos: `minivat-frontend`, `minivat-backend`
- Alertas: e-mail para qualquer erro crítico; agrupamento por release
- Performance: queries lentas (> 1s), endpoints lentos (> 2s)

### Logs
- Vercel Logs (built-in) — 7 dias retenção
- Exportar para Axiom/Logtail (Fase 2) — 30 dias

### Métricas de negócio
- Dashboard em `/admin` (consulta DB)
- Export periódico para Google Sheets (Fase 2 — Apps Script via API)

---

## Rollback

### Vercel
- Deploys anteriores ficam acessíveis em `/deployments` no painel
- "Promote to Production" volta para deploy anterior
- Tempo de rollback: < 30s

### Database
- Migrations sempre escritas com rollback em mente (use `IF NOT EXISTS`, evite DROP destrutivo)
- Supabase faz backup automático diário (7 dias retenção no plano Pro)
- PITR (Point-in-Time Recovery) disponível no plano Team

### Webhooks
- Mantemos `webhook_events` no DB; em caso de falha, podem ser reprocessados manualmente

---

## Backup

| O quê | Onde | Frequência | Retenção |
|-------|------|-----------|----------|
| Postgres | Supabase | Diário (automático) | 7 dias (Pro) / 14 dias (Team) |
| Postgres (manual) | Dump para S3 | Semanal (Fase 2) | 3 meses |
| Storage (imagens) | Supabase Storage | Réplica multi-zone (automática) | — |
| Audit logs | Tabela `audit_logs` | — | 2 anos |
| Config / secrets | Vercel Env | — | Versionados no Vercel |

---

## Custos estimados (mês de operação típica)

| Serviço | Plano | Custo aprox. (R$) |
|---------|-------|-------------------|
| Vercel | Pro | R$ 100 |
| Supabase | Pro (8GB DB, 100GB Storage, 250GB egress) | R$ 125 |
| Cloudflare | Free | R$ 0 |
| Resend | Pro (50k e-mails/mês) | R$ 100 |
| Sentry | Team (Brazil) | R$ 130 |
| Watidy | conforme plano contratado pelo cliente | (já paga) |
| Melhor Envio | apenas saldo de etiquetas (já são pagas pelo pedido) | — |
| Domínio | `.com.br` | R$ 40/ano |
| **Total recorrente Sevyn** | | **~R$ 455/mês** |

Plano de revenda: Sevyn cobra mensalidade que cobre infra + suporte + manutenção (sugestão R$ 1.500-2.500/mês).

---

## Procedimento de go-live (checklist)

24h antes:
- [ ] Smoke test em staging (3 compras Pix + 1 cartão + 1 boleto + cancelamento)
- [ ] Conferir saldo Melhor Envio (R$ 500+)
- [ ] Conferir credenciais de produção em todos os providers
- [ ] Backup do DB de staging (não vai pra prod, mas serve como referência)
- [ ] Cliente confirmou política de privacidade publicada
- [ ] Cliente confirmou fotos de todos os SKUs principais
- [ ] Treinamento do cliente concluído

Dia do go-live:
- [ ] Promover deploy de staging → produção (ou merge `develop` → `main`)
- [ ] Verificar DNS apontando
- [ ] Verificar SSL ativo
- [ ] Verificar `/api/health` retornando OK
- [ ] Verificar Sitemap acessível
- [ ] Submeter sitemap no Search Console
- [ ] Fazer 1 compra real de teste (cancelar logo após)
- [ ] Avisar cliente: "Está no ar"
- [ ] Cliente anuncia nos canais dele
- [ ] Monitorar Sentry + Vercel Logs nas primeiras 4h

D+1:
- [ ] Revisar Sentry — corrigir qualquer erro crítico
- [ ] Verificar primeiros pedidos reais (deve-se conferir cada um nos primeiros 3 dias)
- [ ] Coletar feedback do cliente sobre operação

D+7:
- [ ] Review de performance (Lighthouse em produção)
- [ ] Revisão de logs e métricas
- [ ] Documentar primeiros aprendizados em `docs/post-launch/2026-XX-XX.md`
