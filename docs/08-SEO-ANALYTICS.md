# 08 — SEO & Analytics

> Responde diretamente às perguntas 3 e 4 do briefing do Vinícius: **"como o SEO funciona?"** e **"como instalar Pixel/GA sem mexer no código?"**. Aqui está o blueprint técnico.

---

## 1. SEO técnico

### 1.1 `generateMetadata` por rota

Toda PDP, listagem, categoria, página institucional e home precisa de metadata declarada com `generateMetadata` do Next.js (App Router).

#### Home

```ts
// src/app/(storefront)/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MINI VAT PREMIUM — Cubetas para impressão 3D odontológica",
  description: "Inventores originais do Mini VAT. Reduza desperdício de resina e acelere suas impressões 3D em odontologia.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MINI VAT PREMIUM",
    description: "Cubetas premium para impressoras 3D odontológicas.",
    url: "https://www.minivatpremium.com.br",
    siteName: "MINI VAT PREMIUM",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og/home.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};
```

#### PDP

```ts
// src/app/(storefront)/produto/[slug]/page.tsx
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.seo_title || `${product.name} | MINI VAT PREMIUM`;
  const description = product.seo_description || product.short_description || "";
  const image = product.primary_image_url || "/og/default.png";

  return {
    title,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title, description,
      url: `https://www.minivatpremium.com.br/produto/${product.slug}`,
      siteName: "MINI VAT PREMIUM",
      locale: "pt_BR",
      type: "website",      // 'product' não é válido pro OG do Next
      images: [{ url: image, width: 1200, height: 1200 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
```

### 1.2 `sitemap.ts` dinâmico

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.minivatpremium.com.br";
  const supa = createServiceClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supa.from("products").select("slug, updated_at").eq("is_active", true).is("deleted_at", null),
    supa.from("categories").select("slug, updated_at").eq("is_active", true).is("deleted_at", null),
  ]);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1.0, lastModified: new Date() },
    { url: `${base}/produtos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/sobre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contato`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/trocas-devolucoes`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const catUrls = (categories ?? []).map(c => ({
    url: `${base}/categoria/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const prodUrls = (products ?? []).map(p => ({
    url: `${base}/produto/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticUrls, ...catUrls, ...prodUrls];
}
```

### 1.3 `robots.ts`

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/conta/", "/checkout/", "/_next/", "/auth/"],
      },
    ],
    sitemap: "https://www.minivatpremium.com.br/sitemap.xml",
    host: "https://www.minivatpremium.com.br",
  };
}
```

### 1.4 Schema markup (JSON-LD)

#### Organization (no layout raiz)

```tsx
// src/components/seo/OrganizationJsonLd.tsx
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MINI VAT PREMIUM",
    url: "https://www.minivatpremium.com.br",
    logo: "https://www.minivatpremium.com.br/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+55-62-99942-9997",
      contactType: "customer service",
      areaServed: "BR",
      availableLanguage: ["Portuguese"],
    },
    sameAs: [
      "https://www.instagram.com/minivatpremium",
      "https://www.youtube.com/@minivatpremium",
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

#### Product (na PDP)

```tsx
// src/components/seo/ProductJsonLd.tsx
export function ProductJsonLd({ product, reviews }: { product: Product; reviews?: Review[] }) {
  const data: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "MINI VAT PREMIUM" },
    image: [product.primary_image_url],
    offers: {
      "@type": "Offer",
      url: `https://www.minivatpremium.com.br/produto/${product.slug}`,
      priceCurrency: "BRL",
      price: (product.price_cents / 100).toFixed(2),
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "MINI VAT PREMIUM" },
    },
  };

  if (reviews && reviews.length) {
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: reviews.length,
    };
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

#### BreadcrumbList

```tsx
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `https://www.minivatpremium.com.br${it.url}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

#### FAQPage (na home ou em página de FAQ)

```tsx
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
```

### 1.5 OpenGraph image dinâmica

```tsx
// src/app/produto/[slug]/opengraph-image.tsx
import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function og({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex",
        flexDirection: "column", justifyContent: "center", alignItems: "center",
        background: "linear-gradient(135deg, #0f172a, #334155)", color: "white",
        fontFamily: "Inter", padding: 80,
      }}>
        <div style={{ fontSize: 32, opacity: 0.7 }}>MINI VAT PREMIUM</div>
        <div style={{ fontSize: 72, fontWeight: 700, textAlign: "center", marginTop: 24 }}>
          {product?.name}
        </div>
        <div style={{ fontSize: 48, marginTop: 24 }}>
          R$ {((product?.price_cents ?? 0) / 100).toFixed(2)}
        </div>
      </div>
    ),
    size
  );
}
```

### 1.6 URLs amigáveis

- Produto: `/produto/mini-vat-premium-inox`
- Categoria: `/categoria/mini-vat`
- Slug em `lowercase`, sem acento, separado por `-`. Gerar com `slugify` no admin.
- Histórico: tabela `redirects (from_path, to_path)` para 301 se um produto mudar de slug (Fase 2).

### 1.7 Core Web Vitals (metas)

| Métrica | Meta mobile |
|---|---|
| **LCP** (Largest Contentful Paint) | < 1.8 s |
| **INP** (Interaction to Next Paint) | < 200 ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 |
| **TTFB** | < 600 ms |

#### Para atingir

- `next/image` em todas as imagens com `priority` no LCP (imagem principal da PDP).
- `next/font` para Inter + Fraunces (auto-self-host).
- `loading="lazy"` por padrão; `fetchPriority="high"` no LCP.
- Server Components para tudo que não precisa de interatividade.
- Edge runtime nas rotas leves (`/api/cep/[cep]`, `og:image`).
- Skeleton em vez de spinner para evitar CLS.
- Reservar `aspect-ratio` na imagem do card pra não dar shift.

### 1.8 Acessibilidade (WCAG AA, indiretamente SEO)

- Contraste mínimo 4.5:1.
- `alt` em toda imagem (admin obriga).
- Labels visíveis em todo input.
- Foco visível (não remover outline sem substituto).
- Hierarquia `h1`/`h2`/`h3` correta.
- Landmarks (`header`, `main`, `nav`, `footer`).

### 1.9 Google Search Console

Após o deploy:

1. Adicionar propriedade.
2. Validar via DNS (Cloudflare TXT).
3. Enviar `https://www.minivatpremium.com.br/sitemap.xml`.
4. Acompanhar cobertura e Core Web Vitals.

### 1.10 Google Merchant Center

Para Shopping Ads e listagem grátis no Google. Fase 1.5:

- Conta MC.
- Feed via `https://www.minivatpremium.com.br/feeds/products.xml` (Next.js API).
- Atributos obrigatórios: `id`, `title`, `description`, `link`, `image_link`, `price`, `availability`, `brand`, `gtin` (se houver), `condition`.

---

## 2. Analytics — GTM + GA4 + Meta Pixel

### 2.1 Por que GTM como camada

O Vinícius perguntou se ele consegue colocar Pixel/GA sozinho. Resposta: **uma única tag GTM no código** → todas as outras tags (Pixel, GA, conversões, Ads) ele instala pelo painel do GTM sem precisar de dev. É a separação certa entre código e marketing.

### 2.2 Variáveis de ambiente

```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Quando vazio, o componente não monta nada (`if (!id) return null`).

### 2.3 dataLayer — eventos padrão GA4 Enhanced Ecommerce

Disparar em todos os pontos do funil:

| Evento | Quando | Payload essencial |
|---|---|---|
| `view_item_list` | abrir listagem | `item_list_name`, `items[]` |
| `view_item` | abrir PDP | `currency`, `value`, `items[]` |
| `select_item` | clicar em produto na lista | `item_list_name`, `items[]` |
| `add_to_cart` | botão "Comprar" | `currency`, `value`, `items[]` |
| `remove_from_cart` | tirar do carrinho | igual |
| `view_cart` | abrir drawer/página de carrinho | `currency`, `value`, `items[]` |
| `begin_checkout` | entrar no checkout | `currency`, `value`, `items[]`, `coupon?` |
| `add_shipping_info` | escolher frete | + `shipping_tier` |
| `add_payment_info` | escolher método | + `payment_type` |
| `purchase` | webhook aprovado | `transaction_id`, `currency`, `value`, `shipping`, `tax`, `items[]` |
| `search` | submeter busca | `search_term` |
| `sign_up` | criar conta | `method` |
| `login` | login | `method` |
| `view_promotion` | banner visível | `promotion_id`, `creative_name` |
| `select_promotion` | clicar banner | mesmo |
| `lead` | newsletter | `value` (0) |

### 2.4 Item canonical

```ts
type GAItem = {
  item_id: string;        // sku
  item_name: string;
  item_brand: "MINI VAT PREMIUM";
  item_category?: string;
  item_variant?: string;
  price: number;          // em reais (não centavos)
  quantity: number;
};
```

### 2.5 Disparo do `purchase` (crítico — server-driven)

`purchase` precisa disparar **uma única vez** quando o pagamento é confirmado. Risco: cliente recarrega a página de sucesso e dispara de novo, contaminando relatórios.

Solução:

1. Webhook do MP confirma → grava `orders.tracking_pushed_at` no banco quando ainda for `null`.
2. Página `/checkout/sucesso/[order_number]` busca o pedido server-side.
3. Componente client recebe `shouldTrack: tracking_pushed_at === null` e dispara `purchase` + chama `/api/orders/[id]/mark-tracked` para setar o flag (idempotente).

```tsx
// src/app/(storefront)/checkout/sucesso/[order_number]/page.tsx
export default async function Success({ params }: { params: Promise<{ order_number: string }> }) {
  const { order_number } = await params;
  const order = await getOrderByNumber(order_number);  // server-side, valida ownership
  return (
    <>
      <SuccessUI order={order} />
      {!order.tracking_pushed_at && <PurchaseTrack order={order} />}
    </>
  );
}
```

```tsx
// PurchaseTrack.tsx (client)
"use client";
import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics/events";

export function PurchaseTrack({ order }: { order: Order }) {
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/orders/${order.id}/mark-tracked`, { method: "POST" });
      if (r.ok) {
        trackPurchase(
          order.order_number,
          order.items.map(it => ({
            item_id: it.product_sku,
            item_name: it.product_name,
            item_brand: "MINI VAT PREMIUM",
            price: it.unit_price_cents / 100,
            quantity: it.quantity,
          })),
          order.total_cents / 100,
          order.shipping_cents / 100,
        );
      }
    })();
  }, [order.id]);
  return null;
}
```

### 2.6 Search Console + GA4 ligação

No GA4 → Admin → Product Links → Search Console Links. Permite ver queries de pesquisa direto no GA4.

### 2.7 Meta Pixel (CAPI Fase 2)

Fase 1: Pixel via GTM client-side (eventos `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`).

Fase 2: **Conversion API** (CAPI) server-side disparado do webhook do Mercado Pago. Aumenta match rate e resiste a bloqueadores. Implementar como worker que consome eventos pendentes da fila do Supabase.

### 2.8 Hotjar / Microsoft Clarity (opcional)

Instalado via GTM pelo cliente. Heatmap + session recording — útil pra entender abandono no checkout. Recomendar Clarity (grátis ilimitado).

### 2.9 Validação

- **Tag Assistant** (Chrome extension) — verificar que cada evento dispara com payload correto.
- **GTM Preview Mode** — passo a passo do funil.
- **GA4 DebugView** — ver eventos em tempo real.
- **Rich Results Test** (Google) — validar JSON-LD.
- **Schema Markup Validator** (schema.org).

---

## 3. Performance — checklist técnico

- [ ] `<Image priority>` no LCP da home e da PDP
- [ ] `<Image sizes>` corretas (não buscar 1200px no mobile)
- [ ] Fonts via `next/font` com `display: swap`
- [ ] Server Components em todo lugar que não precisa interatividade
- [ ] `revalidate: 60` na home, `revalidate: 300` na PDP (ISR)
- [ ] `dynamic = "force-dynamic"` só onde for realmente necessário
- [ ] Bundle analyzer rodado e analisado (`pnpm dlx @next/bundle-analyzer`)
- [ ] Lighthouse mobile ≥ 90 em Performance, SEO e Best Practices
- [ ] CLS < 0.1 medido em campo (Vercel Analytics)
- [ ] Imagens em AVIF (Next converte automático)
- [ ] Lazy load do React-Email/preview no admin
- [ ] Tailwind purge correto (`content` em `tailwind.config.ts`)
- [ ] Sem `unsafe-eval` em produção (CSP)
- [ ] Sem console.log em produção (`next.config` `compiler.removeConsole`)
- [ ] Service worker / PWA — Fase 2

---

## 4. Marketing — fluxos integrados

### 4.1 Recuperação de carrinho abandonado (Fase 2)

- Captura email no checkout etapa 1.
- Cron a cada hora: pedidos `pending` há > 1 h sem `paid_at` → e-mail 1 (lembrete).
- 24 h: e-mail 2 (cupom 5%).
- 72 h: e-mail 3 (última chance).

### 4.2 Pós-venda

- Pagamento aprovado → e-mail "obrigado" + WhatsApp (Fase 2 via Evolution).
- Despacho → e-mail com rastreio + WhatsApp.
- Entregue → e-mail "como foi sua experiência?" pedindo review (com link único `/avaliar?token=...`).

### 4.3 Newsletter

- Captura no footer + popup com cupom 5% off (Fase 2).
- `newsletter_subscribers` no banco.
- Envio via Resend Broadcast (Fase 2).

### 4.4 UTM

Persistir `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` em cookie de sessão por 30 dias e gravar no pedido (`orders.utm_*` JSON). Permite atribuição mesmo após múltiplas sessões.

### 4.5 Programa de afiliados (Fase 2)

- Link `?ref=CODIGO` cria cookie 30 dias.
- Pedido finalizado → registra `affiliate_commissions`.
- Painel do afiliado em `/afiliado`.

---

## 5. Resumo: o que entregar na Fase 1

- `generateMetadata` em todas as rotas
- `sitemap.ts` + `robots.ts`
- JSON-LD Organization, Product, Breadcrumb, FAQ
- OG image dinâmica no produto
- URLs amigáveis
- Lighthouse ≥ 90 mobile
- GTM com Consent Mode v2
- Helper `track()` + todos os eventos GA4 Ecommerce
- `purchase` server-driven (idempotente)
- Search Console + sitemap submetido
- Política de Privacidade + cookies por categoria
