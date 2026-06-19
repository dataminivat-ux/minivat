# Prompt 04 — Painel administrativo (Sprint 3)

> Cole no Claude Code após Sprints 1 e 2 estarem completos. Tempo estimado: 5-7 dias.

---

## Sua missão

Construir o painel administrativo completo. Vinícius (e equipe) precisa operar a loja inteira sem chamar dev. **Tudo que vende, expõe, configura ou comunica está aqui.**

**Leia primeiro:**
- `CLAUDE.md` (estrutura, convenções, segurança)
- `docs/10-ADMIN-PANEL-SPEC.md` (especificação do admin)
- `docs/05-DATABASE-SCHEMA.md` (entender o modelo de dados)
- `docs/07-SECURITY-LGPD.md` (proteção `/admin/*` no middleware)

---

## Princípios de UX do admin

1. **Velocidade > beleza.** Vinícius vai usar isso todo dia. Atalhos de teclado em ações comuns. Toasts informativos. Loadings claros.
2. **Confirmação destrutiva.** Toda exclusão/cancelamento abre dialog.
3. **Otimismo onde dá.** Toggle de "ativo/inativo", reordenação, mudança de status — TanStack Query com `useMutation` otimista.
4. **Filtros persistem na URL.** Compartilhar link já filtrado vale ouro.
5. **Mobile decente.** Vinícius pode precisar despachar pedido do celular.

---

## Stack e padrões

- Server Components para páginas que listam/leem.
- Server Actions para mutações simples (criar, editar, deletar).
- Route Handlers `/api/admin/*` para operações que precisam orquestrar várias coisas (gerar etiqueta, refund).
- TanStack Query no client para mutações otimistas em listas grandes.
- shadcn/ui Table + DataTable (react-table) para listagens.
- Tiptap para descrições rich text.
- React Hook Form + Zod para formulários.

---

## Estrutura de rotas

```
/admin
  /                                  → dashboard
  /pedidos                           → lista
  /pedidos/[id]                      → detalhe
  /produtos                          → lista
  /produtos/novo
  /produtos/[id]                     → edit (com tabs)
  /categorias                        → lista + edit inline
  /cupons                            → lista
  /cupons/novo
  /cupons/[id]
  /banners                           → lista (drag-reorder)
  /banners/novo
  /clientes                          → lista
  /clientes/[id]                     → detalhe
  /avaliacoes                        → moderação
  /configuracoes
    /loja                            → site_settings
    /pagamento                       → max_installments, etc.
    /frete                           → CEP origem, frete grátis
    /textos                          → privacidade, termos, trocas (Tiptap)
    /equipe                          → admins
```

Layout `/admin/layout.tsx`:
- Sidebar fixa (desktop) + bottom nav (mobile)
- Header com logo, busca global (Cmd+K → fuse.js sobre produtos/pedidos), notificações (estoque baixo, pedidos pendentes), avatar
- Toast Sonner global
- ConfirmDialog provider

---

## Ordem de execução

### 1. Layout base e auth

`src/app/admin/layout.tsx`:
- Server Component
- Busca user via Supabase Server Client
- Confere `profile.role in ('admin', 'staff')` — middleware já protege, mas reforçar aqui
- Sidebar: Pedidos, Produtos, Categorias, Cupons, Banners, Clientes, Avaliações, Config
- Mostra ícone com badge para pedidos pendentes (count via RSC)

### 2. Dashboard `/admin`

Server Component que mostra:
- **Hoje:** faturamento (sum `total_cents` paid hoje), pedidos pagos, ticket médio
- **Mês:** mesma coisa
- **Alertas:** pedidos pendentes há > 24h, produtos com `stock <= low_stock_threshold`, etiquetas Melhor Envio não compradas
- **Últimos pedidos** (10) com link
- Gráfico 7 dias (Recharts) — faturamento por dia

### 3. Pedidos

#### Lista `/admin/pedidos`

- DataTable com colunas: número, cliente, total, status badge, data, ações
- Filtros (URL): status, busca por número/email, data início/fim
- Paginação server-side (50/page)
- Ação rápida: mudar status (dropdown inline)
- Export CSV (Fase 1.5)

#### Detalhe `/admin/pedidos/[id]`

Layout 2 colunas:

**Esquerda:**
- Dados do cliente (clicável → `/admin/clientes/[id]`)
- Endereço de entrega (botão "Copiar")
- Itens (foto, nome, variação, qty, preço)
- Subtotal, desconto (com cupom), frete, total
- Notas (cliente + internas, edit inline)

