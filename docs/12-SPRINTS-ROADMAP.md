# 12 — Sprints & Roadmap

> Planejamento por sprints de 1 semana. Total v1: **6 sprints (45 dias úteis ~ 8 semanas calendário)**, considerando feedback do cliente e fotos do produto.

## Premissas

- 1 dev full-time (Diego ou contratado) + Claude Code
- Cliente disponível 2h/semana para reviews
- Sevyn Labs entrega design, copy, foto produto, vetorização do logo em paralelo
- Sandbox de MP, PagBank e Melhor Envio configurados na semana 0

## Pré-requisitos (semana 0 — antes do dev começar)

Estes itens **bloqueiam** o desenvolvimento. Cliente entrega tudo isso:

- [ ] **CNPJ ativo** (MEI/ME) — sem isso não emite NF-e, não recebe pagamentos em CNPJ
- [ ] **Contador definido** com plano de emissão de NF-e
- [ ] **Conta MP** e/ou **PagBank** com credenciais sandbox + produção
- [ ] **Conta Melhor Envio** com saldo para testes
- [ ] **Domínio** apontado (CNAME / A para Cloudflare → Vercel)
- [ ] **Logo em vetor** (SVG, PDF ou AI) — Sevyn vetoriza se necessário
- [ ] **Política de Privacidade, Termos, Trocas** finalizados (Sevyn redige)
- [ ] **CEP de origem** confirmado (estoque do Vinícius)
- [ ] **Endereço fiscal** confirmado
- [ ] **Fotos profissionais** de pelo menos 5 SKUs principais (Sevyn agenda sessão)

## Marcos (milestones)

| Milestone | Sprint | Critério |
|-----------|--------|----------|
| **M0 — Setup pronto** | 1 | Repo, CI, infra, schema, login admin |
| **M1 — Vitrine navegável** | 2 | Storefront público com produtos reais navegáveis |
| **M2 — Checkout funcional** | 3 | Compra Pix completa funcionando (sandbox) |
| **M3 — Admin completo** | 4 | Todas as telas do admin construídas |
| **M4 — Integrações ao vivo** | 5 | MP/PagBank produção + frete real + e-mail/WhatsApp |
| **M5 — Go-live** | 6 | Produção estável, monitorada, com cliente treinado |

---

## Sprint 1 — Fundação (semana 1)

**Objetivo:** Toda a base técnica pronta para os módulos.

### Tarefas

- [ ] Inicializar projeto Next.js 15 + TS + Tailwind 4 + shadcn
- [ ] Configurar ESLint, Prettier, Husky, lint-staged
- [ ] Configurar Sentry (client/server/edge)
- [ ] Criar projeto Supabase (dev/staging/prod)
- [ ] Schema Drizzle completo conforme `docs/05-DATABASE-SCHEMA.md`
- [ ] Migrations + RLS policies + seeds de dev
- [ ] Setup Supabase Auth
- [ ] Auth de admin (login, sessão, role check, 2FA opcional)
- [ ] Layout base do admin (sidebar, header, breadcrumbs)
- [ ] Layout base da storefront (header, footer, cookie banner)
- [ ] Componentes core: shadcn instalados + componentes custom essenciais
- [ ] Theme tokens (cores, tipografia, fontes via next/font)
- [ ] Deploy preview no Vercel funcionando
- [ ] Cloudflare na frente, DNS configurado
- [ ] Health check `/api/health` retornando OK

### Entrega
Demo: login admin → ver "Dashboard vazio". Storefront com layout/cabeçalho/rodapé visível, sem produtos ainda.

---

## Sprint 2 — Catálogo e Vitrine (semana 2)

**Objetivo:** Cliente consegue navegar produtos.

### Tarefas

- [ ] Admin: CRUD de categorias
- [ ] Admin: CRUD de produtos completo (todas as tabs do form)
- [ ] Admin: Upload de imagens (Supabase Storage + variantes 400/800/1600)
- [ ] Admin: Variantes (gerar combinações, ajustar stock)
- [ ] Storefront: home (com hero, destaques, seções estáticas)
- [ ] Storefront: listagem `/categoria/[slug]` com filtros + ordenação + paginação
- [ ] Storefront: página de produto `/produto/[slug]` com galeria + variantes + abas
- [ ] Storefront: busca `/busca`
- [ ] Storefront: páginas institucionais (estrutura — conteúdo no admin)
- [ ] SEO: metadata por rota + sitemap + robots + JSON-LD básico
- [ ] OG image dinâmica `/api/og/[id]`
- [ ] Revalidação on-demand (admin publica → site atualiza)
- [ ] Cliente cadastra 10 produtos reais

