# Respostas para o Vinícius — MINI VAT PREMIUM

> **Uso interno (Sevyn Labs / Diego):** este documento responde às 5 perguntas feitas pelo cliente Vinícius no briefing. Pode ser copiado direto para WhatsApp/email ou usado como base do material comercial. As versões "curta" são pra mensagem; "longa" pra proposta formal.

---

## Pergunta 1
> **"Como funciona a gestão da loja? O painel administrativo permite que eu mesmo cadastre produtos, altere preços, crie cupons de desconto e mude banners de forma fácil?"**

### Versão curta (WhatsApp)

Sim, total. Você ganha um painel admin próprio, web, acessível de qualquer dispositivo. Lá dentro você cadastra produtos com fotos, vídeo, preço, variações (PREMIUM/STANDARD, modelo de impressora) e estoque. Cria cupons (% ou valor fixo, com validade, mínimo de compra, restrição por produto). Sobe banners da home arrastando e soltando. Aprova avaliações, vê pedidos com status em tempo real, gera link de rastreio. Tudo sem mexer em código, sem pedir pra ninguém.

### Versão longa (proposta)

O painel é **100% web, responsivo, acessível por usuário e senha próprios**, com permissão por perfil (você administrador + colaboradores se quiser). As áreas que você controla:

- **Produtos:** cadastro completo com nome, descrição rica (formatada), múltiplas imagens com drag-and-drop pra reordenar, vídeo opcional, especificações técnicas, variações (PREMIUM/STANDARD, modelo de impressora compatível), preço por variação, preço "de" para promoção, estoque por variação com aviso de estoque baixo, peso e dimensões para cálculo correto de frete, SEO meta (título e descrição), categoria, tags, status (ativo/inativo/destaque).
- **Categorias:** árvore hierárquica (categoria pai → subcategorias), imagem própria, SEO.
- **Pedidos:** lista filtrável por status, data, cliente. Detalhes completos com itens, endereço, pagamento, histórico de status. Você muda o status manualmente, adiciona código de rastreio (cliente recebe email automático com o link), insere notas internas.
- **Cupons:** cria com código, valor (% ou fixo), validade (de/até), uso máximo total, uso máximo por cliente, valor mínimo de pedido, restrição por produto/categoria, primeira compra apenas.
- **Banners:** envia imagem desktop + mobile separadas, define link de destino, CTA, ordem (drag-and-drop), agendamento (programa pra começar e terminar em data).
- **Avaliações:** aprovação manual antes de publicar (evita spam), resposta opcional.
- **Clientes:** lista com busca, ver histórico de cada um.
- **Configurações:** dados da loja, políticas (privacidade, termos, trocas, frete), regras de parcelamento, frete grátis a partir de X.
- **Dashboard:** faturamento do dia/mês, pedidos pendentes, produtos com estoque baixo, ticket médio.

Tudo isso é entregue treinado: junto da loja vai um **vídeo de 30 minutos** mostrando você operando cada parte, e uma sessão de treinamento ao vivo via WhatsApp/Meet.

---

## Pergunta 2
> **"Esse sistema já tem integração nativa com Checkout Transparente (PagBank/Mercado Pago) e cálculo automático de frete (Melhor Envio)?"**

### Versão curta

Sim. Checkout Transparente do **Mercado Pago** integrado nativo — cliente paga sem sair do seu site (Pix com QR Code, cartão até 6x sem juros, Apple Pay, Google Pay). E o **Melhor Envio** integrado pra calcular frete automaticamente por CEP no carrinho e no checkout, mostrando opções (PAC, SEDEX, Jadlog etc.) com prazo. Depois do pagamento aprovado, dá pra gerar a etiqueta direto pelo painel (Fase 2 totalmente automatizado).

### Versão longa

**Mercado Pago Checkout Transparente:**
- O cliente nunca sai do seu site (diferente do Checkout Pro, que redireciona).
- Métodos aceitos: **Pix** (QR Code + copia/cola, com confirmação em até 5 segundos), **cartão de crédito** (até 6x sem juros configurável por você, com 3D Secure ativo), **cartão de débito**, **Apple Pay**, **Google Pay**.
- Dados do cartão são tokenizados no navegador do cliente — **nunca passam pelo seu servidor**, o que isenta sua loja de PCI DSS.
- Antifraude do MP ativo por padrão.
- Webhook configurado: quando o pagamento muda de status, o sistema atualiza automaticamente, manda email ao cliente, dispara o evento de conversão pro Google/Meta.
- Funciona em sandbox (testes) e produção.

