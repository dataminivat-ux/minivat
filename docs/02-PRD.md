# 02 — PRD (Product Requirements Document)

> Requisitos funcionais detalhados. IDs estáveis (RF-XXX) usados em commits e issues.

---

## RF-100 — Catálogo

### RF-101 Listagem por categoria
- URL: `/categoria/[slug]`
- Filtros: tipo (PREMIUM/STANDARD), compatibilidade (impressora), preço, em estoque
- Ordenação: relevância (default), preço asc/desc, mais vendidos, lançamento
- Paginação: 24 produtos por página, infinite scroll opcional
- SSR (ISR 5min) para SEO

### RF-102 Página de produto
- URL: `/produto/[slug]`
- Galeria mín. 4 imagens, zoom on hover, swipe mobile
- Variantes selecionáveis (chips); SKU/preço/estoque atualizam ao mudar
- Indicador de estoque baixo (≤5: "Apenas N em estoque")
- Especificações em tabela, compatibilidade, FAQ específico, política de envio/troca
- Produtos relacionados
- Avaliações com nota média e distribuição
- CTA sticky no mobile (bottom): "Adicionar — R$ X"

### RF-103 Busca interna
- URL: `/busca?q=...`
- Postgres full-text português (`tsvector`)
- Sugestões em tempo real (debounce 300ms)
- Empty: chips de categorias populares

---

## RF-200 — Carrinho e Checkout

### RF-201 Carrinho persistente
- Logado: tabela `carts` no DB
- Anônimo: cookie httpOnly `session_id` (30d)
- Drawer lateral ao adicionar; toast se item esgotou

### RF-202 One-page checkout
- URL: `/checkout`
- 4 seções colapsáveis: Identificação · Entrega · Pagamento · Resumo
- ViaCEP autocomplete; cotação de frete em tempo real (Melhor Envio)
- Frete grátis aplicado automaticamente se elegível
- Pagamentos: Pix (QR + copia-cola, expiração 30min, polling), cartão (MP Bricks tokenizado), boleto
- Parcelamento conforme regra do admin (default até 6x sem juros, mín R$ 200/parcela)
- Cupom aplicável em qualquer momento (preview de desconto)
- Botão "Pagar" só ativa quando todas as seções válidas
- Pós-pagamento aprovado → `/pedido/[id]/confirmacao`

### RF-203 Recuperação de carrinho abandonado
- Após 1h sem ação → e-mail (Resend) com link de recuperação
- Após 24h → WhatsApp (Watidy) com mensagem
- Carrinho recuperável por 7 dias
- Tabela/coluna registrando notificações enviadas

---

## RF-300 — Conta do Cliente

### RF-301 Cadastro e Login
- Cadastro: nome, e-mail, senha, CPF (opcional no cadastro, obrigatório na compra)
- Login social Google (Fase 2)
- Recuperação por e-mail (token 1h)
- Verificação de e-mail (não bloqueia compra)

### RF-302 Meus pedidos
- URL: `/conta/pedidos`
- Lista com status, valor, data
- Detalhe: timeline, rastreio, NF-e (quando emitida), "Comprar novamente"

### RF-303 Meus dados
- Edição de nome, e-mail, telefone, CPF
- Troca de senha
- Exclusão de conta (LGPD soft delete + anonimização em 30 dias)

### RF-304 Endereços
- CRUD até 5 endereços
- Definir padrão

### RF-305 Lista de desejos
- Adicionar via ícone na vitrine
- "Avisar quando voltar ao estoque" opt-in

---

## RF-400 — Admin

### RF-401 Autenticação
- Whitelist `admin_users`
- 2FA TOTP opcional
- Sessão 8h
- Logs de acesso (IP, UA)
- Bloqueio 1h após 5 falhas em 15min

### RF-402 Dashboard
- KPIs: vendas hoje/semana/mês, ticket médio, conversão
- Gráfico 7/30/90 dias
- Pedidos recentes (10)
- Alertas: estoque baixo, pendentes > 6h, avaliações pendentes, Pix expirado

### RF-403 Produtos
- Listagem com busca/filtros/ordenação/ações em massa
- Form multi-tab: Básico · Variantes · Imagens · Especificações · SEO
- Variantes: gerar combinações, SKU/preço/estoque individual
- Upload com alt obrigatório, drag-reorder, redimensionamento automático
- Preview antes de publicar