**Direita:**
- Status atual + dropdown pra mudar (com confirmação)
- Pagamento: método, status, `gateway_payment_id`, valor, parcelas
  - Botão "Atualizar status" → re-busca no MP
  - Botão "Estornar" → confirma + cria refund no MP (Fase 1.5)
- Frete: serviço, prazo
  - Se `shipments` vazia: botão "Comprar etiqueta no Melhor Envio"
  - Se já comprou: tracking code (copy), link da etiqueta (PDF), botão "Marcar como postado"
- Histórico de status (timeline com `order_status_history`)
- Botão "Reenviar e-mails" (escolher template: confirmação, aprovação, despacho)

### 4. Produtos

#### Lista `/admin/produtos`

- DataTable: thumb, SKU, nome, categoria, preço, estoque, ativo, ações
- Filtros: categoria, ativo/inativo, estoque baixo, busca
- Bulk actions: ativar/desativar, mudar categoria, exportar CSV
- Botão "+ Novo produto"

#### Criar/Editar `/admin/produtos/[id]`

Tabs:

**Geral**
- SKU, slug (auto, editável), nome, marca
- Categoria (select)
- Descrição curta (textarea)
- Descrição rica (Tiptap)
- Tags

**Preços**
- `price_cents` (input em reais, converte)
- `compare_at_price_cents` (preço "de", opcional)
- `cost_cents` (custo — só admin vê, calcula margem)
- Mostrar margem em %

**Estoque**
- `stock` (input numérico)
- `low_stock_threshold`
- Tabela de variações (`product_variants`): nome, SKU, preço override, estoque
  - Botão "+ Adicionar variação"

**Mídia**
- Upload múltiplo (drag-and-drop), preview
- Reordenar arrastando
- Marcar como principal (1 só)
- Alt text editável em cada
- Storage Supabase bucket `products`

**Dimensões**
- Peso (g), largura/altura/comprimento (cm) — críticos pra frete
- Validar: > 0 antes de "salvar e ativar"

**SEO**
- `seo_title`, `seo_description`, `seo_keywords`
- Preview da SERP do Google

**Status**
- Ativo (toggle)
- Em destaque (toggle, aparece na home)
- Requer envio (toggle)
- Botão "Salvar e ativar" / "Salvar rascunho"

Validação Zod em tudo. Salvamento via Server Action.

### 5. Categorias `/admin/categorias`

- Lista em árvore (parent → children)
- Edit inline: nome, slug, sort_order, ativa
- Drag-reorder
- Upload de imagem
- SEO meta
- Cuidado: não excluir categoria com produtos (warn ou reassign)

### 6. Cupons

#### Lista `/admin/cupons`

- DataTable: código, tipo (% / fixo / frete grátis), valor, usos/limite, validade, ativo
- Filtros: ativo/expirado, tipo

#### Criar/Editar `/admin/cupons/[id]`

- Código (uppercase, sem espaços)
- Descrição
- Tipo: percentage / fixed / free_shipping
- Valor (% ou centavos)
- Compra mínima
- Limite total / por usuário
- Datas início/fim
- Aplicar em itens em promoção? (checkbox)
- Ativo (toggle)
- Botão "Gerar variação" (auto-cria N códigos similares)

### 7. Banners `/admin/banners`

- Lista filtrável por posição (`home_hero`, `home_secondary`, `category_top`)
- Drag-reorder
- Cada banner: imagem desktop (1920x600), mobile (750x500), título, subtítulo, link, CTA, validade, ativo
- Preview ao vivo (modal) mostrando como fica na home
- Validar tamanhos antes de salvar

### 8. Clientes `/admin/clientes`

- DataTable: nome, email, total pedidos, total gasto, último pedido, criado em
- Busca por email/nome/CPF
- Detalhe: dados pessoais, endereços, pedidos, wishlist, reviews, opt-ins
- Ação "Ver como cliente" (loga como ele em sandbox — Fase 2)
- Botão "Anonimizar" (LGPD — aciona endpoint que chama `anonymize_user_data`)

### 9. Avaliações `/admin/avaliacoes`

- DataTable: produto, autor, rating, snippet do texto, status (rascunho/publicada), data
- Filtro padrão: não publicadas (moderação)
- Botões: publicar, recusar, editar
- Resposta da loja (opcional, vira `responses` jsonb na review)

### 10. Configurações

#### `/admin/configuracoes/loja`
- Edita `site_settings`: nome, contato (e-mail, WhatsApp), redes sociais (jsonb), texto institucional (Tiptap)

#### `/admin/configuracoes/pagamento`
- `max_installments`, juros (Fase 2), métodos aceitos

