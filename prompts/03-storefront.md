# Prompt 03 — Storefront público (Sprint 1)

> Cole no Claude Code após prompts 01 e 02 estarem completos. Tempo: 5-7 dias.

---

## Sua missão

Construir toda a parte pública navegável do site: home, listagem, PDP, busca, carrinho. **Ainda não checkout (Sprint 2).**

**Leia primeiro:**
- `CLAUDE.md` (estrutura, convenções, regras)
- `docs/PRD.md` seções 5 (escopo loja pública), 7 (catálogo)
- `docs/ARCHITECTURE.md` seções 3-5 (RSC, cache, Server Actions)
- `docs/SEO-MARKETING.md` (meta tags, schema, performance)
- `docs/SPRINTS.md` (Sprint 1 DoD)

---

## Ordem de execução

### 1. Layout base e componentes globais

**Header** (`src/components/storefront/header.tsx`)
- Logo (placeholder — vetorizar depois)
- Busca (input com debounce → navega para `/busca?q=...`)
- Menu desktop (categorias do banco)
- Drawer mobile
- Ícone carrinho com badge de contagem
- Login/Cadastro ou menu de usuário (se logado)

**Footer** (`src/components/storefront/footer.tsx`)
- Newsletter signup (form chamando Server Action que insere em `newsletter_subscribers`)
- Links institucionais
- Redes sociais (vindas de `site_settings.social_links`)
- Copyright + DPO

**Layout** (`src/app/(storefront)/layout.tsx`)
- GTM script (`<GTMScript />` + `<GTMNoScript />`)
- Header
- `<main>{children}</main>`
- Footer
- Banner LGPD (`<CookieBanner />`)
- Sonner toast

### 2. Carrinho (Zustand store)

`src/stores/cart-store.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  variant_id: string
  product_id: string
  sku: string
  product_name: string
  variant_name: string | null
  thumbnail_url: string | null
  price_cents: number
  quantity: number
  weight_g: number | null
  slug: string
  attributes: Record<string, string>
}

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variant_id: string) => void
  updateQuantity: (variant_id: string, qty: number) => void
  clear: () => void
  getSubtotalCents: () => number
  getTotalQuantity: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variant_id === item.variant_id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variant_id === item.variant_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (variant_id) =>
        set((state) => ({ items: state.items.filter((i) => i.variant_id !== variant_id) })),
      updateQuantity: (variant_id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variant_id === variant_id ? { ...i, quantity: Math.max(1, qty) } : i
          ),
        })),
      clear: () => set({ items: [] }),
      getSubtotalCents: () =>
        get().items.reduce((acc, i) => acc + i.price_cents * i.quantity, 0),
      getTotalQuantity: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    { name: 'mvp-cart-v1' }
  )
)
```

**Drawer** (`src/components/storefront/cart-drawer.tsx`) com a lista, qty editor, subtotal, botão "Finalizar compra".
**Página** `/carrinho/page.tsx` com mesmas informações em layout mais largo.

### 3. Home (`/page.tsx`)

Server Component, `revalidate: 3600`:

- Hero rotativo (banners ativos do banco, `<HeroBanner />`)
- Seção "Produtos em destaque" (4-8 produtos `is_featured = true`)
- Seção "Categorias" (com imagens)
- Seção "Depoimentos" (reviews aprovadas em destaque, opcional Fase 1)
- CTA newsletter

### 4. Listagem (`/produtos/page.tsx` e `/categorias/[slug]/page.tsx`)

- Server Component
- Filtros via search params (`?categoria=...&min=&max=&em_estoque=`)
- Ordenação (`?ordenar=preco_asc|preco_desc|mais_recentes|relevancia`)
- Grid responsivo (2/3/4 col)
- Card de produto reutilizável (`<ProductCard />`)
- Paginação ou load more (paginação server-side)
- Empty state

### 5. PDP (`/produtos/[slug]/page.tsx`)

- Server Component
- `generateMetadata` com meta_title, OG, etc.
- `<ProductJsonLd />` schema markup (ver `docs/SEO-MARKETING.md` 1.4)
- `<ProductGallery />` (carousel responsivo, zoom on hover)
- Nome, breadcrumb, marca, rating
- Seletor de variação (componente client interativo)
- Preço (R$ X,XX em destaque + parcelamento + "compare-at" se houver)
- Estoque (badge "Em estoque" / "Esgotado" / "Últimas X unidades")
- Calculadora de frete inline (`<ShippingCalculator />`)
- Botões "Adicionar ao carrinho" + "Favoritar"
- Tabs: descrição rica, especificações técnicas (tabela), avaliações, FAQ
- `<RelatedProducts />` (mesma categoria, exclui o atual)
- Sticky bar no mobile com preço + botão comprar

