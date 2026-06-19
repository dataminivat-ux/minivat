# 11 — Storefront Spec

> Visual: off-white quente + tipografia editorial Fraunces (display) + Inter (body) + acento dourado champagne nos CTAs. Inspiração: Apple, Samsung, Dell — mas sem virar templated.

## Padrões globais

### Header

- Logo (link home)
- Menu: Início, Mini VAT, Mesas, Acessórios, Sobre, Contato
- Ícones: busca, conta, carrinho (com badge de itens)
- Sticky no scroll, com encolhimento sutil (height 80px → 64px)
- Mobile: hambúrguer + logo + carrinho

### Footer

- 4 colunas (desktop):
  1. **Loja:** Sobre, Contato, Blog, Mídia
  2. **Ajuda:** FAQ, Trocas e Devoluções, Frete e Prazos, Garantia
  3. **Legal:** Política de Privacidade, Termos de Uso, LGPD, Cookies
  4. **Atendimento:** WhatsApp (link direto), E-mail, Newsletter (input + opt-in)
- Linha final: CNPJ, endereço, "Mini VAT Premium © 2026 — Todos os direitos reservados"
- Logo + badges: "Site Seguro", "Compra Garantida", "Fabricante Original"

### Cookie banner

- Discreto no rodapé inferior
- 3 opções: Aceitar todos · Recusar não-essenciais · Configurar
- Configurar abre modal com toggles por categoria
- Persiste em cookie

### WhatsApp flutuante

- Ícone discreto no canto inferior direito
- Click abre conversa direta com número da loja

## Páginas

### 1. `/` — Home

**Acima da dobra:**
- Hero com foto técnica do produto principal + headline declarativa
  - Headline (Fraunces, 64px desktop): *"O Mini VAT que economiza resina e acelera sua impressão. Feito por dentista, para dentistas."*
  - Subheadline: "Inventor original, fabricante desde 2019. Garantia de 90 dias."
  - CTA primário (dourado): "Ver linha PREMIUM"
  - CTA secundário (outline): "Comparar modelos"
  - Selo discreto: "Original — Inventor do Mini VAT"

**Carrossel de banners** (gerenciado no admin) — opcional, ativável.

**Seção destaques:** 4 produtos em grid (variantes PREMIUM + STANDARD + 2 mesas). Hover: zoom suave + preview de variantes.

**Seção "Por que comprar com a gente":** 3-4 blocos com ícone + título curto + descrição (Inventor original / Fabricante há 6 anos / Garantia 90 dias / Suporte direto com o fundador).

**Seção "Compatibilidade":** strip horizontal com logos/nomes de modelos de impressora suportados (Anycubic, Elegoo, etc.) — autoridade técnica.

**Prova social:** 3-4 avaliações reais + "Veja mais avaliações" + estrelas agregadas (quando reviews existirem).

**Seção FAQ:** 6-8 perguntas em accordion (frete, prazos, garantia, compatibilidade, devolução, exportação).

**CTA final:** "Pronto para acelerar suas impressões? Ver catálogo completo."

### 2. `/categoria/[slug]` — Listagem por categoria

**Cabeçalho da categoria:**
- Breadcrumb
- Título (h1, Fraunces)
- Descrição curta (opcional, do admin)
- Filtros à esquerda (desktop) / drawer (mobile):
  - Tipo (PREMIUM/STANDARD)
  - Compatibilidade (impressora)
  - Faixa de preço (slider)
  - Em estoque (toggle)
- Ordenação à direita: Relevância / Menor preço / Maior preço / Mais vendidos / Lançamento
- Total de resultados ("12 produtos")

**Grid de produtos** (3 colunas desktop, 2 mobile):
- Card com imagem (square 1:1), nome, preço (com "de" cortado se em promoção), botão "Ver produto" no hover
- Tag "Original" se aplicável
- Badge "Esgotado" se sem estoque
- Click no card → página de produto

**Paginação:** numerada + "carregar mais" (infinite scroll opcional). 24 produtos por página.

**Empty state:** "Nenhum produto com esses filtros. [Limpar filtros]"

### 3. `/produto/[slug]` — Página de produto

**Layout 2 colunas (desktop), 1 coluna (mobile):**

**Coluna esquerda — Galeria:**
- Imagem principal grande
- Thumbnails embaixo (clicáveis)
- Zoom on hover (desktop)
- Swipe (mobile)
- Botão "Ver em tela cheia"
- Vídeo se houver (próxima do final do array)

