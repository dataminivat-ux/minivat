# Prompt 01 — Setup inicial (Sprint 0)

> Cole este prompt no Claude Code (`claude` no terminal) **após** ter criado o repo vazio e estar dentro dele. Tempo estimado: 1-2 dias.

---

## Contexto pra você (Claude Code)

Você está iniciando o projeto **MINI VAT PREMIUM**, e-commerce custom para fabricante de acessórios 3D odontológicos. Cliente final: Vinícius. Agência: Sevyn Labs.

**Leia primeiro, em ordem:**
1. `CLAUDE.md` na raiz — fonte da verdade
2. `docs/PRD.md` — visão do produto
3. `docs/ARCHITECTURE.md` — decisões arquiteturais
4. `docs/SPRINTS.md` (Sprint 0) — DoD desta sprint

Não pule essas leituras. Elas têm convenções de código, regras de segurança e decisões já tomadas que você deve respeitar.

---

## Sua missão neste sprint

Deixar o esqueleto do projeto pronto pra começar a desenvolver código de produto. **Zero código de loja agora** — só infra, configurações, deploy funcionando.

## Tarefas (na ordem)

### 1. Inicializar Next.js 15

```bash
pnpm create next-app@latest . \
  --typescript --tailwind --app --src-dir \
  --import-alias "@/*" --use-pnpm --no-eslint
```

Quando perguntar `eslint`, dizer **não** (vamos configurar manualmente com regras Sevyn).

### 2. Configurar TypeScript strict

Editar `tsconfig.json` com `"strict": true`, `"noUncheckedIndexedAccess": true`, `"noUnusedLocals": true`, paths configurados.

### 3. Instalar dependências core

```bash
pnpm add @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers zustand @tanstack/react-query lucide-react clsx tailwind-merge class-variance-authority
pnpm add -D @types/node prettier prettier-plugin-tailwindcss eslint eslint-config-next
```

### 4. Configurar shadcn/ui

```bash
pnpm dlx shadcn@latest init -d
```

Aceitar defaults: `slate` color, CSS variables, `@/components`, `@/lib/utils`.

Instalar componentes base:
```bash
pnpm dlx shadcn@latest add button input label select textarea dialog drawer sheet form card badge separator skeleton toast sonner dropdown-menu tabs table
```

### 5. Criar estrutura de pastas

Conforme `CLAUDE.md` seção 2. Cria os diretórios vazios com `.gitkeep` para os que não terão arquivo ainda:

```bash
mkdir -p src/app/{\(storefront\),admin,api/{checkout/{criar-pagamento,pix},webhooks/{mercadopago,melhor-envio},frete/calcular,cep/[cep],cupom/validar,upload,revalidate}}
mkdir -p src/{components/{ui,storefront,admin,shared},lib/{supabase,mercadopago,melhor-envio,email,analytics,validators,utils},hooks,stores,types}
mkdir -p supabase/{migrations,functions}
mkdir -p public/images
```

### 6. Configurar Supabase

1. Criar projeto em supabase.com (não automatizar — usar UI). Anotar:
   - URL
   - anon key
   - service_role key
   - project_id
2. Instalar CLI: `pnpm add -D supabase`
3. Inicializar: `pnpm supabase init`
4. Link: `pnpm supabase link --project-ref <PROJECT_ID>`
5. **Não rodar migrations agora** (vão no prompt 02).

### 7. Criar `.env.local`

Copiar `.env.example` para `.env.local` e preencher com as credenciais reais que o Diego forneceu. Se algum não tiver ainda, deixe placeholder e marque com `# TODO: pegar com Diego`.

### 8. Configurar Prettier

`.prettierrc.json`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 9. Configurar `next.config.ts`

- Habilitar `images.remotePatterns` para Supabase Storage
- CSP header conforme `docs/SECURITY.md`
- `experimental.serverActions.bodySizeLimit: '5mb'` (uploads)
- `output: 'standalone'` (deploy)

### 10. Setup Sentry

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

Seguir o wizard. Project name: `minivat-ecommerce`.

### 11. Configurar Vercel

- Conectar repo na Vercel (UI, manual)
- Adicionar todas as env vars do `.env.local` no projeto Vercel (Production + Preview)
- Habilitar Vercel Analytics
- Configurar domínio `www.minivatpremium.com.br` (apontar via Cloudflare)

### 12. Configurar Cloudflare

- Apontar `minivatpremium.com.br` para nameservers Cloudflare
- SSL Full Strict
- Page Rule: Always Use HTTPS
- Habilitar WAF Managed Rules

### 13. Testes finais

Criar uma página dummy em `src/app/(storefront)/page.tsx`:

```tsx
export default async function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">MINI VAT PREMIUM</h1>
        <p className="text-muted-foreground mt-2">Em construção</p>
      </div>
    </main>
  )
}
```

Criar layout `src/app/(storefront)/layout.tsx` minimal.

Criar `src/app/api/health/route.ts`:

```ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

### 14. Commit inicial e deploy

```bash
git add .
git commit -m "feat: setup inicial Next.js 15 + Supabase + Vercel"
git push origin main
```

Aguardar deploy Vercel completar. **Validar:**
- [ ] `https://www.minivatpremium.com.br` carrega a página dummy
- [ ] `https://www.minivatpremium.com.br/api/health` retorna `{status: "ok"}`
- [ ] SSL ativo
- [ ] Sentry capturando erros (forçar um erro de teste)

---

## Definition of Done

- [ ] `pnpm dev` roda local sem erros
- [ ] Push pra `main` deploya automático na Vercel
- [ ] Domínio com SSL funcionando
- [ ] Supabase conectado (teste com client browser)
- [ ] Sentry capturando erros (testar com erro forçado)
- [ ] Estrutura de pastas conforme `CLAUDE.md`
- [ ] `.env.local` preenchido (ou placeholders marcados)
- [ ] `README.md` atualizado se necessário

## Não faça neste sprint

- Não criar migrations do banco (Sprint 1)
- Não criar componentes de produto (Sprint 1)
- Não implementar checkout (Sprint 2)
- Não implementar admin (Sprint 3)
- Não decidir sozinho mudar a stack — se algo não rodar, **pare e pergunte**

## Se travar

Pare e pergunte ao Diego. Não invente solução que diverge de `CLAUDE.md` ou `docs/ARCHITECTURE.md`.
