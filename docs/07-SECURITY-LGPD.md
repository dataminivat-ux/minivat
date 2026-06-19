# 07 — Security & LGPD

> Segurança aqui é **defense in depth**: Cloudflare na borda → Vercel/Next.js → middleware → RLS no banco. Cada camada falha sozinha sem expor o restante.

---

## 1. Modelo de ameaças (resumo)

| Ameaça | Camada de defesa |
|---|---|
| DDoS, scraping agressivo | Cloudflare WAF + rate limit |
| SQL injection | Supabase parametrizado + Zod no input |
| XSS | React escape default + CSP estrito |
| CSRF | Same-site cookies + Server Actions (next CSRF token) |
| Vazamento de PII | RLS + service role só server-side + logs sem PII |
| Cobrança fraudulenta | Mercado Pago antifraude + idempotency key + recalcular total no servidor |
| Estoque negativo | Update com `where stock >= qty` + transação |
| Cupom mal-usado | RPC `validate_coupon` valida no servidor (não confiar no client) |
| Webhook falsificado | Verificação HMAC do x-signature do Mercado Pago |
| Brute force login | Rate limit Upstash + lockout temporário no Supabase Auth |
| Conta admin comprometida | Whitelist por email + flag `is_admin` + 2FA na Fase 2 |

---

## 2. Cloudflare (borda)

- **DNS** authoritative no Cloudflare.
- **SSL/TLS** Full (strict). Certificate Authority recomendada: Cloudflare Universal SSL + emissão automática Vercel.
- **HSTS** habilitado (max-age 31536000, includeSubDomains, preload).
- **WAF Managed Rules** ativadas (Cloudflare Free dá Free Managed Ruleset).
- **Bot Fight Mode** ativado.
- **Rate Limit Rules** (Free dá 1 regra):
  - `/api/checkout/*` → 30 req/min/IP
- **Page Rules** ou **Transform Rules**:
  - Sempre HTTPS
  - Cache `/_next/static/*` por 30 dias
  - Sem cache em `/api/*`

---

## 3. Vercel / Next.js

### 3.1 Headers de segurança

```ts
// next.config.ts
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
];

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://www.googletagmanager.com
    https://www.google-analytics.com
    https://connect.facebook.net
    https://sdk.mercadopago.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self'
    https://*.supabase.co
    wss://*.supabase.co
    https://api.mercadopago.com
    https://www.melhorenvio.com.br
    https://sandbox.melhorenvio.com.br
    https://viacep.com.br
    https://www.google-analytics.com
    https://*.ingest.sentry.io;
  frame-src 'self' https://www.mercadopago.com.br https://www.googletagmanager.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, " ").trim();

export default {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};
```

### 3.2 Middleware (proteção `/admin/*`)

