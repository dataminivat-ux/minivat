# 10 — Admin Panel Spec

> Quem opera é o Vinícius, sozinho. **Cada tela é construída para que ele saiba o que fazer sem treinamento.**

## Princípios de UX do admin

1. **Linguagem do negócio, não do banco.** Diz "Em separação", não "processing".
2. **Confirmação em ações irreversíveis.** Excluir produto, reembolsar, cancelar pedido, anonimizar cliente.
3. **Preview antes de publicar.** Banners, produtos, e-mails.
4. **Validação em tempo real.** Forms mostram erro no blur, não só no submit.
5. **Loading states sempre.** Nada de "tela travada".
6. **Empty states acionáveis.** "Nenhum produto. [Cadastrar primeiro produto]"
7. **Atalhos de teclado para power users.** `/` busca, `n` novo, `Esc` fecha modal.
8. **Logs visíveis.** Cada ação importante registra timeline.

## Layout geral

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                  [Buscar] [Vinícius]│
├─────────────────────────────────────────────────────────────┤
│ ┌───────┐                                                   │
│ │Side   │  Breadcrumb > Página atual                        │
│ │bar    │  ─────────────────────────────────────            │
│ │       │                                                   │
│ │Dash   │  [Conteúdo principal]                             │
│ │Prod   │                                                   │
│ │Ped    │                                                   │
│ │Cli    │                                                   │
│ │Cup    │                                                   │
│ │Ban    │                                                   │
│ │Av     │                                                   │
│ │Frt    │                                                   │
│ │Cfg    │                                                   │
│ └───────┘                                                   │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar** retrátil (drawer no mobile). **Header** fixo. Conteúdo scrollável.

## Telas

### 1. `/admin/login`

- E-mail + senha
- "Esqueci a senha"
- Campo TOTP se 2FA habilitado
- Após 5 erros: bloqueio 1h por IP

### 2. `/admin` (Dashboard)

**Cards superiores (4 colunas):**
1. Vendas hoje (R$ + número de pedidos) — comparativo com ontem (% e seta)
2. Vendas semana — comparativo com semana anterior
3. Vendas mês — comparativo com mês anterior + meta R$ 70k em barra de progresso
4. Ticket médio + comparativo

**Gráfico de vendas:** 30 dias (linha), com toggle 7d/30d/90d.

**Pedidos recentes:** tabela com últimos 10 pedidos (nº, cliente, valor, status, tempo). Link para detalhe.

**Alertas:**
- Estoque baixo (variants com `stock <= lowStockThreshold`)
- Pedidos pendentes há > 6h sem envio
- Avaliações pendentes de moderação
- Pix expirados sem nova tentativa
- Atualização de termos pendente (se houver)

### 3. `/admin/produtos`

**Listagem:**
- Tabela: imagem (40×40), nome, categoria, status badge (Rascunho/Ativo/Inativo), variantes count, estoque total, preço (faixa), última atualização, ações
- Filtros: busca por nome/SKU, categoria, status, "com estoque baixo"
- Ordenação: nome, criado em, vendas, estoque
- Ações em lote (checkbox): ativar, desativar, exportar CSV
- Botão "+ Novo produto"
- Paginação 25/50/100

### 4. `/admin/produtos/novo` e `/admin/produtos/[id]`

Formulário multi-step (tabs no topo):

**Tab 1 — Básico:**
- Nome (gera slug automaticamente, editável)
- Slug
- Categoria (select)
- Marca (default "Mini VAT Premium")
- Descrição curta (300 chars)
- Descrição longa (Tiptap)
- Status (Rascunho/Ativo/Inativo)
- Destaque (toggle "produto em destaque na home")
- Selo "Original" (toggle)

**Tab 2 — Variantes:**
- Atributos: tipo (PREMIUM/STANDARD), modelo de impressora (tags multi-select)
- Botão "Gerar combinações" cria SKUs automaticamente
- Tabela editável por variant: SKU, preço, "de" (compareAtPrice), custo, estoque, peso, dim. C×L×A, status
- Estoque com input numérico + botões +1 / -1
- Ação "Ajustar estoque com motivo" abre modal (motivo obrigatório, registra audit_log)

**Tab 3 — Imagens:**
- Drag-and-drop multi-upload (até 10)
- Reorder via drag
- Alt text obrigatório por imagem (validação)
- Imagem principal: estrela na primeira
- Vincular imagem a variant específica (opcional)

**Tab 4 — Especificações:**
- Tabela chave-valor adicionável (ex: "Material interior" → "Aço inox 316L")
- Compatibilidade: lista de modelos de impressora (tags multi-select, com sugestões salvas)