### Entrega
Demo: cliente navega site real com produtos reais; admin cadastra novo produto e ele aparece no site em < 5s.

---

## Sprint 3 — Carrinho e Checkout (semana 3)

**Objetivo:** Compra Pix funcionando em sandbox.

### Tarefas

- [ ] Carrinho persistente (cookie anônimo + DB logado)
- [ ] Carrinho lateral (slide-over)
- [ ] Página `/carrinho` com cálculo de frete inline
- [ ] Integração Melhor Envio: cotação real
- [ ] Aplicação de cupom (validação backend)
- [ ] Página `/checkout` (one-page com seções)
- [ ] Auth de cliente (login, cadastro, recuperação)
- [ ] Endereços (CRUD + ViaCEP autocomplete)
- [ ] Integração Mercado Pago: Pix (criar, exibir QR, polling)
- [ ] Webhook MP `/api/webhooks/mercado-pago` com validação HMAC
- [ ] Página `/pedido/[id]/confirmacao`
- [ ] Decremento atômico de estoque
- [ ] E-mails Resend: confirmação + pagamento aprovado
- [ ] Templates React Email + envio de teste

### Entrega
Demo: visitante navega → adiciona → checkout → Pix → paga em sandbox → confirmação + e-mail recebido.

---

## Sprint 4 — Cartão, Admin Pedidos e Configurações (semana 4)

**Objetivo:** Operação completa do admin.

### Tarefas

- [ ] MP Bricks: pagamento com cartão (tokenização cliente + cobrança server)
- [ ] Boleto (geração + e-mail)
- [ ] Tratamento de estados (approved, rejected, in_process, refunded)
- [ ] Admin: Listagem e detalhe de pedidos
- [ ] Admin: Mudança de status manual
- [ ] Admin: Emissão de etiqueta Melhor Envio
- [ ] Admin: Cancelamento e reembolso (MP API)
- [ ] Admin: Listagem de clientes + detalhe + LTV
- [ ] Admin: CRUD de cupons (com restrições)
- [ ] Admin: CRUD de banners (com preview)
- [ ] Admin: Frete (regras + tabela internacional manual)
- [ ] Admin: Configurações (loja, pagamento, frete, e-mail, WhatsApp, analytics, LGPD)
- [ ] Audit logs em ações sensíveis

### Entrega
Demo: cliente cadastra cupom 10% → checkout aplica → admin vê pedido com cupom → emite etiqueta → marca como enviado.

---

## Sprint 5 — Integrações Finais e Polimento (semana 5)

**Objetivo:** Tudo conectado em produção (Watidy, GTM, PagBank, crons).

### Tarefas

- [ ] PagBank: wrapper completo + switch no admin
- [ ] Watidy: wrapper + templates + envio em eventos (pedido pago, enviado, abandonado)
- [ ] GTM: injeção condicional (com consentimento) + dataLayer em todos os eventos
- [ ] Meta Pixel + GA4 via GTM
- [ ] Conta do cliente: pedidos, dados, endereços, wishlist
- [ ] Avaliações: cliente avalia + admin modera
- [ ] Crons: abandoned carts (30min), review requests (10h diário), anonymize-deleted (3h diário), refresh-melhor-envio-token (mensal)
- [ ] E-mails: enviados (abandoned cart, shipping, delivered, review request)
- [ ] WhatsApp: mensagens em eventos
- [ ] LGPD: banner cookies funcional, página /lgpd com formulário, soft delete + anonimização
- [ ] Performance pass: Lighthouse ≥ 90 mobile em home, categoria, produto
- [ ] Acessibilidade pass (axe-core no CI)
- [ ] Bug bash com cliente: lista de ajustes

### Entrega
Demo: ciclo completo em produção sandbox. KPIs técnicos batidos. Cliente aprova UX.

---

## Sprint 6 — Go-live (semana 6)

**Objetivo:** Operação real em produção.

### Tarefas

- [ ] Credenciais de produção: MP, PagBank, Melhor Envio, Resend, Watidy, Sentry
- [ ] DNS final apontado (`minivatpremium.com.br` → Cloudflare → Vercel)
- [ ] Certificado SSL ativo
- [ ] DKIM/SPF/DMARC validados no Resend
- [ ] Webhooks de produção configurados em todos os providers
- [ ] Saldo Melhor Envio carregado
- [ ] Política de Privacidade, Termos, Trocas publicadas (versão 1.0.0)
- [ ] Catálogo final cadastrado (todos os SKUs com fotos reais)
- [ ] Testes E2E em produção (3 pedidos reais com cancelamento controlado)
- [ ] Sitemap submetido no Google Search Console e Bing
- [ ] UptimeRobot apontado para `/api/health`
- [ ] Treinamento do cliente (2h presencial ou call):
  - Cadastrar produto
  - Criar cupom
  - Trocar banner
  - Processar pedido
  - Imprimir etiqueta
  - Responder avaliação
  - Atualizar política