```ts
// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/admin")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookies) => cookies.forEach(c => res.cookies.set(c.name, c.value, c.options)),
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/entrar?next=" + req.nextUrl.pathname, req.url));

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

### 3.3 Validação com Zod (sempre no servidor)

> Regra: **toda** rota `/api/*` e **toda** Server Action começa com `schema.parse(input)`. Sem exceção.

```ts
const Body = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(72),
});
const data = Body.parse(await req.json());
```

### 3.4 Rate limit aplicacional (Upstash)

```ts
// src/lib/security/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const limiters = {
  checkout: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "10 m") }),
  shipping: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "1 m") }),
  coupon:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m") }),
  auth:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  "10 m") }),
  newsletter: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 h") }),
};

export async function enforce(name: keyof typeof limiters, key: string) {
  const { success, reset, remaining } = await limiters[name].limit(key);
  if (!success) {
    throw new Response("Too Many Requests", { status: 429, headers: { "Retry-After": String(reset) } });
  }
  return { remaining };
}
```

Chave: `ip:${ip}` para anônimo, `user:${uid}` para logado.

---

## 4. Supabase — RLS e Service Role

### 4.1 Princípios

- **Anon key** está exposta no client — depende 100% das RLS.
- **Service role key** **nunca** vai pro client. Só em código server-side (`/src/lib/supabase/service.ts` que importa de `server-only`).
- Helper `is_admin()` no banco padroniza checagem de papel.

```ts
// src/lib/supabase/service.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

### 4.2 Auth do cliente

- E-mail + senha (Supabase Auth nativo).
- Magic link.
- Google OAuth opcional Fase 2.
- Confirmação de e-mail obrigatória antes de poder comprar como `customer` registrado (guest checkout permitido sem cadastro).
- Reset de senha por e-mail.
- Senha mínima: 8 chars (Supabase configurável).
- Lockout: Supabase Auth tem brute-force protection built-in; Upstash dá camada extra.

### 4.3 Auth do admin

Fase 1:
- Whitelist por e-mail (`ADMIN_EMAILS=vst2002@gmail.com,diego@sevynlabs.com,...`) no signup → `role = 'admin'`.
- Função `is_admin()` no banco confere papel.
- Sessão pelo mesmo Supabase Auth.

Fase 2:
- 2FA TOTP (Supabase suporta nativo).
- IP allowlist opcional via Cloudflare.

---

## 5. Pagamentos — segurança

1. **Tokenização do cartão** acontece no browser via `MercadoPago.js`. O servidor **nunca** recebe PAN, CVV, expiry.
2. **`idempotencyKey` = `order.id`** em `payment.create` previne cobrança dupla.
3. **Recalcular o total no servidor** antes de criar o pagamento. Cliente envia `order_id`, servidor busca `orders.total_cents` e usa esse valor.
4. **Webhook com HMAC** (`x-signature` validado contra `MERCADOPAGO_WEBHOOK_SECRET`).
5. **Re-consultar** o pagamento via `payment.get(id)` antes de confiar no payload.
6. **Não logar** `gateway_payload` completo no Sentry (filtrar `card`, `payer.identification`).

---

## 6. Estoque — segurança

```sql
update public.product_variants
   set stock = stock - $qty
 where id = $variant_id
   and stock >= $qty
returning id;
```

Se 0 linhas retornaram, abortar a transação. Tudo dentro de uma transação SQL (chamada via RPC para garantir atomicidade).

---

## 7. Uploads (Supabase Storage)

- Bucket `products` privado por padrão; URLs de leitura geradas com `createSignedUrl(60 * 60 * 24 * 7)` (7 dias).
- Validar `mime` no servidor (`image/jpeg`, `image/png`, `image/webp`, `image/avif`).
- Limite de tamanho 5 MB.
- Bucket `private` (notas fiscais, etc.) com policy `is_admin()` só.

---

## 8. Logs e auditoria

- **Sentry** captura erros server-side e client-side.
- **`beforeSend`** remove campos sensíveis (senha, cartão, CPF, qr_code).
- **Banco**: trigger `log_order_status_change` registra mudança de status com `changed_by`.
- **Sentry breadcrumbs** desligados para rotas de pagamento.
- **`order_status_history`** + `payments.gateway_payload` (sanitizado) bastam para auditoria fiscal.

---

## 9. LGPD

### 9.1 Bases legais

| Dado | Base legal | Finalidade |
|---|---|---|
| E-mail, nome, CPF, telefone | Execução de contrato | Concluir o pedido, emitir NF, entregar |
| Endereço | Execução de contrato | Entrega |
| Dados de pagamento | Execução de contrato + obrigação legal | Cobrar, fiscal |
| Cookies analytics (GA4) | Consentimento | Métricas |
| Cookies marketing (Pixel, Ads) | Consentimento | Remarketing |
| Newsletter | Consentimento | Comunicação |
| Histórico de navegação | Legítimo interesse + consentimento | Personalização |

### 9.2 Direitos do titular

Endpoints/UI obrigatórios em `/conta`:

- **Acesso** — exportar JSON com perfil, endereços, pedidos, reviews, wishlist.
- **Correção** — editar perfil e endereços.
- **Exclusão** — botão "Excluir minha conta". Implementação:
  - Anonimizar `profiles` (`email = 'deleted-{id}@minivatpremium.local'`, `full_name = null`, `cpf = null`, `phone = null`).
  - Manter pedidos (obrigação fiscal 5 anos).
  - Apagar endereços, wishlist, reviews.
- **Portabilidade** — mesmo endpoint do acesso (JSON).
- **Revogar consentimento** — botão no banner + página `/privacidade` (revoga GA, Pixel).
- **Reclamação** — link pra ANPD.

### 9.3 Banner de consentimento (Consent Mode v2)

```tsx
// src/components/consent/CookieBanner.tsx
"use client";
import { useEffect, useState } from "react";

type Choice = { analytics: boolean; marketing: boolean };
const KEY = "mvp.consent.v1";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!localStorage.getItem(KEY)) setOpen(true); }, []);

  const apply = (choice: Choice) => {
    localStorage.setItem(KEY, JSON.stringify({ ...choice, ts: Date.now() }));
    (window as any).gtag?.("consent", "update", {
      analytics_storage: choice.analytics ? "granted" : "denied",
      ad_storage: choice.marketing ? "granted" : "denied",
      ad_user_data: choice.marketing ? "granted" : "denied",
      ad_personalization: choice.marketing ? "granted" : "denied",
    });
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-label="Aviso de cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5">
      <p className="text-sm">
        Usamos cookies para melhorar sua experiência, analisar uso e personalizar anúncios.
        Veja nossa <a href="/privacidade" className="underline">Política de Privacidade</a>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 justify-end">
        <button onClick={() => apply({ analytics: false, marketing: false })}
                className="px-4 py-2 rounded-lg border">Somente necessários</button>
        <button onClick={() => apply({ analytics: true, marketing: false })}
                className="px-4 py-2 rounded-lg border">Aceitar análise</button>
        <button onClick={() => apply({ analytics: true, marketing: true })}
                className="px-4 py-2 rounded-lg bg-black text-white">Aceitar tudo</button>
      </div>
    </div>
  );
}
```

### 9.4 Página de Privacidade obrigatória

`/privacidade` precisa conter (gerar versão a partir do CLAUDE.md, validar com Vinícius):

- Identificação do controlador (Vinícius / MINI VAT PREMIUM CNPJ XXX).
- DPO (encarregado): `dpo@minivatpremium.com.br` (criar caixa).
- Dados coletados e finalidade.
- Bases legais.
- Sub-processadores (lista da seção 10).
- Período de retenção.
- Como exercer direitos.
- Cookies (categorias).
- Mudanças na política.
- Foro.

### 9.5 Termos de uso

`/termos` com regras de uso, política de trocas, foro, lei aplicável.

### 9.6 Retenção

| Dado | Retenção |
|---|---|
| Pedidos + NF | 5 anos (fiscal) |
| Pagamentos | 5 anos |
| Perfil ativo | enquanto a conta existir |
| Perfil excluído (anonimizado) | indefinido (sem PII) |
| Logs de erro (Sentry) | 90 dias |
| Cache de cotação | 5 min |
| Cookies sessão | até logout |
| Cookies analytics | 2 anos |
| Cookies marketing | conforme cada plataforma (até 13 meses) |

---

## 10. Sub-processadores (mencionar na Política de Privacidade)

| Sub-processador | Função | Localização | Política |
|---|---|---|---|
| Supabase (AWS São Paulo) | Banco + Auth + Storage | BR + US | supabase.com/privacy |
| Vercel | Hospedagem | US | vercel.com/legal/privacy-policy |
| Cloudflare | DNS, WAF, CDN | Global | cloudflare.com/privacypolicy |
| Mercado Pago | Pagamentos | BR | mercadopago.com.br/privacidade |
| Melhor Envio | Frete | BR | melhorenvio.com.br/politica-de-privacidade |
| Resend | E-mail transacional | US | resend.com/legal/privacy-policy |
| Google (GTM + GA4) | Analytics | US | policies.google.com/privacy |
| Meta (Pixel) | Anúncios | US | facebook.com/privacy/policy |
| Sentry | Erros | US | sentry.io/privacy |
| Upstash | Rate limit | US | upstash.com/privacy |

---

## 11. Backup e DR

- **Supabase Pro** faz backup diário com **PITR 7 dias** (point-in-time recovery).
- **Storage**: snapshots semanais via cron Vercel exportando para bucket cross-region (Fase 2).
- **Disaster Recovery RPO**: 24 h. **RTO**: 4 h.
- Runbook em `/docs/13-DEPLOYMENT.md`.

---

## 12. Checklist pré go-live

- [ ] Todas as tabelas com `enable row level security` (rodar `select tablename from pg_tables where rowsecurity = false and schemaname='public'` — deve retornar vazio)
- [ ] Service role key não aparece em nenhum bundle do client (`grep -r SUPABASE_SERVICE_ROLE_KEY .next/static` deve retornar vazio)
- [ ] CSP testada sem violar (Sentry CSP reports configurado)
- [ ] HSTS preload registrado em hstspreload.org
- [ ] Webhook do MP testado com payload assinado e payload falsificado (assinatura inválida → 401)
- [ ] Idempotência testada: duas POSTs idênticos em `criar-pagamento` → uma cobrança
- [ ] Cupom esgotado não aplica (`usage_limit` respeitado)
- [ ] Estoque não vai negativo (teste concorrente: 2 compras simultâneas com estoque 1)
- [ ] Rate limit Upstash respondendo 429 ao estourar
- [ ] Banner LGPD bloqueando GA/Pixel até consent
- [ ] Página de privacidade, termos, trocas publicadas e linkadas no footer
- [ ] Conta DPO criada (`dpo@minivatpremium.com.br`)
- [ ] Botão "Excluir minha conta" funciona e anonimiza
- [ ] Botão "Exportar meus dados" entrega JSON
- [ ] Logs do Sentry sem PII (testar com pedido teste)
- [ ] Domínio com SSL A+ no SSL Labs
- [ ] DNS no Cloudflare com DNSSEC ativado
- [ ] Pelo menos 1 admin com `role = 'admin'` no banco
- [ ] Backup do Supabase rodando (verificar no painel)
- [ ] `.env.local` e `.env.production` separados, sem segredos no repo (`git secret-scan`)