**Tab 5 — SEO:**
- Meta title (com contador 60 chars)
- Meta description (160 chars)
- Preview do Google snippet
- OG image upload (override do automático)

**Footer fixo:** Salvar como rascunho · Visualizar · Publicar (+ confirmação)

### 5. `/admin/pedidos`

**Listagem:**
- Tabela: nº pedido (link), cliente, total, status, pagamento, envio, data
- Status com badge colorido
- Filtros: status (multi), data (range), busca por nº/cliente/CPF, valor mín/máx
- Agregados: pedidos no período, faturamento, ticket médio
- Exportar CSV / XLS

### 6. `/admin/pedidos/[id]`

**Cabeçalho:** nº pedido, data, status atual (badge grande), ações rápidas (cancelar, reembolsar, reenviar e-mail).

**Coluna esquerda (2/3):**
- **Itens:** lista com imagem, nome, variant, qty, unit, total
- **Resumo:** subtotal, desconto, cupom aplicado, frete (serviço + prazo), total
- **Pagamento:** método, status, ID externo (link para painel MP), parcelas, cartão last4 / Pix QR / Boleto
- **Envio:**
  - Endereço completo
  - Serviço selecionado (cotação)
  - Botão "Emitir etiqueta" (se ainda não emitida)
  - Etiqueta gerada: link PDF, código de rastreio (cópia rápida), status MEnvio
  - Botão "Marcar como enviado" (se etiqueta emitida)
- **Timeline:** todas as mudanças de status com timestamp e ator

**Coluna direita (1/3):**
- **Cliente:** nome, e-mail, telefone, CPF/CNPJ. Link para tela do cliente.
- **Marketing attribution:** UTM source/medium/campaign/etc.
- **Notas internas:** caixa de texto + botão "Adicionar nota"
- **Notas do cliente:** caixa read-only (do checkout)

### 7. `/admin/clientes`

**Listagem:**
- Tabela: nome, e-mail, CPF, pedidos, LTV, último pedido, criado em
- Busca por nome/e-mail/CPF
- Filtros: tem pedido, sem pedido nos últimos 90 dias, opt-in marketing
- Exportar CSV (apenas opt-in para uso em e-mail mkt)

### 8. `/admin/clientes/[id]`

- Dados pessoais (read-only — cliente edita pelo conta dele)
- Endereços salvos
- Histórico de pedidos
- LTV, ticket médio, frequência
- Lista de desejos
- Ações: anonimizar (LGPD), exportar dados (LGPD)

### 9. `/admin/cupons`

**Listagem:**
- Tabela: código, tipo (% ou R$ ou frete grátis), valor, usos / limite, validade, status
- Ações: ativar/desativar, duplicar, excluir
- Botão "+ Novo cupom"

### 10. `/admin/cupons/novo` e `/admin/cupons/[id]`

**Form:**
- Código (auto gera nano ID ou manual; uppercase)
- Descrição interna (visível só no admin)
- Tipo: Percentual / Valor fixo / Frete grátis
- Valor (%, R$ ou nada para frete grátis)
- Valor mínimo do pedido (opcional)
- Limite total de usos (opcional)
- Limite por cliente (opcional)
- Restringir a: categorias (multi), produtos (multi), primeira compra (toggle)
- Validade: data início + data fim
- Status (ativo/inativo)
- Preview: "Cliente paga X, economiza Y, frete Z"

### 11. `/admin/banners`

- Lista visual de banners (cards drag-and-drop para ordenar)
- Botão "+ Novo banner"
- Em cada banner: preview desktop + mobile, headline, período, status, ações (editar/duplicar/desativar)

### 12. `/admin/banners/novo` e `/admin/banners/[id]`

**Form:**
- Upload imagem desktop (1920×800) — preview com guides
- Upload imagem mobile (750×900) — preview
- Alt text (obrigatório)
- Headline (opcional)
- Subheadline (opcional)
- CTA texto (ex: "Ver linha PREMIUM")
- CTA URL
- Período: início + fim (deixar fim em branco = sem expiração)
- Ordem de exibição
- Status (ativo/inativo)
- Preview ao vivo desktop + mobile lado a lado

### 13. `/admin/avaliacoes`

- Tabs: Pendentes / Aprovadas / Rejeitadas
- Card por avaliação: produto, cliente, nota, título, comentário, data
- Ações: Aprovar / Rejeitar / Responder (resposta pública vinculada)
- Filtros: produto, nota, data

### 14. `/admin/frete`