**Coluna direita — Compra:**
- Breadcrumb
- Nome (h1, Fraunces)
- Rating + nº avaliações (link âncora)
- Selo "Original" se aplicável
- Preço grande (Inter, bold). Se promoção: "de R$ X por R$ Y" + economia em %
- Descrição curta
- **Seletor de variantes:**
  - Tipo: chips (PREMIUM | STANDARD)
  - Impressora: dropdown com busca (se aplicável)
  - SKU/preço atualiza ao selecionar
- Quantidade: input com -/+
- Estoque: "Em estoque" verde / "Apenas X em estoque" amarelo / "Esgotado" vermelho + botão "Me avise quando voltar"
- **Botão "Adicionar ao carrinho"** (dourado, large)
- Botão coração para wishlist
- Bloco confiança: "Envio em até 5 dias" + "Garantia 90 dias" + "Pagamento seguro"
- Calcular frete: input CEP → cotação ao vivo (lista serviços + prazos)

**Abaixo (full-width):**

**Tabs:** Descrição completa / Especificações técnicas / Compatibilidade / Avaliações (com nº) / FAQ

- Descrição completa: rich text com imagens
- Especificações: tabela chave-valor (material, dimensões, peso, etc.)
- Compatibilidade: lista de impressoras suportadas
- Avaliações: distribuição (estrelas %) + lista paginada com filtro por nota
- FAQ: 4-6 perguntas específicas do produto

**Seção "Produtos relacionados":** 4 cards (mesma categoria ou compatibilidade)

**Sticky bottom no mobile:** botão "Adicionar ao carrinho — R$ X"

### 4. `/busca?q=...`

- Cabeçalho: "Resultados para 'X'"
- Mesma grid da categoria, sem filtros laterais (apenas ordenação)
- Sem resultados: "Não encontramos nada para 'X'. Categorias populares: [chips]"

### 5. `/carrinho`

- Lista de itens (imagem, nome, variant, qty -/+, preço unit, subtotal item, X remover)
- Aplicar cupom (input + botão; mostra desconto se aplicado, X para remover)
- Calcular frete: input CEP + botão; lista de serviços (radio); mostra escolhido
- Resumo: subtotal, desconto, frete, total
- Botão "Finalizar compra" (dourado, large)
- Link "Continuar comprando"
- Carrinho vazio: ilustração + "Seu carrinho está vazio" + CTA "Ver produtos"

**Carrinho lateral (slide-over)** acionado ao adicionar:
- Itens (compacto)
- Botão "Ver carrinho" + "Finalizar compra"
- Fecha automaticamente em 3s (opcional, com pause em hover)

### 6. `/checkout`

**One-page com seções expansíveis:**

**1. Identificação:**
- Toggle: "Já sou cliente" (login inline) | "Comprar como visitante"
- Visitante: e-mail + nome + telefone + CPF
- Login: e-mail + senha (inline, sem redirecionar)

**2. Entrega:**
- (Logado) Selecionar endereço salvo ou "+ Novo endereço"
- Form novo endereço com CEP autocomplete (ViaCEP)
- Cotação de frete (radio buttons com serviço + prazo + preço)
- "Frete grátis aplicado!" badge quando elegível

**3. Pagamento:**
- Tabs: Pix · Cartão de crédito · Boleto
- **Pix:** "Após confirmar, você verá o QR Code"
- **Cartão:** form com nome, número, validade, CVV (via MP Bricks; cartão NUNCA toca seu servidor); parcelas (select com valores)
- **Boleto:** "Após confirmar, geramos o boleto"

**4. Resumo (sticky no desktop, collapse no mobile):**
- Itens compactos
- Cupom (input)
- Subtotal, desconto, frete, total
- Aviso: "Ao finalizar, você concorda com nossos Termos e Política de Privacidade"
- Botão **"Finalizar compra"** (dourado, large)

**Pós-submit (mesma página, secão expandida):**
- **Pix:** QR Code grande + copia-e-cola + countdown (30min) + "Aguardando pagamento..." (polling)
- **Cartão aprovado:** redirect imediato para `/pedido/[id]/confirmacao`
- **Cartão recusado:** mensagem clara + opção "Tentar outro cartão"
- **Boleto:** link + código + "Enviamos por e-mail"

### 7. `/pedido/[orderNumber]/confirmacao` — Confirmação

- Headline: "Pedido recebido! ✓"
- Nº do pedido grande
- Status do pagamento (badge)
- Resumo do pedido
- Próximos passos: "Você receberá um e-mail e WhatsApp com atualizações"
- CTA "Acompanhar pedido" + "Continuar comprando"
- Eventos dataLayer disparados: `purchase` com `transaction_id`, `value`, `items`

