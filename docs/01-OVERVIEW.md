# 01 — Overview

## Cliente

**Marca:** Mini VAT Premium
**Proprietário:** Vinícius (dentista, fundador)
**Contato:** vst2002@gmail.com / (62) 99942-9997
**Operação:** Hoje vende em site próprio, ML, Shopee, Amazon, Instagram e WhatsApp
**Faturamento atual:** R$ 50–200 mil/mês
**Vertical:** Acessórios para impressão 3D odontológica

## Produto

Mini VAT é um compartimento miniaturizado para resinas 3D que reduz desperdício de resina e acelera impressões (de 40-60 min para 5-13 min em alguns casos). Vinícius é o **inventor original** do produto (atua em odonto digital desde 2019), e hoje há 3 cópias relevantes no mercado (Meditec, Printek 3D, Mini4.speed).

### Linha (até 20 SKUs no lançamento)

- **Mini VAT PREMIUM** — interior em inox, compatível com qualquer resina
- **Mini VAT STANDARD** — interior plástico, apenas resinas de carga cerâmica
- **VAT EXTRA (avulso)** — tanque adicional, variantes PREMIUM ou STANDARD
- **Mesas de impressão** — específicas por modelo de impressora (muitos SKUs)
- **Resinas 3D** — em revenda (Fase 2)
- **Outros importados** — produtos odontológicos (Fase 2)

### Modelo de dados precisa suportar

- Variantes simples (tipo: PREMIUM/STANDARD)
- Atributos de compatibilidade (modelo de impressora, lista controlada)
- SKU único por variante
- Estoque por variante
- Preço, dimensões e peso por variante (para frete correto)

## Persona

- Dentistas e protéticos
- Brasil e exterior (exportação relevante)
- Já operam ou planejam adquirir impressora 3D resina (SLA/DLP)
- Decisor com autonomia (ticket médio R$ 1.100)
- Consome conteúdo em Instagram, YouTube, grupos profissionais
- Maior atrito: confiar no fabricante (mercado tem cópias de qualidade inferior)

## Diferenciais a comunicar na storefront

1. **Inventor original** — primeiro e mais antigo fabricante de Mini VAT do mundo
2. **Quem fabrica é quem usa** — Vinícius é dentista atuando todo dia
3. **Garantia de 90 dias** (concorrentes oferecem menos)
4. **Inovação contínua** — 5º modelo da linha
5. **Referência internacional** — clientes em múltiplos países

## Objetivos comerciais

| Métrica | Meta |
|---------|------|
| Faturamento mês 1 | R$ 70.000 |
| Faturamento mês 3 | R$ 100.000 |
| Faturamento mês 6 | R$ 150.000 |
| CAC máximo | R$ 20 |
| Ticket médio | R$ 1.100 |
| Margem | 20–40% |

Com ticket R$ 1.100 e CAC R$ 20, **LTV/CAC inicial de 55x** justifica investimento em mídia paga.

## Escopo MVP (Fase 1)

### Storefront
- Home (hero, destaques, prova social, FAQ, footer)
- Listagem por categoria com filtros e ordenação
- Página de produto com galeria, variantes, especificações, compatibilidade, FAQ
- Busca interna
- Carrinho lateral + página dedicada
- One-page checkout
- Conta do cliente (pedidos, dados, endereços, lista de desejos)
- Páginas institucionais (Sobre, Política de Privacidade, Termos, Trocas, Contato)

### Admin
- Login + 2FA opcional
- Dashboard (KPIs e gráficos)
- CRUD de produtos com variantes, imagens, estoque
- Pedidos com etiqueta integrada
- Clientes (visualização + LGPD)
- Cupons (percentual, fixo, frete grátis, por categoria, primeira compra)
- Banners (carrossel da home)
- Frete (regras configuráveis)
- Configurações (dados, scripts analytics sem código, templates de e-mail/WhatsApp, gateways)
- Avaliações com moderação

### Integrações (v1)
- Mercado Pago Bricks (primário)
- PagBank (secundário, switch no admin)
- Melhor Envio (cotação + etiqueta nacional)
- Resend (e-mails transacionais)
- Watidy (WhatsApp)
- GTM (Pixel + GA4 injetados pelo admin sem código)

### Fora do escopo na v1 (Fase 2)
- ERP Bling (sincronização multi-canal)
- Evolution API + n8n (substituindo Watidy)
- Frete internacional automático via Correios SIGEP (v1: tabela manual no admin)
- Multi-idioma (EN/ES)
- Programa de afiliados (estrutura no DB já preparada)
- App mobile nativo
- Assinatura/recompra automática

## Riscos identificados — comunicar ao cliente

1. **Fiscal** — Vinícius opera CPF, não emite NF-e, sem certificado A1. **Bloqueador para lançamento.** Abrir ME/EPP e contratar contador antes do go-live.
2. **Logo só em PNG/JPG** — bloqueia identidade visual. Vetorizar/redesenhar na semana 1.
3. **Data 21/06/2026** — impossível em 2 dias. Renegociar mínimo 45 dias.
4. **Política de troca em rascunho** — bloqueio LGPD/CDC. Finalizar semana 1.
5. **Sem fotos profissionais da maioria dos SKUs** — bloqueia storefront. Agendar sessão semana 2.
6. **Watidy ≠ Evolution API** — manter Watidy via webhook na v1; migração na Fase 2.
7. **Exportação Correios** — Melhor Envio não cobre internacional; v1 entrega cotação manual.

## Direção de UX

Inspiração citada: **Apple, Samsung, Dell**. Tradução:

- Tipografia com personalidade (display + body distintos)
- Paleta sóbria com **um** acento de marca
- Whitespace generoso
- Hero: foto técnica + headline declarativa
- Microcopy específica e honesta
- Mobile-first absoluto (tráfego principal: Instagram)

## KPIs técnicos exigidos

| Métrica | Meta |
|---------|------|
| Lighthouse Performance (mobile) | ≥ 90 |
| LCP (mobile, 4G) | < 2,5s |
| INP | < 200ms |
| CLS | < 0,1 |
| Tempo de checkout (preencher + pagar) | < 90s |
| Uptime | ≥ 99,9% |
| TTFB cacheado (home, categorias) | < 200ms |

## Quem opera depois do lançamento

**Vinícius opera sozinho.** O painel admin precisa ser excepcionalmente claro: sem jargão técnico, tooltips em ações destrutivas, previews antes de publicar, confirmações em ações irreversíveis. Esta é exigência de produto.