**Subseções:**
- **Regras gerais:** frete grátis acima de R$ X (toggle + valor), frete fixo R$ Y (toggle)
- **Transportadoras Melhor Envio:** lista com toggle por serviço (PAC, SEDEX, Jadlog, Loggi, etc.) + ordem de exibição preferida
- **CEP de origem:** input com botão "Buscar" (ViaCEP); persiste em settings
- **Cotação de teste:** input CEP destino + peso/dimensões → roda cotação ao vivo
- **Internacional (manual):** tabela editável por país × faixa de peso = valor + prazo; toggle "habilitar checkout internacional"

### 15. `/admin/configuracoes`

**Tabs:**

**Loja:**
- Razão social, CNPJ, IE, endereço, telefone, e-mail, redes sociais
- Logo (upload SVG/PNG)
- Cores customizadas (opcional override do theme)

**Pagamento:**
- Gateway ativo (radio: Mercado Pago / PagBank)
- MP: public key, access token, webhook secret (mascarados)
- PagBank: token, e-mail, ambiente
- Parcelamento: até X parcelas, valor mín da parcela, juros (toggle)
- Pix: tempo de expiração (default 30min)
- Botão "Testar conexão" para cada provider

**Frete:**
- Melhor Envio: client ID, client secret, access token (com expiração visível), CEP origem, dimensões padrão
- Botão "Testar cotação"

**E-mail:**
- Resend: API key (mascarada), e-mail remetente, nome do remetente
- Templates editáveis (com variáveis disponíveis):
  - Confirmação de pedido
  - Pagamento aprovado
  - Pedido enviado
  - Pedido entregue
  - Carrinho abandonado
  - Solicitação de avaliação
  - Recuperação de senha
- Botão "Enviar teste" em cada template

**WhatsApp (Watidy):**
- API key, instance ID, telefone de origem
- Templates (mesma estrutura dos e-mails)
- Botão "Enviar teste"

**Analytics (sem código):**
- Google Tag Manager ID
- Google Analytics 4 ID
- Meta Pixel ID
- Hotjar ID
- Scripts custom (head/body) — campos texto livre com aviso de risco
- Aviso explícito: "Estes scripts só carregam após consentimento de cookies do visitante (LGPD)."

**LGPD:**
- Política de Privacidade (Markdown editor)
- Termos de Uso (Markdown editor)
- Política de Cookies (Markdown editor)
- Política de Troca/Devolução (Markdown editor)
- DPO: nome, e-mail, telefone
- Cada um versionado com data da última atualização

**Equipe:**
- Lista de admins
- Convidar novo (envia e-mail de convite)
- Editar role (admin / staff)
- Ver último login
- Desativar admin

### 16. `/admin/logs` (Fase 2 — para v1, suficiente Sentry + audit_logs no DB)

---

## Componentes reutilizáveis do admin

- `<DataTable>` — wrapper TanStack Table com paginação, ordenação, filtros, ações em lote
- `<FormField>` — label + input + erro + helper text
- `<MoneyInput>` — formatação BRL em tempo real
- `<MaskedInput>` — CPF/CNPJ, CEP, telefone
- `<RichTextEditor>` — Tiptap com toolbar mínima (bold, italic, links, listas, headings)
- `<ImageUpload>` — drag-and-drop com preview e alt obrigatório
- `<DateRangePicker>` — locale pt-BR
- `<StatusBadge>` — variantes por status de pedido/pagamento
- `<ConfirmDialog>` — modal de confirmação para ações destrutivas (com input de confirmação textual em ações severas)
- `<EmptyState>` — ilustração simples + CTA principal
- `<KpiCard>` — card com número grande, label, delta % e seta
- `<Timeline>` — eventos com timestamp e ator

## Atalhos de teclado (admin)

| Atalho | Ação |
|--------|------|
| `g d` | Ir para dashboard |
| `g p` | Ir para produtos |
| `g o` | Ir para pedidos |
| `g c` | Ir para clientes |
| `/` | Foco na busca |
| `n` | Novo (contexto-aware: novo produto se na lista de produtos, etc) |
| `Esc` | Fechar modal/drawer |
| `Cmd/Ctrl + S` | Salvar (em forms de edição) |

## Mobile

Admin é desktop-first mas precisa funcionar em mobile (Vinícius vai despachar pedidos do celular).

Prioridades mobile:
- Lista de pedidos (ler, filtrar)
- Detalhe do pedido (mudar status, emitir etiqueta)
- Estoque rápido (ajustar stock de uma variant)
- Cadastrar produto rapidinho (mínimo viável)

Listagens viram cards em mobile (não tabela horizontal).
