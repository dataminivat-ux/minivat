# Prompt 02 — Database schema (Sprint 0, parte 2)

> Cole este prompt **após** ter completado o `prompt 01-setup-inicial.md` e ter o Supabase conectado.

---

## Sua missão

Aplicar o schema completo do banco no Supabase: tabelas, enums, índices, triggers, RLS policies, views, functions e seeds iniciais.

**Leia primeiro:**
- `CLAUDE.md` (regras de segurança)
- `docs/DATABASE.md` (schema completo SQL + diagrama lógico)
- `docs/SECURITY.md` (LGPD, RLS)

---

## Tarefas

### 1. Criar migration inicial

Crie o arquivo `supabase/migrations/0001_initial_schema.sql` com **exatamente** o SQL listado em `docs/DATABASE.md` seção 3.

> Não modifique. O schema foi pensado pra escalar e cobrir todos os requisitos do PRD.

### 2. Criar seed

Crie `supabase/seed.sql` com o conteúdo de `docs/DATABASE.md` seção 4.

### 3. Aplicar migration no Supabase

```bash
pnpm supabase db push
```

Se der erro, **NÃO crie work-around**. Cole o erro e pergunte ao Diego.

### 4. Aplicar seed

```bash
pnpm supabase db seed
```

Ou copiar e colar `seed.sql` no SQL Editor do Supabase Dashboard.

### 5. Gerar tipos TypeScript

```bash
pnpm supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/lib/supabase/types.ts
```

Confirme que o arquivo `src/lib/supabase/types.ts` foi gerado e tem todas as tabelas.

### 6. Criar clientes Supabase

#### `src/lib/supabase/client.ts` (browser)
```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### `src/lib/supabase/server.ts` (server components, RSC, server actions)
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* called from Server Component */ }
        },
      },
    }
  )
}
```

#### `src/lib/supabase/admin.ts` (service_role — NUNCA importar no client)
```ts
import 'server-only'  // ← IMPORTANTE: previne import no client
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
```

### 7. Validar RLS

Conectar no SQL Editor do Supabase e rodar:

```sql
-- Deve retornar VAZIO (todas as tabelas com RLS)
select tablename from pg_tables
where rowsecurity = false and schemaname = 'public';
```

Se retornar alguma tabela, **NÃO prossiga** até resolver. Investigue qual tabela ficou sem RLS e habilite.

### 8. Criar buckets de Storage

No Supabase Dashboard → Storage:

| Bucket | Public | Policy |
|---|---|---|
| `products` | sim | read público; write admin |
| `banners` | sim | read público; write admin |
| `categories` | sim | read público; write admin |
| `private` | não | read autenticado; write admin |

Policies via SQL (Dashboard → Storage → policies):

```sql
-- products bucket — público para read
create policy "products_public_read" on storage.objects
for select using (bucket_id = 'products');

create policy "products_admin_write" on storage.objects
for insert with check (bucket_id = 'products' and is_admin());

create policy "products_admin_update" on storage.objects
for update using (bucket_id = 'products' and is_admin());

create policy "products_admin_delete" on storage.objects
for delete using (bucket_id = 'products' and is_admin());
```

Replicar pra `banners`, `categories`, `private`.

### 9. Promover Vinícius (e Diego) a admin

No SQL Editor:

```sql
-- Cria o profile (caso o usuário ainda não tenha entrado no site)
insert into profiles (id, full_name, is_admin)
select id, raw_user_meta_data->>'full_name', true
from auth.users
where email in ('vst2002@gmail.com', 'diego@sevynlabs.com')
on conflict (id) do update set is_admin = true;
```

(Os usuários precisam existir em `auth.users` antes — vão ser criados quando fizerem o primeiro login. Esse SQL pode ser rodado depois.)

### 10. Teste de leitura no app

Editar `src/app/(storefront)/page.tsx` para validar conexão:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('is_active', true)

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">MINI VAT PREMIUM</h1>
      <h2 className="mt-8 text-2xl">Categorias seedadas:</h2>
      <ul className="mt-4">
        {categories?.map(c => <li key={c.slug}>{c.name}</li>)}
      </ul>
      {error && <p className="text-red-500">{error.message}</p>}
    </main>
  )
}
```

Rodar `pnpm dev` e validar que aparecem: Mini VATs, Mesas de Impressão, Acessórios, Resinas.

---

## Definition of Done

- [ ] Migration aplicada sem erros
- [ ] Seed aplicado
- [ ] Tipos gerados em `src/lib/supabase/types.ts`
- [ ] Clients criados (browser, server, admin)
- [ ] RLS ativo em todas as tabelas (query de validação retorna vazio)
- [ ] Storage buckets criados com policies
- [ ] Home dummy mostra categorias do seed
- [ ] Tipo `Database` exportado e usado nos clients

## Pegadinhas comuns

- **Erro "permission denied for table X":** RLS ativo mas sem policy. Cheque se a tabela tem policy.
- **`is_admin()` retornando sempre false:** confira se o usuário tem `is_admin = true` no profile.
- **`auth.uid()` retornando null no SQL Editor:** normal — você está logado como `postgres`, não como usuário do app.
- **Service role aparecendo no bundle do client:** procure `import` direto de `admin.ts` em arquivos `'use client'`. Mate.

## Não faça

- Não modifique o schema sem alinhar com Diego
- Não suba migration alternativa
- Não desabilite RLS "só pra testar" (esqueceu = vazamento)