#### `/admin/configuracoes/frete`
- CEP origem
- `free_shipping_threshold_cents`
- Regiões com restrição (Fase 2)

#### `/admin/configuracoes/textos`
- Política de Privacidade (Tiptap)
- Termos de Uso (Tiptap)
- Política de Trocas (Tiptap)
- Política de Frete (Tiptap)
- Cada salvamento revalida `/privacidade`, `/termos`, etc.

#### `/admin/configuracoes/equipe`
- Lista profiles com `role in ('admin', 'staff')`
- Adicionar via e-mail (cria convite Supabase)
- Trocar papel (admin ↔ staff)
- Revogar acesso

### 11. Endpoints internos

- `POST /api/admin/orders/[id]/refund` — chama MP refund
- `POST /api/admin/orders/[id]/shipping-label` — orquestra Melhor Envio cart→checkout→generate→print
- `POST /api/admin/orders/[id]/resend-email` — body: `{ template }`
- `POST /api/admin/uploads` — upload pro Storage com validação
- `POST /api/admin/products/[id]/duplicate` — duplica produto
- `POST /api/admin/customers/[id]/anonymize` — LGPD
- `POST /api/revalidate` — revalidação on-demand (token bearer)

### 12. Server Actions de mutação

Padrão:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const UpdateProduct = z.object({/* ... */});

export async function updateProduct(input: unknown) {
  const data = UpdateProduct.parse(input);
  const supa = await createServerClient();
  const { error } = await supa.from("products").update(data).eq("id", data.id);
  if (error) return { error: error.message };
  revalidatePath(`/produto/${data.slug}`);
  revalidatePath("/admin/produtos");
  return { ok: true };
}
```

### 13. Cmd+K (busca global)

`src/components/admin/CommandMenu.tsx`:
- shadcn `<Command />`
- Indexa: pedidos (number, email), produtos (name, SKU), clientes (email, nome)
- Atalho `Cmd+K` / `Ctrl+K`
- Server Action que retorna top 5 de cada categoria

### 14. Notificações

Realtime via Supabase Realtime:
- Inscreve em `orders` insert → toast "Novo pedido MVP-2026-000123"
- Inscreve em `product_variants` update onde `stock <= low_stock_threshold` → badge no sidebar

---

## Definition of Done

- [ ] Vinícius consegue cadastrar produto completo (todas as tabs) sem ajuda
- [ ] Vinícius consegue receber um pedido teste, ver detalhes, gerar etiqueta no ME, marcar como enviado
- [ ] Categorias podem ser criadas, reordenadas e desativadas
- [ ] Cupom criado funciona no checkout real (já testado no Sprint 2)
- [ ] Banners drag-and-drop aparecem na home na ordem certa
- [ ] Avaliação publicada aparece na PDP em < 60s (revalidate)
- [ ] Configurações salvas refletem no site (texto privacidade muda)
- [ ] Mobile do admin funciona (testado num iPhone real)
- [ ] Atalho Cmd+K abre busca global
- [ ] Toast de novo pedido aparece em tempo real
- [ ] Mutations otimistas não dão flicker
- [ ] Sentry capturando erros do admin (não esconder do Vinícius — toast com "Tente novamente")

---

## Pegadinhas

- **Slug duplicado:** validar no `onChange` (Server Action `checkSlugAvailable`)
- **Upload de imagem em produto novo:** salvar produto rascunho primeiro, depois upload com `product_id`
- **Variações vs produto sem variação:** se zero variantes, usar `products.stock` + `products.price_cents`; se ≥ 1, ignorar campos do produto
- **`shipping_address` snapshot:** ao mudar endereço do cliente, **não** alterar pedidos existentes (já gravado como jsonb)
- **Refund MP:** suporta total e parcial; parcial só em cartão. Pix só total.
- **Revalidate:** sempre `revalidatePath` após mutação em recurso renderizado pelo storefront. Sem isso, cache fica velho.
- **Tiptap → HTML:** sanitizar com DOMPurify no render (XSS via descrição é vetor real)
- **TanStack Query:** usar `queryClient.setQueryData` pra otimismo + `onError` pra rollback
- **Loading lazy do admin:** o admin não precisa estar no bundle do storefront; usar route groups (`(storefront)` vs `admin`)

---

## Se travar

Pare e pergunte ao Diego antes de fazer:
- Qualquer mudança no schema do banco
- Qualquer policy RLS nova (pode quebrar storefront)
- Refund parcial (envolve dinheiro real do cliente)
- Anonimização (LGPD — irreversível)