### 6. Busca (`/busca/page.tsx`)

Server Component que usa Postgres FTS:

```ts
const { data } = await supabase
  .from('products')
  .select('*, product_variants(price_cents, stock_quantity)')
  .textSearch('name', query, { type: 'websearch', config: 'portuguese' })
  .eq('is_active', true)
  .limit(50)
```

Mostra resultados com mesmo `<ProductCard />`.

### 7. Páginas institucionais

Rotas estáticas em `(storefront)/institucional/`:
- `/sobre` (lê `site_settings.about_text`)
- `/contato` (form que envia email via Resend)
- `/frete` (lê `site_settings.shipping_policy_md`)
- `/trocas-devolucoes` (lê `site_settings.return_policy_md`)
- `/privacidade` (lê `site_settings.privacy_policy_md`)
- `/termos` (lê `site_settings.terms_md`)
- `/faq` (hardcoded inicialmente, depois mover pra tabela `faqs` se virar volume)

Usar `react-markdown` para renderizar Markdown vindo do banco.

### 8. SEO básico

- `src/app/sitemap.ts` (dinâmico, ver `docs/SEO-MARKETING.md` 1.2)
- `src/app/robots.ts` (`docs/SEO-MARKETING.md` 1.3)
- `generateMetadata` em todas as páginas relevantes
- Schema markup `Product`, `BreadcrumbList`, `Organization`
- `opengraph-image.tsx` na home e nas PDPs

### 9. Banner LGPD (Cookie Consent)

`src/components/shared/cookie-banner.tsx`:
- Aparece no primeiro acesso
- Botões "Aceitar todos" / "Apenas necessários" / "Personalizar"
- Salva escolha em cookie `lgpd_consent` (1 ano) + `localStorage`
- Chama `gtag('consent', 'update', ...)` conforme escolha
- Link pra `/privacidade`

### 10. Componente Analytics

`src/components/shared/analytics.tsx`:
- `<GTMScript />` e `<GTMNoScript />` (ver `docs/INTEGRATIONS.md` 4)
- Hook `useGTMEvent` para disparar eventos

### 11. Eventos de tracking nos pontos certos

Conforme `docs/INTEGRATIONS.md` seção 4 (eventos GA4 e-commerce):
- `view_item` na PDP (em `useEffect` no client component)
- `view_item_list` na listagem
- `select_item` no click do card
- `add_to_cart` ao adicionar
- `view_cart` ao abrir drawer ou página de carrinho
- `search` na busca

### 12. Loading e erro

- `loading.tsx` em cada rota relevante com skeletons
- `error.tsx` global e por rota crítica
- `not-found.tsx` customizada com produtos sugeridos
- Página 500 customizada

---

## Definition of Done

- [ ] Visitor consegue: navegar home → categoria → PDP → carrinho
- [ ] Cart persiste no localStorage
- [ ] Busca funciona
- [ ] Páginas institucionais carregam conteúdo do banco
- [ ] Banner LGPD funcional com Consent Mode v2
- [ ] Sitemap dinâmico acessível
- [ ] Schema markup validado em https://search.google.com/test/rich-results
- [ ] Lighthouse mobile > 85 (chegamos a 90 no Sprint 5)
- [ ] Sem erros no console
- [ ] Sem `'use client'` em páginas sem necessidade
- [ ] Eventos GA4 disparando (validar em GTM Preview)

## Pegadinhas

- **PDP precisa ser SSR (não SSG):** porque preço/estoque podem mudar e tem ISR
- **Imagens:** sempre `next/image` com `sizes`. Sem isso, LCP explode.
- **Filtros na listagem:** mantenha como URL search params (não estado React) — permite share, back/forward, SEO
- **Calculadora de frete inline:** chama endpoint que ainda não existe (Sprint 2). Por enquanto, mock que retorna fake "PAC - R$ 15 - 7 dias"
- **Variações:** lembre que `product_variants` é a fonte de preço e estoque, não `products`