### RF-404 Pedidos
- Listagem com filtros, agregados, exportação CSV
- Detalhe: itens, valores, pagamento, envio, timeline, notas
- Emitir etiqueta Melhor Envio; marcar como enviado; cancelar/reembolsar

### RF-405 Clientes
- Listagem, busca, exportação CSV (apenas opt-in)
- Detalhe: pedidos, LTV, ticket médio, wishlist
- Anonimizar / exportar dados (LGPD)

### RF-406 Cupons
- Tipo: percentual / fixo / frete grátis
- Limites totais e por cliente
- Restrição: produtos, categorias, primeira compra
- Validade início/fim
- Métricas de uso

### RF-407 Banners
- Carrossel até 5 slides
- Por slide: imagem desktop+mobile, alt, headline, subheadline, CTA texto+URL, período, ordem
- Preview antes de publicar

### RF-408 Frete
- Regras: grátis acima de R$ X (global ou por categoria), fixo, calculado
- Transportadoras Melhor Envio habilitáveis
- Cotação de teste
- Internacional manual: tabela país × peso

### RF-409 Configurações
- Loja: dados fiscais
- Pagamento: switch MP/PagBank com credenciais e ambiente
- Frete: Melhor Envio
- E-mail: templates editáveis (variáveis)
- WhatsApp: Watidy + templates
- Analytics: GTM/GA4/Pixel/Hotjar IDs + scripts custom (sem código)
- LGPD: Política Privacidade, Termos, Cookies, Trocas (Markdown editor)
- Equipe: gestão de admins

### RF-410 Avaliações
- Moderação (aprovar/rejeitar/responder)
- Solicitar avaliação D+7 da entrega (cron)

---

## RF-500 — SEO e Marketing

### RF-501 SEO técnico
- Meta title/description configuráveis no admin
- OG image dinâmica `/api/og/[productId]`
- Schema.org: Product, Offer, BreadcrumbList, Organization, WebSite
- Sitemap dinâmico em `/sitemap.xml`
- URLs amigáveis sem IDs
- Canonical em todas as páginas

### RF-502 Analytics
- GTM injetado (sem código) após consentimento
- Eventos: view_item_list, view_item, add_to_cart, remove_from_cart, begin_checkout, add_payment_info, add_shipping_info, purchase, sign_up, login, search
- Meta Pixel + GA4 via GTM

### RF-503 E-mail marketing (estrutura)
- Opt-in no rodapé e checkout
- Tabela `email_subscribers`; integração Brevo/Resend Audiences na Fase 2

---

## RF-600 — LGPD

### RF-601 Consentimento de cookies
- Banner discreto no primeiro acesso
- Aceitar todos / Recusar não-essenciais / Configurar (categorias)
- Scripts não-essenciais só carregam após consentimento

### RF-602 Direitos do titular
- Página `/lgpd` com formulário (acesso, correção, exclusão, portabilidade)
- DPO declarado
- Prazo de resposta 15 dias úteis

### RF-603 Política e termos
- Editáveis no admin (Markdown)
- Versionamento com data visível

---

## RF-700 — Notificações

### RF-701 E-mail (Resend)
- Pedido recebido (aguardando pagamento)
- Pagamento aprovado
- Pedido enviado (com rastreio)
- Pedido entregue
- Carrinho abandonado
- Solicitação de avaliação D+7
- Recuperação de senha
- Verificação de e-mail

### RF-702 WhatsApp (Watidy)
- Pagamento aprovado
- Pedido enviado (rastreio)
- Recuperação D+1

---

## RF-800 — Performance e Confiabilidade

- TTFB < 200ms em rotas cacheadas
- ISR páginas de produto (revalidate 60s)
- Estática home (revalidate on-demand por tag)
- Imagens via `next/image` + Supabase Storage CDN
- Rate limit em login, checkout, cupom
- Health check `/api/health`
- Sentry para erros e tracing

---

## Fora do escopo v1 (declarado)

Multi-loja · Marketplace · Assinatura · Pré-venda · Multi-moeda · Multi-idioma · App nativo · Fidelidade · Afiliados (UI) · ERP Bling · Frete internacional automático.
