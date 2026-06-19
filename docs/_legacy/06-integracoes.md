# Prompt 06 — Integrações finais, SEO e polimento (Sprint 5)

> Cole no Claude Code após Sprints 1, 2, 3 e 4 completos. Tempo: 3-5 dias. Este é o sprint de **pré go-live**: finalizar GTM, schema markup, sitemap, SEO técnico, conteúdo institucional, banner LGPD definitivo, Sentry calibrado e atingir Lighthouse > 90.

---

## Sua missão

Fechar o produto. Nada novo de funcionalidade aqui — é refinamento, instrumentação e qualidade.

**Leia primeiro:**
- `CLAUDE.md`
- `docs/06-INTEGRATIONS.md` (toda parte de GTM/GA4)
- `docs/07-SECURITY-LGPD.md` (banner LGPD, checklist pré go-live)
- `docs/08-SEO-ANALYTICS.md` (TODO o documento)
- `docs/12-SPRINTS-ROADMAP.md` (Sprint 5 DoD)

---

## Ordem de execução

### 1. GTM end-to-end

#### 1.1 Componente `<GTM />`
Conforme `docs/06-INTEGRATIONS.md` seção 4. Já em `src/components/analytics/GTM.tsx`.
- Verificar que está montado no `(storefront)/layout.tsx` mas **não** no `admin/layout.tsx` (não queremos tracking no admin).
- Confirmar que `gtag('consent', 'default', ...)` roda **antes** do script do GTM.

#### 1.2 Helpers de eventos
`src/lib/analytics/events.ts` — implementar todas as funções:
- `trackViewItemList(items, listName)`
- `trackViewItem(item)`
- `trackSelectItem(item, listName)`
- `trackAddToCart(item)`
- `trackRemoveFromCart(item)`
- `trackViewCart(items, value)`
- `trackBeginCheckout(items, value, coupon?)`
- `trackAddShippingInfo(items, value, shippingTier)`
- `trackAddPaymentInfo(items, value, paymentType)`
- `trackPurchase(orderId, items, value, shipping, tax?)`
- `trackSearch(term)`
- `trackSignUp(method)`
- `trackLogin(method)`
- `trackViewPromotion(banner)`
- `trackSelectPromotion(banner)`
- `trackLead()` (newsletter)

Todas devem proteger SSR (`if (typeof window === 'undefined') return`).

#### 1.3 Disparos no código

| Local | Evento |
|---|---|
| `(storefront)/produtos/page.tsx` (client view tracker) | `view_item_list` |
| `ProductCard` onClick | `select_item` |
| `(storefront)/produto/[slug]/PDP.tsx` (useEffect) | `view_item` |
| `AddToCartButton` onClick | `add_to_cart` |
| `CartDrawer` onOpen | `view_cart` |
| `CartItem` remover | `remove_from_cart` |
| `(storefront)/checkout/page.tsx` (useEffect) | `begin_checkout` |
| Etapa 2 — ao salvar frete | `add_shipping_info` |
| Etapa 3 — ao escolher método | `add_payment_info` |
| `/checkout/sucesso/[order_number]` (server-driven) | `purchase` |
| `SearchInput` onSubmit | `search` |
| Signup form onSuccess | `sign_up` |
| Login onSuccess | `login` |
| `HeroBanner` onView (IntersectionObserver) | `view_promotion` |
| `HeroBanner` onClick | `select_promotion` |
| Newsletter onSuccess | `lead` |

#### 1.4 `purchase` idempotente (crítico)

Conforme `docs/08-SEO-ANALYTICS.md` seção 2.5.

1. Adicionar `tracking_pushed_at timestamptz` em `orders` (já está no schema? se não, migration extra).
2. Endpoint `POST /api/orders/[id]/mark-tracked`:
   ```ts
   const supa = createServerClient();
   const { data: { user } } = await supa.auth.getUser();
   const { data } = await supa.from("orders")
     .update({ tracking_pushed_at: new Date().toISOString() })
     .eq("id", orderId)
     .is("tracking_pushed_at", null)
     .select("id")
     .single();
   return Response.json({ ok: !!data });
   ```
3. `PurchaseTrack` componente client só dispara se `mark-tracked` retornou `ok: true`.

#### 1.5 Validar com GTM Preview

- Modo Preview → percorrer funil completo
- Cada evento aparece com payload correto
- `purchase` dispara **uma só vez** (recarregar página de sucesso não duplica)

### 2. Consent Mode v2 — banner LGPD definitivo

#### 2.1 Componente
`src/components/consent/CookieBanner.tsx` conforme `docs/07-SECURITY-LGPD.md` seção 9.3.

- Aparece no primeiro acesso
- 3 botões: "Somente necessários", "Aceitar análise", "Aceitar tudo"
- Link pra `/privacidade` e `/configuracoes-cookies` (mais opções)
- Salva em `localStorage` chave `mvp.consent.v1` + cookie de mesmo nome (1 ano)
- Chama `gtag('consent', 'update', ...)` no save

#### 2.2 Página de gestão `/configuracoes-cookies`