> **Por que Mercado Pago e não PagBank?** Os dois são bons. Mercado Pago foi escolhido porque (a) tem suporte nativo a Apple Pay e Google Pay (o PagBank ainda não), (b) SDK mais maduro e melhor documentado, (c) tem antifraude embutido sem custo extra. Se você quiser PagBank por algum motivo específico, dá pra fazer — só conversamos antes.

**Melhor Envio:**
- Integração via API oficial.
- Cliente digita CEP na PDP ou no checkout → sistema cota em tempo real e mostra opções (PAC, SEDEX, Mini Envios, Jadlog, Loggi, etc.) com prazo e preço.
- Você não precisa configurar cada transportadora separada — o ME consolida tudo.
- O frete é incluído automaticamente no pedido.
- Pós-pagamento, você gera a etiqueta de envio direto no painel: ME imprime, você cola na embalagem, posta no balcão dos Correios ou agência da transportadora.
- Tracking code é enviado ao cliente automaticamente por email quando você confirma o envio.
- **Saldo Melhor Envio:** você precisa recarregar (pré-pago). Aviso quando estiver baixo.

**Importante — exportação:** Melhor Envio cobre **Correios Packet (Standard e Express)** para envio internacional. Essa integração entra na **Fase 2** do projeto, junto com pagamento internacional (Stripe). Fase 1 foca em mercado brasileiro pra estabilizar a operação.

---

## Pergunta 3
> **"Como funciona o SEO nesse sistema próprio? Ele gera automaticamente as tags para o Google e o Sitemap?"**

### Versão curta

Sim, e isso é um dos pontos fortes de construir custom em vez de plataforma fechada. Cada página gera automaticamente: título e descrição (que você edita no painel produto a produto), Open Graph (preview no Instagram/WhatsApp/Facebook), Schema markup (estrelas e preço aparecem direto no Google), Sitemap atualizado em tempo real, URLs limpas tipo `/produtos/mini-vat-premium-anycubic-photon-mono-2`. Performance mobile com nota 90+ no PageSpeed do Google, que é o que mais pesa pra ranquear hoje.

### Versão longa

**SEO técnico nativo:**

1. **Meta tags por página.** Toda página gera automaticamente:
   - `<title>` baseado no que você cadastra (ou geral da loja)
   - `<meta description>` editável produto a produto, com fallback inteligente
   - Tags Open Graph (imagem, título, descrição) — quando alguém cola o link no WhatsApp/Instagram/Facebook, aparece bonito
   - Twitter Cards
   - URL canônica (evita conteúdo duplicado)

2. **Sitemap dinâmico** em `seudominio.com.br/sitemap.xml`. Atualiza sozinho quando você adiciona/remove produto ou categoria. Pode ser enviado direto pro Google Search Console.

3. **Robots.txt** configurado pra deixar o Google indexar o que importa e bloquear áreas privadas (admin, carrinho, checkout).

4. **Schema markup (dados estruturados)** em JSON-LD: 
   - `Product` com preço, disponibilidade, estrelas, marca → aparecem com **estrelas e preço no resultado do Google**
   - `BreadcrumbList` (caminho da categoria → produto)
   - `Organization` (sua marca)
   - `Review` (avaliações dos clientes)
   - `FAQPage` na página de FAQ

5. **URLs amigáveis** tipo `seudominio.com.br/produtos/mini-vat-premium-anycubic-photon-mono-2` — leitura humana e melhor que `?id=4391` que o Mercado Livre usa.

6. **OpenGraph image dinâmica:** quando você compartilha o link de um produto, aparece automaticamente uma imagem bonita com o produto, preço e nome — gerada na hora pelo sistema.

7. **Performance — Core Web Vitals.** O Google ranqueia hoje muito pelo tempo de carregamento. Sua loja vai ter:
   - LCP (Largest Contentful Paint) < 1.8 segundos no mobile
   - CLS (estabilidade visual) < 0.1
   - INP (responsividade) < 200ms
   - Nota Lighthouse mobile > 90
   - Imagens otimizadas automaticamente (formatos modernos AVIF/WebP)
   - Carregamento progressivo (visitor vê algo em < 1s)

8. **Acessibilidade (WCAG AA)** — também ajuda SEO. HTML semântico, alt em todas as imagens, contraste validado.