- [ ] Vídeo-tutorial gravado (30min, dividido em capítulos)
- [ ] Manual PDF de operação (Sevyn entrega)
- [ ] Plano de suporte definido (canal, SLA, horário)
- [ ] Comunicação de lançamento (Vinícius nos canais dele)

### Entrega
**LAUNCH.** Site aberto, transacionando dinheiro real, monitorado, cliente capacitado.

---

## Fase 2 — Pós-lançamento (sprints opcionais, contratáveis)

### Sprint 7 (semana 7-8) — Recuperação e CRO
- Recuperação de carrinho avançada (multi-canal sequenciado)
- Upsell/cross-sell no produto e checkout
- Bundles (combos PREMIUM + EXTRA)
- A/B testing infra (Vercel Edge Config)

### Sprint 8 (semana 9-10) — ERP e marketplaces
- Integração Bling (produtos, estoque, pedidos)
- Sincronização com ML/Shopee/Amazon (via Bling)
- NF-e emissão automática (Bling + emissor)

### Sprint 9 (semana 11-12) — Internacionalização
- Frete internacional automático (Correios SIGEP)
- Multi-idioma EN/ES (Next i18n)
- Multi-moeda (apenas display; cobrança em BRL)

### Sprint 10 (semana 13-14) — Evolution API e n8n
- Substituir Watidy por Evolution API (auto-hospedada)
- n8n para automações avançadas (qualificação, segmentação, broadcast)
- Chatbot IA para pré-venda (Anthropic Claude)

### Sprint 11+ — Programa de afiliados, fidelidade, etc.

---

## Riscos do cronograma

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Cliente atrasa fotos | Alta | Bloquear sprint 2 final; usar placeholders no design e substituir depois |
| MP produção exige documentação extra | Média | Iniciar processo na semana 1 (paralelo) |
| Logo em vetor demora | Baixa | Sevyn vetoriza em 2 dias |
| Bug crítico em pagamento perto do go-live | Alta | Período de "beta privado" (sprint 5) com 5 clientes reais antes do go-live público |
| Saldo Melhor Envio insuficiente | Baixa | Carregar R$ 500 mínimo na semana 5 |
| Cliente quer escopo extra mid-sprint | Alta | Documento de escopo assinado; mudanças viram backlog Fase 2 com preço |

---

## Definition of Ready (sprint)

Antes de começar um sprint, garantir:
- [ ] Backlog priorizado e estimado
- [ ] Designs (Figma) prontos para as telas do sprint
- [ ] Copy/conteúdo disponível (mesmo que placeholder)
- [ ] Dependências externas (credenciais, fotos) resolvidas
- [ ] Critérios de aceite escritos para cada tarefa

## Definition of Done (tarefa)

- [ ] Critérios de aceite atendidos
- [ ] Código tipado (Zod + TS, sem `any`)
- [ ] Testado manualmente em mobile + desktop
- [ ] Acessibilidade verificada (axe, navegação por teclado)
- [ ] Performance OK (sem regressão de Lighthouse)
- [ ] Tracking GTM disparando quando aplicável
- [ ] Tratamento de erros + loading states
- [ ] Documentação atualizada (se mudou contrato)
- [ ] PR revisado e aprovado
- [ ] Deploy preview validado pelo cliente quando relevante

---

## Cerimônias

| Cerimônia | Quando | Quem | Duração |
|-----------|--------|------|---------|
| Sprint planning | Segunda 9h | Diego + Vinícius | 30min |
| Daily | Diariamente | Diego (autoreflexão / log) | 5min |
| Sprint review | Sexta 17h | Diego + Vinícius | 45min |
| Retrospectiva | Sexta 17h45 | Diego | 15min (interna Sevyn) |

---

## Comunicação com o cliente

- **Canal principal:** WhatsApp (grupo "Sevyn × Mini VAT")
- **SLA de resposta:** 4h úteis (seg-sex 9-18h BRT)
- **Updates semanais:** sexta-feira 17h, mensagem com print + vídeo curto de 60s do que avançou
- **Aprovações formais:** mensagem clara "Aprovado em [data]" — fica no log do projeto
- **Mudanças de escopo:** sempre por escrito; viram backlog Fase 2 com nova precificação