- Lista categorias: Necessários (sempre ON), Análise, Marketing, Funcionais
- Toggle por categoria
- Salvar = mesma lógica do banner
- Botão "Limpar consent" → reabre banner

#### 2.3 Footer link
Adicionar "Configurações de cookies" no footer abrindo essa página.

### 3. SEO técnico — finalização

#### 3.1 `generateMetadata` em TODA rota

Auditar e completar:
- `/` (home)
- `/produtos`
- `/produto/[slug]`
- `/categoria/[slug]`
- `/busca`
- `/sobre`
- `/contato`
- `/privacidade`
- `/termos`
- `/trocas-devolucoes`
- `/faq`

Cada uma com `title`, `description`, `alternates.canonical`, `openGraph`, `robots`.

#### 3.2 Schema markup (JSON-LD)

Implementar componentes em `src/components/seo/`:
- `<OrganizationJsonLd />` no `(storefront)/layout.tsx`
- `<ProductJsonLd />` na PDP
- `<BreadcrumbJsonLd />` em PDPs e categorias
- `<FaqJsonLd />` na home e na `/faq`

Validar em https://search.google.com/test/rich-results — todos os tipos devem passar.

#### 3.3 `sitemap.ts` dinâmico
Conforme `docs/08-SEO-ANALYTICS.md` seção 1.2.

Verificar:
- Inclui produtos ativos
- Inclui categorias ativas
- `lastModified` correto
- Acessível em `/sitemap.xml`

#### 3.4 `robots.ts`
Conforme `docs/08-SEO-ANALYTICS.md` seção 1.3.

#### 3.5 OG images dinâmicas

- `src/app/produto/[slug]/opengraph-image.tsx` — `next/og`, edge runtime, 1200x630
- `src/app/categoria/[slug]/opengraph-image.tsx`
- `src/app/opengraph-image.tsx` (home, estática ou dinâmica)

Validar colando link no WhatsApp + LinkedIn — preview deve aparecer.

### 4. Performance — atingir Lighthouse > 90

#### 4.1 Auditoria
```bash
pnpm dlx @next/bundle-analyzer
```
Analisar bundles grandes. Mover libs pesadas pra dynamic import quando possível (ex: Tiptap só no admin).

#### 4.2 Imagens
- Auditar todas as `<Image>` — todas têm `sizes`?
- LCP da home + PDP com `priority`
- Imagens em AVIF (Next converte automático, conferir `next.config.ts`)

#### 4.3 Fontes
- `next/font` para Inter e Fraunces (já configurado)
- `display: swap`
- Preload da fonte principal

#### 4.4 Cache
- Home `revalidate: 60`
- Listagem `revalidate: 120`
- PDP `revalidate: 300`
- Institucionais `revalidate: 3600`
- Admin nunca cacheia

#### 4.5 Métricas reais
- Habilitar Vercel Speed Insights
- Habilitar Vercel Analytics
- Monitorar 7 dias antes do go-live público

#### 4.6 Rodar Lighthouse local
```bash
pnpm dlx lighthouse https://staging.minivatpremium.com.br --view --preset=desktop
pnpm dlx lighthouse https://staging.minivatpremium.com.br --view --form-factor=mobile
```

Meta: ≥ 90 em Performance, Accessibility, Best Practices, SEO.

### 5. Acessibilidade

Auditar com:
- `pnpm dlx pa11y https://staging.minivatpremium.com.br`
- Axe DevTools (Chrome extension)

Corrigir:
- Alt text em todas as imagens (admin já obriga)
- Contraste WCAG AA em todos os pares fg/bg
- Foco visível (sem `outline: none` sem substituto)
- Labels em todos os inputs
- Hierarquia de headings correta
- Landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`)
- Skip link "Pular para o conteúdo"

### 6. Conteúdo institucional

Confirmar com Diego se já tem textos finais. Se não, **gerar drafts no admin** e marcar pra revisão do Vinícius:

- `/sobre` — texto base no `site_settings.about_text`
- `/privacidade` — usar template de `docs/07-SECURITY-LGPD.md` seções 9.4, 10
- `/termos` — template padrão de e-commerce BR
- `/trocas-devolucoes` — padrão CDC (Código de Defesa do Consumidor)
- `/frete` — explicar Melhor Envio, prazo, frete grátis
- `/faq` — 8-10 perguntas comuns (compatibilidade impressora, tempo, garantia, suporte)
- `/contato` — form que envia email via Resend pra `contact_email`

Renderizar com `react-markdown` + sanitização.

### 7. Sentry — calibração

- `tracesSampleRate: 0.1` em produção
- `replaysSessionSampleRate: 0.0` (caro)
- `replaysOnErrorSampleRate: 1.0`
- `beforeSend` removendo PII: senha, cartão, CPF, qr_code, telefone, email do payer
- `Sentry.setUser({ id: user.id })` em layouts (sem email)
- Alertas configurados (Sentry → Alerts):
  - Webhook MP error rate > 5% em 5min
  - Checkout error rate > 3% em 5min
  - Erros 5xx em qualquer rota > 10/min

### 8. Search Console + Merchant Center

#### Search Console
1. Adicionar propriedade `https://www.minivatpremium.com.br`
2. Verificar via DNS (TXT no Cloudflare)
3. Submeter `https://www.minivatpremium.com.br/sitemap.xml`
4. Aguardar indexação (24-72h)