9. **Setup do Google Search Console** incluído pós-lançamento: a gente verifica o domínio, envia o sitemap, configura país-alvo, monitora indexação na primeira semana.

> **Diferença vs plataforma fechada (Shopify, Nuvemshop, Loja Integrada):** essas plataformas têm SEO "pronto" mas limitado — você não controla 100% das tags, schema markup é genérico, e a performance depende deles. No custom, **você é dono do código** e ele é otimizado especificamente pro seu nicho (odontologia 3D — palavras-chave longas onde se ganha terreno rápido).

---

## Pergunta 4
> **"Se eu precisar instalar um Pixel do Facebook ou uma tag do Google Analytics, eu mesmo consigo fazer pelo painel ou precisa mexer no código?"**

### Versão curta

Resposta direta: **você instala sozinha sem nunca tocar no código.** O sistema usa o **Google Tag Manager** — você configura o Pixel do Facebook, GA4, qualquer tag de remarketing (TikTok, Hotmart, LinkedIn) **direto no painel do Google**, e isso vira ao vivo na sua loja em segundos. Os eventos importantes (visualização de produto, adicionou ao carrinho, comprou, R$ X faturados) já vêm prontos disparando, então o Meta e o Google recebem dados de qualidade desde o primeiro dia.

### Versão longa

**A solução:** o sistema integra com **Google Tag Manager (GTM)** como camada de tags. Funciona assim:

1. **Setup uma vez (a gente faz junto):** você cria conta gratuita no GTM, no Google Analytics 4, e no Meta Business Manager (Facebook). A gente conecta os IDs (`GTM-XXXXXXX`, `G-XXXXXXX`, Pixel ID) no painel da loja, **uma vez**, e pronto.

2. **Depois, você é autônoma:** sempre que quiser adicionar/trocar/parar qualquer tag, vai no painel do GTM (não no painel da loja) e configura lá. Em segundos a tag está ativa no site. **A Sevyn não precisa entrar mais**.

3. **Tags que você pode adicionar sozinha:**
   - Meta Pixel (Facebook + Instagram Ads)
   - Google Ads conversion tracking
   - Google Analytics 4
   - TikTok Pixel
   - LinkedIn Insight Tag
   - Hotjar / Microsoft Clarity (heatmap)
   - Pinterest Tag
   - Twitter/X Pixel
   - Qualquer pixel/tag de qualquer plataforma

4. **Eventos de e-commerce já vêm prontos.** A gente configura na loja todos os eventos que o Google e o Meta entendem:
   - `view_item` — quando alguém vê um produto
   - `add_to_cart` — adicionou ao carrinho
   - `view_cart` — abriu o carrinho
   - `begin_checkout` — iniciou checkout
   - `add_shipping_info` — escolheu frete
   - `add_payment_info` — escolheu pagamento
   - `purchase` — **compra finalizada (com valor exato)** ← o mais importante pra otimizar campanhas
   - `search` — fez busca
   - `sign_up` — se cadastrou
   - `login` — logou

5. **LGPD por padrão:** o sistema usa **Consent Mode v2** do Google. Antes do visitante aceitar cookies, nenhum tracking é disparado. Quando ele aceita, tudo passa a funcionar. Isso te deixa em conformidade com a LGPD e mantém qualidade dos dados.

6. **Camada de tags isolada:** seu código nunca precisa ser tocado pra mudar marketing. Isso significa: você muda a estratégia em campanha, **não tem custo de desenvolvedor**, deploy não trava.

> **Comparando com Shopify:** o Shopify cobra plano caro pra liberar GTM direito. Aqui já vem incluído desde o dia 1.

---

## Pergunta 5
> **"Você tem algum exemplo de loja pronta (link) que use esse sistema em TypeScript para eu ver como é a navegação e o fechamento do pedido?"**

### Versão curta