### 8. `/conta` (logado)

**Sidebar de conta:** Pedidos / Dados / Endereços / Lista de desejos / Sair

**`/conta/pedidos`:**
- Lista de pedidos (cards): nº, status, data, total, miniatura dos itens
- Click → detalhe

**`/conta/pedidos/[orderNumber]`:**
- Status com timeline visual
- Itens + valores
- Endereço de entrega
- Pagamento (info pública)
- Rastreio (se houver) com link externo
- Botão "Comprar novamente" → adiciona itens ao carrinho

**`/conta/dados`:**
- Form: nome, e-mail (read-only se Google), telefone, CPF, data nascimento
- Alterar senha (campo atual + nova + confirmar)
- Opt-in marketing (toggle)
- "Excluir minha conta" (LGPD, com confirmação dupla)

**`/conta/enderecos`:**
- Cards de endereços com "Editar" / "Excluir" / "Definir como padrão"
- Botão "+ Novo endereço"

**`/conta/lista-desejos`:**
- Grid de produtos com data adicionado
- "Mover para o carrinho" / "Remover"
- Toggle "Avisar quando voltar ao estoque" por item

### 9. Páginas institucionais

**`/sobre`** — história, fundador, missão (markdown editável no admin)
**`/contato`** — formulário (nome, e-mail, telefone, mensagem) + WhatsApp + e-mail + endereço
**`/trocas-devolucoes`** — política markdown
**`/privacidade`** — markdown
**`/termos`** — markdown
**`/lgpd`** — direitos do titular + formulário de solicitação

### 10. Páginas de erro

**404:** ilustração simples + "Não encontramos essa página" + CTA "Voltar para o início" + busca
**500:** "Algo deu errado do nosso lado. Já estamos investigando." + CTA "Voltar"

---

## Componentes reutilizáveis da storefront

- `<ProductCard>` — card de produto (lista, relacionados, wishlist)
- `<Price>` — formatação BRL, suporta "de/por"
- `<VariantSelector>` — chips e dropdowns para variantes
- `<AddToCartButton>` — botão com loading, success state e tracking GTM
- `<ShippingCalculator>` — input CEP + lista de cotações
- `<StarRating>` — estrelas (preenchidas, vazias, half)
- `<ProductGallery>` — galeria com thumbnails, zoom, swipe
- `<Breadcrumb>` — auto-gerado por rota
- `<Section>` — wrapper com padding consistente
- `<Container>` — max-width responsivo
- `<TrustBadges>` — selos de confiança (3-4)
- `<NewsletterForm>` — input + opt-in LGPD
- `<Accordion>` — para FAQ
- `<Carousel>` — para banners e produtos relacionados
- `<CookieBanner>` — banner LGPD

## Microinterações importantes

- **Adicionar ao carrinho:** botão muda para "Adicionado ✓" por 1.5s, carrinho lateral abre, ícone do carrinho ganha um pulse + badge incrementa
- **Mudança de variante:** preço e estoque atualizam com leve fade
- **Cálculo de frete:** skeleton enquanto carrega; resultado aparece com slide-down
- **Cupom aplicado:** badge verde com X para remover; total atualiza com tween
- **Wishlist:** coração preenche/esvazia com bounce sutil
- **Hover em card de produto:** zoom da imagem (scale 1.03) + sombra suave

## Acessibilidade — não-negociável

- Skip link "Pular para o conteúdo"
- Foco visível em todos os interativos
- Aria labels em ícones (busca, carrinho, conta)
- Contraste mínimo AA (verificado no design tokens)
- Form com label associado, erro com aria-describedby
- Modal/Dialog com aria-modal e trap de foco
- Galeria de imagens com alt text obrigatório
- `prefers-reduced-motion` respeitado em animações

## Tracking GTM por página

| Rota | Eventos |
|------|---------|
| `/` | `page_view`, `view_promotion` (banners), `select_promotion` (click banner) |
| `/categoria/[slug]` | `page_view`, `view_item_list` |
| `/produto/[slug]` | `page_view`, `view_item` |
| `/carrinho` | `page_view`, `view_cart`, `remove_from_cart` |
| `/checkout` | `page_view`, `begin_checkout`, `add_shipping_info`, `add_payment_info` |
| `/pedido/[id]/confirmacao` | `purchase` |
| `/conta/lista-desejos` | `add_to_wishlist` |
| Busca | `search` |
| Login | `login` |
| Cadastro | `sign_up` |