#### Bing Webmaster Tools
1. Importar de Search Console
2. Submeter sitemap

#### Merchant Center (preparação, vai produção pós validação MEI)
1. Conta criada (Fase 1.5)
2. Endpoint `/feeds/products.xml` no Next.js (Fase 1.5)

### 9. Newsletter — finalizar fluxo

- Form no footer (Server Action)
- Insert em `newsletter_subscribers` com `source: 'storefront'`
- Validar email
- Email de confirmação opt-in (double opt-in) via Resend
- Link de unsubscribe (`/newsletter/cancelar?token=...`)

### 10. Recuperação de senha + e-mail de boas-vindas

- Customizar templates do Supabase Auth (Dashboard → Auth → Email Templates) com identidade visual
- Ou (recomendado) usar templates próprios via Resend disparados em hook do Supabase

### 11. Robôs de qualidade

Criar `scripts/` com:
- `scripts/check-broken-links.ts` — Crawl + valida que nenhum link interno 404
- `scripts/audit-meta.ts` — Verifica que toda página tem `title` e `description`
- `scripts/audit-images.ts` — Verifica que toda `<img>` ou `<Image>` tem alt

Rodar todos antes do go-live.

### 12. Smoke test final

Criar `e2e/smoke.spec.ts` com Playwright (mínimo):
- Home carrega
- Click em produto → PDP carrega
- Add to cart → drawer abre com item
- Checkout etapa 1 → preenche email
- Etapa 2 → preenche endereço, vê frete
- Etapa 3 → seleciona Pix, gera QR
- Webhook simulado → status muda pra `paid`
- Página sucesso aparece

Rodar localmente antes do go-live.

### 13. Documentar para o Vinícius

Criar `docs-cliente/` (dirigido ao usuário final, não dev):
- `Manual do administrador.pdf` (ou notion link)
- Vídeo de 20-30 min gravado pelo Diego mostrando:
  - Como cadastrar produto
  - Como receber pedido → gerar etiqueta → enviar
  - Como criar cupom
  - Como mudar banner
  - Como ver vendas
  - Como instalar Pixel no GTM
- Procedimento de "produto chegou no nosso galpão devolvido" (Fase 2)

### 14. Checklist pré go-live

Rodar o checklist completo de `docs/07-SECURITY-LGPD.md` seção 12.

Mais:
- [ ] Pedido teste R$ 1 em produção (cartão real, depois estornar)
- [ ] Pedido teste Pix em produção (R$ 0,01 se conseguir)
- [ ] E-mail de confirmação chegou na caixa (não spam)
- [ ] Tracking code de teste atualizado pelo Vinícius
- [ ] Etiqueta Melhor Envio comprada de verdade (R$ X)
- [ ] Vinícius validou que consegue operar o admin sozinho
- [ ] DNS apontando, SSL A+
- [ ] Backup automático rodando
- [ ] Sentry ativo
- [ ] Search Console submetido
- [ ] GA4 recebendo eventos
- [ ] Banner LGPD bloqueando GA até consent
- [ ] Telefone do DPO + e-mail funcionando

---

## Definition of Done do Sprint 5

- [ ] Lighthouse mobile ≥ 90 em todas as métricas
- [ ] Acessibilidade WCAG AA (pa11y limpo)
- [ ] Todos os eventos GA4 disparando corretamente
- [ ] Schema markup validado no Rich Results Test
- [ ] Sitemap submetido
- [ ] Banner LGPD funcional com Consent Mode v2
- [ ] Conteúdo institucional publicado e aprovado
- [ ] Pedido teste em produção concluído
- [ ] Sentry capturando sem PII
- [ ] Manual do admin entregue pro Vinícius
- [ ] Checklist pré go-live 100%

---

## Pegadinhas

- **`purchase` duplicado:** se o `mark-tracked` falhar e o usuário recarregar, dispara de novo. Por isso o flag no banco + idempotência no endpoint.
- **CSP quebrando GTM:** se algum container precisa de `unsafe-eval`, manter (já permitimos).
- **OG image edge runtime:** não conseguindo carregar fontes? Usar `fontDataUrl` ou self-host.
- **Lighthouse no localhost:** sempre dá menos. Medir em staging.
- **Sentry `beforeSend` sumindo errors:** logar `console.warn` quando filtrar pra não esconder bug.
- **`gtag('consent', 'default', ...)`:** precisa rodar **antes** do GTM. Por isso está inline antes do script.

---

## Após go-live

- Monitorar Sentry diariamente por 1 semana
- Validar primeiros 5 pedidos manualmente (extra cuidado)
- Acompanhar Search Console pra ver indexação
- Iniciar Sprint 6 (Fase 2) com prioridades reavaliadas pelo Diego e Vinícius

---

## Se travar

Pare. Pergunte ao Diego. Não publique nada quebrado.