A stack que vamos usar (**Next.js + TypeScript**) é a mesma do **Nike, Notion, TikTok, Hulu, Walmart** entre outros — então de DNA, sua loja vai ser do mesmo nível técnico desses. Pra ver navegação e checkout fluído, dá uma olhada no [shop.cosmos.so](https://shop.cosmos.so), [vercel.com/templates/next.js/nextjs-commerce](https://vercel.com/templates/next.js/nextjs-commerce) (demo oficial do framework), e a **mvp.minivatpremium.com.br** estará no ar como **staging viva da sua própria loja em 7 dias** — você acompanha a evolução em tempo real. Antes do lançamento oficial, agendamos uma sessão pra você navegar e testar o checkout completo em modo sandbox (pode usar cartão de teste sem cobrar nada).

### Versão longa

**Sobre a tecnologia:** vamos construir com **Next.js 15 (React) + TypeScript + Tailwind**. Esse é o stack que roda hoje:
- **Nike** (todo o nike.com)
- **TikTok** (a versão web)
- **Walmart**
- **Notion**
- **Hulu, HBO Max, Spotify**
- **Vercel**, **OpenAI**, **Anthropic** (sites institucionais)
- Centenas de e-commerces premium independentes

É o stack mais moderno e performático que existe pra loja online hoje. Vantagens práticas:
- Carregamento mais rápido = mais conversão (cada 1s de delay perde ~7% de conversão, dado do Google)
- SEO superior (Server-Side Rendering nativo)
- Code-base portátil (se um dia você quiser trocar de agência, qualquer dev sério mexe)

**Exemplos pra navegar agora:**

1. **[demo.vercel.store](https://demo.vercel.store)** — demo oficial do Next.js Commerce. Veja a velocidade da navegação, o carrinho lateral, o checkout em etapas. Sua loja vai ter essa mesma fluidez.

2. **[shop.cosmos.so](https://shop.cosmos.so)** — exemplo premium minimalista (referência de design clean tipo Apple/Samsung que você citou).

3. **Nike.com** — abra um produto, escolha tamanho, adicione ao carrinho, comece o checkout. A arquitetura que vamos usar é a mesma; o design vai ser adaptado pra você.

4. **Apple.com/store** — observa a galeria de produto, a forma como variações aparecem (cor, tamanho). Vamos seguir o mesmo padrão.

**Sobre VER sua própria loja antes de pagar tudo:**

Esse projeto entrega em **sprints quinzenais com staging viva**. Ou seja, em **7 dias** você já tem `staging.minivatpremium.com.br` rodando com a home + um produto exemplo. Em **14 dias**, tem catálogo completo navegável. Em **21 dias**, tem checkout completo em sandbox (você simula compras com cartão de teste sem cobrar centavo). Em **30 dias**, vai pro ar com domínio definitivo.

Você acompanha a evolução em tempo real, dá feedback, e nada vai pro ar sem você aprovar.

**Sobre clientes Sevyn rodando esse stack:** [a Diego adicionar referências reais com link, ou descrever cases em texto se ainda não houver loja Sevyn pública nessa stack]

---

## Bloco extra — coisas que o briefing pediu mas precisam alinhamento

Anotar essas pendências e levar pro Vinícius **antes** de assinar contrato:

### 1. CPF sem CNPJ
Atualmente Vinícius opera com CPF (00804919100). **Isso impede:**
- Emissão de NF-e modelo 55 (obrigatória pra vender pra outros estados via ecommerce)
- Conta business no Mercado Pago (acesso ao Apple Pay, Google Pay, taxas melhores)
- Split de pagamento avançado
- Antifraude pleno

**Caminho:** abrir **MEI** (até R$ 81 mil/ano) ou **Microempresa** com ajuda de um contador. Custo: ~R$ 100-300/mês de contador. Isso é **pré-requisito** pra ir ao ar com NF.

### 2. Lançamento dia 21/06/2026 é inviável
Você descreveu lançamento "do quinto lote" pra essa data. **Não dá tempo de construir um ecommerce do zero em 2 dias.** Caminho prático:
- Cria um **link de pagamento manual** no Mercado Pago para o lote (15 minutos)
- Divulga no Instagram/grupos com esse link
- Em paralelo, a Sevyn constrói a loja em 30 dias
- Lançamento oficial da loja: ~21 de julho de 2026

### 3. Orçamento R$ 5 mil
O escopo descrito (custom + 10 integrações + IA + exportação) é um projeto de **R$ 15-25k** parcelado. **R$ 5k cobre uma versão simplificada sem várias dessas integrações**, ou é a entrada do projeto completo. Vamos alinhar antes de assinar.

### 4. Logo só em PNG/JPG
Precisamos da logo em **vetor (.svg ou .ai)** pra usar em telas grandes, materiais impressos, favicon. **Oferta Sevyn:** vetorização por R$ X (avulso) — agrega na proposta.

### 5. Fotos profissionais "só de alguns"
Pra premium ranquear no Google e converter no Instagram Ads, **precisa fotos profissionais de todos os SKUs.** Oferta Sevyn: ensaio fotográfico R$ X.
