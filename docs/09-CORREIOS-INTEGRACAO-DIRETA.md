# 09 — Integração direta API Correios + Sistema de Etiqueta

> Este documento é referência completa para a integração direta com a **nova API REST dos Correios (CWS — Correios Web Services)** e o sistema próprio de geração e impressão de etiquetas dentro do projeto Next.js. Substitui parcialmente a dependência do Melhor Envio para envios via Correios e cobre as funcionalidades que o cliente pediu (em referência ao plugin Infixs Correios Automático).

---

## 0. AVISO TÉCNICO CRÍTICO — ler antes de mais nada

Há três bloqueadores comerciais que precisam estar resolvidos **antes** do início da implementação. Sem isso, a integração simplesmente não funciona:

### Bloqueador 1 — Contrato comercial com os Correios é obrigatório

A nova API CWS dos Correios não é mais aberta para consulta anônima — para a utilização na nova API dos Correios, é necessário haver contrato com os Correios. Lojistas que utilizam cotação com os Correios de forma anônima/sem contrato deverão ou contratar os Correios ou utilizar outra forma de entrega. Ou seja: o Vinícius **precisa abrir um contrato comercial** com os Correios. Isso envolve:

1. Cadastro do CNPJ no Correios Empresas (eCorreios).
2. Solicitação de Cartão de Postagem.
3. Habilitação dos serviços contratados (PAC, SEDEX, Mini Envios) e dos serviços de API (`38202` para preços, `38210` para prazos, pré-postagem, SRO etc.).
4. Vigência inicial de 12 meses (renovável).

**Tempo estimado para abertura:** 10-30 dias úteis.

Sem contrato, esta integração não roda. **Pré-requisito comercial não-negociável.**

### Bloqueador 2 — CNPJ é exigência prévia

Não há cadastro pessoa física no Correios Empresas. O Vinícius precisa ter **MEI ou ME ativa** antes de abrir o contrato. Isso já era pendência do projeto (NF-e). Agora é pendência dobrada.

### Bloqueador 3 — DC-e obrigatória desde abril/2026

Desde 6 de abril de 2026 a tradicional Declaração de Conteúdo em papel deixou de ser aceita. As encomendas deverão estar acompanhadas exclusivamente de NF-e/DANFE, quando houver emissão de nota fiscal, ou da Declaração de Conteúdo Eletrônica (DC-e/DACE), nos casos em que não houver NF-e. Caso a chave não seja informada, a DC-e poderá ser emitida pelos próprios Correios, sendo necessária a impressão do Documento Auxiliar da Declaração de Conteúdo Eletrônica (DACE) para afixação no objeto.

Ou seja, **toda postagem precisa de chave de NF-e ou de DC-e na pré-postagem.** Como o Vinícius (no curto prazo) não emite NF-e, todo pedido vai precisar de DC-e emitida. Cobrimos isso na seção 10 deste documento.

### Plano de contingência (até contrato sair)

Enquanto o contrato Correios não está ativo, mantemos **Melhor Envio como cobertura padrão**. O ME tem contrato próprio com os Correios e revende o serviço com markup pequeno. **A integração Correios direta entra como "upgrade" quando o contrato sair**, sem quebrar o fluxo do storefront. Toda a abstração da camada `src/lib/shipping/` é projetada para isso.

---

## 1. Visão geral da integração

```
┌──────────────────────────────────────────────────────────────┐
│              src/lib/shipping/  (camada unificada)           │
│                                                              │
│   getQuotes(cep, items) → ShippingOption[]                   │
│   buyLabel(orderId)     → ShippingLabel                      │
│   trackShipment(code)   → TrackingEvent[]                    │
│                                                              │
│  ┌────────────────────────┐    ┌─────────────────────────┐   │
│  │ providers/correios/    │    │ providers/melhorenvio/  │   │
│  │  - auth (JWT 24h)      │    │  - cotação              │   │
│  │  - preco (38202)       │    │  - carrinho             │   │
│  │  - prazo (38210)       │    │  - etiqueta             │   │
│  │  - prepostagem (PPN)   │    │  - rastreio             │   │
│  │  - sro (rastreio)      │    │                         │   │
│  │  - meucontrato         │    │                         │   │
│  └────────────────────────┘    └─────────────────────────┘   │
│                │                              │              │
│                ▼                              ▼              │
│  ┌────────────────────────┐    ┌─────────────────────────┐   │
│  │ providers/webmaniabr/  │    │ providers/correios-pdf/ │   │
│  │  - DC-e emissão        │    │  - render etiqueta (PDF)│   │
│  │  - DACE PDF            │    │  - render DACE          │   │
│  └────────────────────────┘    └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ /admin/pedidos/[id]    │
              │ /api/admin/orders/[id] │
              │   /shipping-label      │
              └────────────────────────┘
```

**Roteador de provider:** o admin escolhe (`correios` | `melhorenvio` | `automatic`) por pedido. `automatic` decide pelo menor custo + prazo aceitável.

---

## 2. Pré-requisitos do cliente — checklist comercial

Antes do dev começar, providenciar com o Vinícius (responsabilidade dele com suporte da Sevyn):

- [ ] **MEI/ME aberta** com CNPJ válido (pré-requisito de tudo)
- [ ] **Contrato Correios e-commerce ativo** (Correios Log+, Correios Fácil ou similar)
- [ ] **Cartão de Postagem** emitido (o "Cartão Correios Fácil")
- [ ] **Serviços contratados:**
  - [ ] `04510` PAC (ou outro código atual — varia por região/contrato)
  - [ ] `04014` SEDEX
  - [ ] `04227` Mini Envios (recomendado pra peças pequenas — Mini VAT cabe aqui)
  - [ ] `38202` API PREÇOS
  - [ ] `38210` API PRAZOS
  - [ ] API Pré-Postagem habilitada
  - [ ] API SRO (rastreamento) habilitada
- [ ] **Cadastro no portal "Meu Correios" PJ** (`meucorreios.correios.com.br`)
- [ ] **Cadastro no CWS** (`cws.correios.com.br`) e geração de **código de acesso à API**
- [ ] **Conta na WebmaniaBR** ativa (para emissão de DC-e — alternativa: usar o app DC-e dos Correios manualmente, mas inviável em escala)
- [ ] **Endereço de origem (CEP do galpão)** definitivo
- [ ] **Padrão de embalagem** definido (peso e dimensões aproximadas por SKU)

Cada item pendente bloqueia uma etapa específica da implementação. Setup técnico só após **todos** os checks.

---

## 3. Setup CWS — passo a passo

Esses passos o **Diego** executa junto com o Vinícius numa sessão única de ~1 hora:

1. Acessar `https://meucorreios.correios.com.br/` e fazer login com o **IdCorreios** + senha do Vinícius PJ.
2. Acessar `https://cws.correios.com.br/`.
3. No menu lateral, clicar em **"Gestão de acesso a API's"**.
4. Clicar em **"Gerar código de acesso"** → guardar o código (vamos chamar de `CODIGO_ACESSO_API`).
5. Em **"Documentação"**, conferir quais APIs estão liberadas no contrato. Confirmar presença de:
   - `Token` (autenticação)
   - `Preço`
   - `Prazo`
   - `Pré-Postagem`
   - `SRO` (rastreamento)
   - `Meu Contrato`
   - `Busca CEP` (opcional, fallback ViaCEP)
   - `Busca Agências` (opcional)
6. Anotar do Cartão de Postagem físico:
   - `usuario` (geralmente o CNPJ ou IdCorreios)
   - `numero_contrato`
   - `cartao_postagem`
   - `dr` (Diretoria Regional, ex: `10` para DF, `20` para SP, `72` para MG)
7. Repetir passos 3-4 no **ambiente de homologação** `https://cwshom.correios.com.br/` para gerar credenciais de teste.

Resultado guardar em `.env.local` (e Vercel produção):

```
CORREIOS_AMBIENTE=homologacao              # 'homologacao' | 'producao'
CORREIOS_USUARIO=<idcorreios>
CORREIOS_CODIGO_ACESSO=<gerado_no_cws>
CORREIOS_CARTAO_POSTAGEM=<num_cartao>
CORREIOS_CONTRATO=<num_contrato>
CORREIOS_DR=<diretoria_regional>           # ex: 72
CORREIOS_CNPJ=<cnpj_sem_pontos>
```

Endereços base por ambiente:

```ts
// src/lib/shipping/providers/correios/config.ts
export const CORREIOS_BASE = process.env.CORREIOS_AMBIENTE === "producao"
  ? "https://api.correios.com.br"
  : "https://apihom.correios.com.br";
```

---

## 4. Autenticação — API Token

A API Correios usa **Bearer Token** em todas as chamadas restritas. O token é gerado em uma das três modalidades (recomendamos `cartaopostagem` para e-commerce):

| Endpoint | Quando usar |
|---|---|
| `POST /token/v1/autentica` | Token vinculado só ao usuário (mais limitado) |
| `POST /token/v1/autentica/contrato` | Token com permissão de contrato (mais amplo) |
| `POST /token/v1/autentica/cartaopostagem` | **Recomendado** — vinculado ao cartão de postagem |

### Autenticação

Cabeçalho:

```
Authorization: Basic base64({usuario}:{codigo_acesso})
Content-Type: application/json
```

Corpo (para `/contrato`):

```json
{ "numero": "9912345678" }
```

Corpo (para `/cartaopostagem`):

```json
{ "numero": "0070123456" }
```

Resposta:

```json
{
  "id": "...",
  "token": "eyJhbGciOi...",
  "expiraEm": "2026-06-20T15:00:00.000Z",
  "ambiente": "PRODUCAO",
  "cnpj": "99999999000162",
  "contrato": { "numero": "9912345678", "dr": 72 },
  "cartaoPostagem": { "numero": "0070123456" }
}
```

### TokenManager TypeScript

Token válido por ~24h. Cachear no Upstash Redis (já no stack) com TTL de 23h.

```ts
// src/lib/shipping/providers/correios/auth.ts
import { Redis } from "@upstash/redis";
import "server-only";

const redis = Redis.fromEnv();
const KEY = "correios:token";

export class CorreiosAuthError extends Error {}

export async function getCorreiosToken(opts?: { force?: boolean }): Promise<string> {
  if (!opts?.force) {
    const cached = await redis.get<string>(KEY);
    if (cached) return cached;
  }

  const base = process.env.CORREIOS_AMBIENTE === "producao"
    ? "https://api.correios.com.br"
    : "https://apihom.correios.com.br";

  const auth = Buffer.from(
    `${process.env.CORREIOS_USUARIO}:${process.env.CORREIOS_CODIGO_ACESSO}`
  ).toString("base64");

  const res = await fetch(`${base}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ numero: process.env.CORREIOS_CARTAO_POSTAGEM }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new CorreiosAuthError(`Falha auth Correios (${res.status}): ${body}`);
  }

  const data = await res.json() as { token: string; expiraEm: string };
  // cache por 23h (1h antes do real para margem de segurança)
  await redis.set(KEY, data.token, { ex: 23 * 60 * 60 });
  return data.token;
}

/**
 * Wrapper de fetch que injeta Bearer token e re-tenta em 401 com refresh.
 */
export async function correiosFetch(
  path: string,
  init: RequestInit = {},
  retried = false
): Promise<Response> {
  const base = process.env.CORREIOS_AMBIENTE === "producao"
    ? "https://api.correios.com.br"
    : "https://apihom.correios.com.br";
  const token = await getCorreiosToken();

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 && !retried) {
    await redis.del(KEY);
    return correiosFetch(path, init, true);
  }

  return res;
}
```

---

## 5. API Preço — cálculo de frete (serviço 38202)

### Endpoints

| Método | Path | Uso |
|---|---|---|
| `POST` | `/preco/v1/nacional` | Calcula preços nacionais em lote |
| `POST` | `/preco/v1/internacional` | Internacional (Exporta Fácil, CN35) |

### Request (nacional)

```json
{
  "idLote": "uuid-temporario",
  "parametrosProduto": [
    {
      "coProduto": "04510",
      "psObjeto": "300",
      "tpObjeto": "2",
      "comprimento": "20",
      "largura": "15",
      "altura": "5",
      "diametro": "0",
      "cepOrigem": "38400000",
      "cepDestino": "01310100",
      "nuRequisicao": "1"
    }
  ]
}
```

`tpObjeto`: `1` = envelope, `2` = caixa, `3` = cilindro.
`coProduto`: código do serviço (`04510` PAC, `04014` SEDEX, `04227` Mini Envios — confirmar com cartão).

### Wrapper

```ts
// src/lib/shipping/providers/correios/preco.ts
import { correiosFetch } from "./auth";

export interface PrecoItem {
  servico: string;        // '04510' | '04014' | '04227'
  pesoG: number;
  comprimentoCm: number;
  larguraCm: number;
  alturaCm: number;
  diametroCm?: number;
  tipoObjeto?: "envelope" | "caixa" | "cilindro";
}

export interface PrecoQuery {
  cepOrigem: string;
  cepDestino: string;
  itens: PrecoItem[];
}

export async function calcularPreco(q: PrecoQuery) {
  const params = q.itens.map((it, idx) => ({
    coProduto: it.servico,
    psObjeto: String(Math.max(it.pesoG, 1)),
    tpObjeto: it.tipoObjeto === "envelope" ? "1" : it.tipoObjeto === "cilindro" ? "3" : "2",
    comprimento: String(it.comprimentoCm),
    largura: String(it.larguraCm),
    altura: String(it.alturaCm),
    diametro: String(it.diametroCm ?? 0),
    cepOrigem: q.cepOrigem.replace(/\D/g, ""),
    cepDestino: q.cepDestino.replace(/\D/g, ""),
    nuRequisicao: String(idx + 1),
  }));

  const res = await correiosFetch("/preco/v1/nacional", {
    method: "POST",
    body: JSON.stringify({ idLote: crypto.randomUUID(), parametrosProduto: params }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Correios preço falhou (${res.status}): ${err}`);
  }

  return (await res.json()) as Array<{
    coProduto: string;
    pcFinal: string;   // ex: "23,50"
    pcBase: string;
    nuRequisicao: string;
    txErro?: string;
    msgErro?: string;
  }>;
}
```

### Cache

Reaproveitar `shipping_quotes_cache` (já no schema). Chave hash de `(provider, cepOrigem, cepDestino, itens)`, TTL 5 min.

---

## 6. API Prazo — prazo de entrega (serviço 38210)

Igual estrutura, endpoint `/prazo/v1/nacional`.

```ts
// src/lib/shipping/providers/correios/prazo.ts
import { correiosFetch } from "./auth";

export async function calcularPrazo(q: {
  cepOrigem: string;
  cepDestino: string;
  servicos: string[];   // ['04510', '04014']
}) {
  const params = q.servicos.map((s, i) => ({
    coProduto: s,
    cepOrigem: q.cepOrigem.replace(/\D/g, ""),
    cepDestino: q.cepDestino.replace(/\D/g, ""),
    nuRequisicao: String(i + 1),
  }));

  const res = await correiosFetch("/prazo/v1/nacional", {
    method: "POST",
    body: JSON.stringify({ idLote: crypto.randomUUID(), parametrosPrazo: params }),
  });

  if (!res.ok) throw new Error(`Correios prazo falhou (${res.status})`);

  return (await res.json()) as Array<{
    coProduto: string;
    prazoEntrega: number;
    dataMaxEntrega: string;
    entregaSabado: "S" | "N";
    nuRequisicao: string;
    txErro?: string;
  }>;
}
```

### Combinar preço + prazo

`getQuotes()` em `src/lib/shipping/index.ts` chama `calcularPreco` + `calcularPrazo` em paralelo (`Promise.all`) e mescla.

```ts
// src/lib/shipping/providers/correios/quote.ts
import { calcularPreco } from "./preco";
import { calcularPrazo } from "./prazo";

export async function correiosQuote(input: {
  cepDestino: string;
  itensConsolidados: { pesoG: number; comprimentoCm: number; larguraCm: number; alturaCm: number };
  servicos?: string[];
}) {
  const servicos = input.servicos ?? ["04510", "04014", "04227"];
  const cepOrigem = process.env.MELHORENVIO_FROM_CEP!;   // mesmo CEP

  const itens = servicos.map(s => ({
    servico: s,
    ...input.itensConsolidados,
  }));

  const [precos, prazos] = await Promise.all([
    calcularPreco({ cepOrigem, cepDestino: input.cepDestino, itens }),
    calcularPrazo({ cepOrigem, cepDestino: input.cepDestino, servicos }),
  ]);

  return servicos.map((s, i) => {
    const p = precos.find(p => p.coProduto === s);
    const z = prazos.find(z => z.coProduto === s);
    return {
      provider: "correios" as const,
      service: s,
      name: SERVICE_NAMES[s] ?? s,
      priceCents: p ? Math.round(parseFloat(p.pcFinal.replace(",", ".")) * 100) : null,
      deliveryDays: z?.prazoEntrega ?? null,
      saturday: z?.entregaSabado === "S",
      error: p?.txErro || z?.txErro,
    };
  }).filter(q => !q.error);
}

const SERVICE_NAMES: Record<string, string> = {
  "04510": "PAC",
  "04014": "SEDEX",
  "04227": "Mini Envios",
};
```

---

## 7. API Pré-Postagem (PPN) — geração da etiqueta digital

A pré-postagem é o ato de **registrar o objeto na PPN dos Correios antes da postagem física**. O resultado é um **código de rastreio definitivo** + dados para impressão.

### Endpoints principais

| Método | Path | Uso |
|---|---|---|
| `POST` | `/prepostagem/v1/prepostagens` | Cria pré-postagem |
| `GET` | `/prepostagem/v1/prepostagens/{id}` | Consulta |
| `DELETE` | `/prepostagem/v1/prepostagens/{id}` | Cancela (antes da postagem) |
| `POST` | `/prepostagem/v1/prepostagens/{id}/rotulo` | Solicita rótulo (etiqueta) |
| `GET` | `/prepostagem/v1/prepostagens/{id}/rotulo` | Baixa rótulo PDF |

### Request

```json
{
  "idCorreios": "...",
  "remetente": {
    "nome": "MINI VAT PREMIUM",
    "cnpj": "99999999000162",
    "endereco": { "cep": "38400000", "logradouro": "Rua X", "numero": "100", "bairro": "Centro", "cidade": "Uberlândia", "uf": "MG" }
  },
  "destinatario": {
    "nome": "Renato Silva",
    "cpf": "12345678900",
    "telefone": "11999990000",
    "email": "renato@dominio.com",
    "endereco": { "cep": "01310100", "logradouro": "Av. Paulista", "numero": "1000", "complemento": "Apto 5", "bairro": "Bela Vista", "cidade": "São Paulo", "uf": "SP" }
  },
  "objeto": {
    "codigoObjeto": "",
    "codigoServico": "04510",
    "pesoG": 300,
    "comprimentoCm": 20,
    "larguraCm": 15,
    "alturaCm": 5,
    "valorDeclaradoCents": 12990,
    "servicoAdicional": ["025"]
  },
  "chaveNFe": null,
  "chaveDCe": "00000000000000000000000000000000000000000000",
  "observacao": "Pedido MVP-2026-000123"
}
```

Observe:
- Sem **`chaveNFe`** ou **`chaveDCe`** a PPN rejeita desde 06/04/2026.
- `valorDeclaradoCents` aciona seguro (serviço adicional `025` — Valor Declarado).
- `codigoObjeto` vem vazio na criação; o Correios devolve o código de rastreio definitivo na resposta.

### Wrapper

```ts
// src/lib/shipping/providers/correios/prepostagem.ts
import { correiosFetch } from "./auth";

export async function criarPrePostagem(payload: PrePostagemPayload) {
  const res = await correiosFetch("/prepostagem/v1/prepostagens", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Correios pré-postagem falhou (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as PrePostagemResponse;
}

export async function baixarRotulo(prePostagemId: string): Promise<Buffer> {
  // O endpoint retorna PDF binário, NÃO JSON
  const res = await correiosFetch(`/prepostagem/v1/prepostagens/${prePostagemId}/rotulo`, {
    method: "GET",
    headers: { Accept: "application/pdf" },
  });
  if (!res.ok) throw new Error(`Falha ao baixar rótulo (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

export async function cancelarPrePostagem(prePostagemId: string) {
  const res = await correiosFetch(`/prepostagem/v1/prepostagens/${prePostagemId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Falha ao cancelar (${res.status})`);
}
```

### Fluxo no admin

`POST /api/admin/orders/[id]/shipping-label` (já existia para Melhor Envio — agora com dispatcher):

1. Verifica que pedido está `paid` e ainda sem `shipments`.
2. Identifica provider escolhido (`correios` | `melhorenvio`).
3. **Se Correios:**
   - Verifica que `tax_invoices.chave_dce` ou `chave_nfe` está preenchido. Se não, **chama o fluxo DC-e (seção 10) primeiro**.
   - Monta payload.
   - Chama `criarPrePostagem`.
   - Salva em `shipments` (campos `correios_prepostagem_id`, `tracking_code`, `me_label_id = null`).
   - Chama `baixarRotulo`, salva PDF em Supabase Storage bucket `private/labels/{orderId}.pdf`.
   - Atualiza `orders.status = 'processing'`.
4. Retorna URL signed do PDF + tracking code.

---

## 8. API SRO — Rastreamento

Endpoint principal:

```
GET /srorastro/v1/objetos/{codigo}?resultado=T
```

`resultado=T` traz todos os eventos; `U` traz só o último.

### Wrapper

```ts
// src/lib/shipping/providers/correios/sro.ts
import { correiosFetch } from "./auth";

export interface RastroEvento {
  codigo: string;
  tipo: string;        // 'PO' postado, 'BDE' baixa entregue, etc.
  descricao: string;
  dtHrCriado: string;  // ISO
  unidade?: { nome: string; cidade: string; uf: string };
}

export async function rastrearObjeto(codigo: string): Promise<RastroEvento[]> {
  const res = await correiosFetch(
    `/srorastro/v1/objetos/${encodeURIComponent(codigo)}?resultado=T`,
    { method: "GET" }
  );
  if (!res.ok) throw new Error(`SRO falhou (${res.status})`);
  const data = await res.json();
  return (data?.objetos?.[0]?.eventos ?? []) as RastroEvento[];
}
```

### Mapa de eventos → status interno

```ts
// src/lib/shipping/providers/correios/event-mapping.ts
export const SRO_TO_INTERNAL: Record<string, string> = {
  PO: "posted",            // postado
  RO: "in_transit",        // em trânsito
  DO: "in_transit",        // saída para entrega
  OEC: "out_for_delivery", // saiu para entrega
  BDE: "delivered",        // entrega efetuada
  BDI: "delivered",        // entrega efetuada (mão própria)
  BDR: "returned",         // devolvido
  LDI: "lost",             // objeto entregue por engano (raro)
};

export function mapEvento(tipo: string): string | null {
  return SRO_TO_INTERNAL[tipo] ?? null;
}
```

### Atualização automática (cron)

SRO **não tem webhook nativo**. Implementar polling via Vercel Cron:

```ts
// src/app/api/cron/track-shipments/route.ts
import { rastrearObjeto, mapEvento } from "@/lib/shipping/providers/correios";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // proteção: header secret do Vercel cron
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supa = createServiceClient();
  const { data: shipments } = await supa
    .from("shipments")
    .select("id, tracking_code, order_id, status")
    .not("tracking_code", "is", null)
    .neq("status", "delivered")
    .neq("status", "returned")
    .limit(50);

  for (const s of shipments ?? []) {
    try {
      const eventos = await rastrearObjeto(s.tracking_code!);
      const ultimoTipo = eventos[0]?.tipo;
      const novoStatus = ultimoTipo ? mapEvento(ultimoTipo) : null;

      if (novoStatus && novoStatus !== s.status) {
        await supa.from("shipments").update({
          status: novoStatus,
          tracking_events: eventos,
          ...(novoStatus === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
        }).eq("id", s.id);

        if (novoStatus === "delivered") {
          await supa.from("orders").update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          }).eq("id", s.order_id);

          // dispara e-mail "como foi sua experiência"
          // ...
        }
      }
    } catch (err) {
      console.error(`Falha rastreio ${s.tracking_code}`, err);
      // Sentry capture, continua próximo
    }
  }

  return Response.json({ processed: shipments?.length ?? 0 });
}
```

`vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/track-shipments", "schedule": "0 */6 * * *" }
  ]
}
```

A cada 6h, atualiza até 50 envios não-finais. Em produção ajustar pra paginar mais.

---

## 9. DC-e — Declaração de Conteúdo Eletrônica

### Por que importa

Desde 06/04/2026, **toda postagem sem NF-e exige chave DC-e**. Como o Vinícius (no curto prazo) não emite NF-e, **toda venda no e-commerce vai gerar uma DC-e antes da pré-postagem**.

### Caminhos possíveis

#### Caminho A — WebmaniaBR (**recomendado**)

API REST simples. Já está no plano de Fase 2 do projeto pra NF-e, então a conta vai existir.

- Endpoint: `POST https://api.webmania.com.br/2/dce/emissao/`
- Auth: Bearer Token gerado no painel WebmaniaBR.
- Retorno: chave, XML, URL do **DACE** (PDF auxiliar).

```ts
// src/lib/shipping/providers/webmaniabr/dce.ts
const WM_BASE = "https://api.webmania.com.br";

export async function emitirDCe(input: DCeInput): Promise<DCeResponse> {
  const res = await fetch(`${WM_BASE}/2/dce/emissao/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WEBMANIA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ID: input.orderNumber,                    // ID externo do pedido
      ambiente: process.env.NODE_ENV === "production" ? 1 : 2,  // 1 prod, 2 homolog
      url_notificacao: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/webmania/dce`,
      emitente: {
        cnpj: process.env.CORREIOS_CNPJ!,
        razao_social: "MINI VAT PREMIUM",
        logradouro: "...",  // dados de site_settings
        numero: "...",
        bairro: "...",
        codigo_municipio: "...",  // IBGE
        municipio: "...",
        uf: "...",
        cep: "...",
      },
      cliente: input.cliente,
      produtos: input.produtos.map(p => ({
        descricao: p.nome,
        ncm: p.ncm ?? "84219999",
        quantidade: p.quantidade,
        valor_unitario: p.precoCents / 100,
      })),
      transporte: {
        valor_frete: input.freteCents / 100,
        peso_liquido: input.pesoG / 1000,
        peso_bruto: input.pesoG / 1000,
      },
    }),
  });

  if (!res.ok) throw new Error(`Webmania DC-e falhou (${res.status})`);
  return res.json();
}
```

Resposta típica:

```json
{
  "ID": "MVP-2026-000123",
  "uuid": "00000000-0000-0000-0000-000000000000",
  "chave": "00000000000000000000000000000000000000000000",
  "status": "aprovado",
  "xml": "https://api.webmania.com.br/xmldce/[chave]",
  "dace": "https://api.webmania.com.br/dace/[chave]"
}
```

#### Caminho B — App DC-e Correios (manual)

Apenas como fallback de emergência se a Webmania estiver fora ou se o Vinícius não tiver a conta. Não escala — o Vinícius teria que abrir o app DC-e do celular e emitir a mão a cada pedido.

#### Caminho C — Aguardar API DC-e oficial dos Correios (futuro)

Os Correios disseram que vão lançar endpoint próprio na CWS pra emitir DC-e. Quando lançar, abstraímos no mesmo provider e trocamos.

### Schema novo no banco

Adicionar tabela `tax_invoices` (já citada na Fase 2; antecipamos aqui):

```sql
create type tax_invoice_type as enum ('nfe', 'dce');
create type tax_invoice_status as enum ('pending', 'authorized', 'rejected', 'cancelled');

create table public.tax_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  type tax_invoice_type not null,
  status tax_invoice_status not null default 'pending',
  provider text not null default 'webmaniabr',  -- 'webmaniabr' | 'correios'
  external_id text,                              -- uuid da Webmania
  chave text,                                    -- chave de 44 dígitos
  xml_url text,
  dace_url text,                                 -- PDF auxiliar
  raw_response jsonb,
  emitted_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tax_invoices_order_idx on public.tax_invoices(order_id);
create unique index tax_invoices_chave_unique on public.tax_invoices(chave) where chave is not null;
```

RLS:

```sql
alter table public.tax_invoices enable row level security;
create policy "user reads own invoices" on public.tax_invoices
  for select using (
    exists (select 1 from public.orders o
      where o.id = tax_invoices.order_id
        and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "admin manages invoices" on public.tax_invoices
  for all using (public.is_admin()) with check (public.is_admin());
```

### Webhook de retorno

DC-e é assíncrona — a SEFAZ pode demorar alguns segundos pra aprovar. Webmania chama `url_notificacao` quando muda status:

```ts
// src/app/api/webhooks/webmania/dce/route.ts
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: Request) {
  // Validar token compartilhado simples (Webmania não tem HMAC nativo)
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.WEBMANIA_WEBHOOK_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const supa = createServiceClient();

  await supa.from("tax_invoices").update({
    status: body.status === "aprovado" ? "authorized" : "rejected",
    chave: body.chave,
    xml_url: body.xml,
    dace_url: body.dace,
    raw_response: body,
    emitted_at: body.status === "aprovado" ? new Date().toISOString() : null,
    rejected_reason: body.status !== "aprovado" ? body.motivo : null,
  }).eq("external_id", body.uuid);

  // Se aprovou, dispara a pré-postagem automaticamente
  if (body.status === "aprovado") {
    // enfileira job (Vercel Edge function) ou chama síncrono se OK
  }

  return new Response("ok", { status: 200 });
}
```

### Fluxo completo de envio (atualizado)

```
Pedido pago
    │
    ▼
Admin clica "Gerar etiqueta"
    │
    ▼
Pedido tem NF-e cadastrada?
    ├─ Sim ──┐
    │       ▼
    │   Cria pré-postagem com chaveNFe
    │       
    └─ Não ──┐
            ▼
        Cria DC-e (Webmania) ─── webhook aprova ───┐
                                                   ▼
                                          Cria pré-postagem com chaveDCe
                                                   │
                                                   ▼
                                          Baixa rótulo PDF
                                                   │
                                                   ▼
                                          Salva tracking_code
                                                   │
                                                   ▼
                                          orders.status = 'processing'
                                                   │
                                                   ▼
                                          E-mail "seu pedido foi etiquetado"
                                                   │
                                                   ▼
                                          Vinícius imprime + cola na embalagem
                                                   │
                                                   ▼
                                          Posta nos Correios
                                                   │
                                                   ▼
                                          Cron rastreia evento PO
                                                   │
                                                   ▼
                                          orders.status = 'shipped'
                                                   │
                                                   ▼
                                          E-mail "seu pedido foi postado"
                                                   │
                                                   ▼
                                          ... eventos SRO ...
                                                   │
                                                   ▼
                                          BDE → orders.status = 'delivered'
                                                   │
                                                   ▼
                                          E-mail "como foi sua experiência?"
```

---

## 10. Sistema de etiqueta — render próprio (PDF)

Há duas opções pra ter a etiqueta na mão:

### Opção 1 — Usar o PDF que a API dos Correios devolve

`GET /prepostagem/v1/prepostagens/{id}/rotulo` retorna PDF pronto no padrão Correios. Vantagens: padronizado, código 2D oficial, aceito sem questionamento. Desvantagens: **não dá pra customizar** (sem logo da loja, sem campos extras).

### Opção 2 — Renderizar etiqueta própria (Etiqueta Builder)

Pegar os dados da pré-postagem (incluindo o código de rastreio + payload do objeto 2D) e renderizar PDF próprio com identidade visual. **Esse é o "Etiqueta Builder" que o plugin Infixs oferece.**

### Decisão recomendada

**Implementar as duas, e o admin escolhe.** Por padrão, o template oficial Correios. Quem quiser personalizar, ativa o template próprio.

### Stack para render

Recomendo **`@react-pdf/renderer`** — declarativo, integra naturalmente com Next.js, suporta múltiplas etiquetas por página, SVG nativo. Alternativas: PDFKit (imperativo, mais flexível), Puppeteer (render HTML→PDF, mais pesado).

```bash
pnpm add @react-pdf/renderer
```

### Especificação técnica da etiqueta Correios

- **Tamanho padrão:** 100mm × 150mm (etiqueta térmica) ou A4 com até 4 etiquetas (papel adesivo)
- **Elementos obrigatórios** (CONFAZ + Correios):
  - Logo/identificação do remetente
  - Nome e endereço completo do remetente
  - Nome, endereço completo e telefone do destinatário
  - Código de rastreio (linha alfanumérica)
  - **Código 2D** (DataMatrix) — devolvido pela API na pré-postagem
  - Código de barras CODE128 do tracking
  - Tipo de serviço (PAC/SEDEX/Mini)
  - Peso declarado
  - Número da pré-postagem (PLP)
  - **Chave de DC-e ou NF-e** (texto + QR de acesso)
  - Selo "Correios" ou logo do parceiro
- **Estética:** preto e branco, fontes legíveis, ≥ 300 DPI quando impresso

### Componente

```tsx
// src/lib/shipping/labels/CorreiosLabel.tsx
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface Props {
  trackingCode: string;
  service: "PAC" | "SEDEX" | "Mini Envios";
  weightG: number;
  remetente: Address;
  destinatario: Address;
  codigo2DBase64: string;     // datamatrix vindo da Correios API
  codigoBarrasBase64: string; // CODE128 do tracking
  chaveDCe?: string;
  chaveNFe?: string;
  logoUrl?: string;
  orderNumber: string;
}

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica" },
  label: {
    width: "100mm", height: "150mm",
    border: "1pt solid #000", padding: 6, position: "relative",
  },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "1pt solid #000", paddingBottom: 4 },
  service: { fontSize: 14, fontWeight: "bold" },
  block: { marginTop: 6, fontSize: 8 },
  label2: { fontSize: 7, color: "#666", textTransform: "uppercase" },
  text: { fontSize: 9 },
  tracking: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginVertical: 6 },
  barcode: { height: 32, marginVertical: 4 },
  datamatrix: { width: 70, height: 70, alignSelf: "center" },
  footer: { position: "absolute", bottom: 6, left: 6, right: 6, fontSize: 7, textAlign: "center", borderTop: "1pt solid #000", paddingTop: 4 },
});

export function CorreiosLabel(p: Props) {
  return (
    <Document>
      <Page size={[283.46, 425.20]} style={s.page}>  {/* 100mm x 150mm em pt */}
        <View style={s.label}>
          <View style={s.header}>
            {p.logoUrl && <Image src={p.logoUrl} style={{ height: 20 }} />}
            <Text style={s.service}>{p.service}</Text>
          </View>

          <View style={s.block}>
            <Text style={s.label2}>De</Text>
            <Text style={s.text}>{p.remetente.nome}</Text>
            <Text style={s.text}>
              {p.remetente.logradouro}, {p.remetente.numero}
              {p.remetente.complemento ? ` ${p.remetente.complemento}` : ""}
            </Text>
            <Text style={s.text}>{p.remetente.bairro}</Text>
            <Text style={s.text}>{p.remetente.cidade} - {p.remetente.uf}</Text>
            <Text style={s.text}>CEP {p.remetente.cep}</Text>
          </View>

          <View style={[s.block, { borderTop: "1pt solid #000", paddingTop: 4 }]}>
            <Text style={s.label2}>Para</Text>
            <Text style={[s.text, { fontWeight: "bold", fontSize: 11 }]}>
              {p.destinatario.nome}
            </Text>
            <Text style={s.text}>
              {p.destinatario.logradouro}, {p.destinatario.numero}
              {p.destinatario.complemento ? ` ${p.destinatario.complemento}` : ""}
            </Text>
            <Text style={s.text}>{p.destinatario.bairro}</Text>
            <Text style={s.text}>{p.destinatario.cidade} - {p.destinatario.uf}</Text>
            <Text style={[s.text, { fontWeight: "bold" }]}>CEP {p.destinatario.cep}</Text>
            {p.destinatario.telefone && <Text style={s.text}>Tel: {p.destinatario.telefone}</Text>}
          </View>

          <Text style={s.tracking}>{p.trackingCode}</Text>

          <Image src={`data:image/png;base64,${p.codigoBarrasBase64}`} style={s.barcode} />

          <Image src={`data:image/png;base64,${p.codigo2DBase64}`} style={s.datamatrix} />

          <View style={s.footer}>
            <Text>Pedido {p.orderNumber} · {p.weightG}g</Text>
            {p.chaveDCe && <Text>DC-e: {p.chaveDCe}</Text>}
            {p.chaveNFe && <Text>NF-e: {p.chaveNFe}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

### Render server-side

```ts
// src/app/api/admin/orders/[id]/etiqueta/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { CorreiosLabel } from "@/lib/shipping/labels/CorreiosLabel";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";

const Query = z.object({
  template: z.enum(["correios", "custom"]).default("custom"),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const { template } = Query.parse({ template: url.searchParams.get("template") ?? "custom" });

  const supa = createServiceClient();
  // verificar role admin via middleware (já feito) ou aqui

  const { data: order } = await supa.from("orders")
    .select(`
      id, order_number, customer_name, customer_phone,
      shipping_address, total_cents,
      shipments(*),
      tax_invoices(chave, type)
    `).eq("id", id).single();

  if (!order || !order.shipments?.[0]) {
    return new Response("Sem pré-postagem", { status: 404 });
  }
  const shipment = order.shipments[0];

  // Se template oficial Correios: redireciona pro PDF da API
  if (template === "correios") {
    const { baixarRotulo } = await import("@/lib/shipping/providers/correios/prepostagem");
    const pdf = await baixarRotulo(shipment.correios_prepostagem_id!);
    return new Response(pdf, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="etiqueta-${order.order_number}.pdf"` },
    });
  }

  // Template custom
  const buffer = await renderToBuffer(
    <CorreiosLabel
      trackingCode={shipment.tracking_code!}
      service={shipment.service as any}
      weightG={shipment.weight_g ?? 0}
      remetente={await loadRemetente(supa)}
      destinatario={order.shipping_address as any}
      codigo2DBase64={shipment.correios_datamatrix_base64!}
      codigoBarrasBase64={shipment.correios_barcode_base64!}
      chaveDCe={order.tax_invoices?.find(t => t.type === "dce")?.chave ?? undefined}
      chaveNFe={order.tax_invoices?.find(t => t.type === "nfe")?.chave ?? undefined}
      logoUrl={`${process.env.NEXT_PUBLIC_APP_URL}/logo-etiqueta.png`}
      orderNumber={order.order_number}
    />
  );

  return new Response(buffer, {
    headers: { "Content-Type": "application/pdf" },
  });
}
```

### Etiquetas em lote (A4)

Componente que recebe `orders[]` e renderiza 4 etiquetas por página A4 (210mm × 297mm) ou 2 por página A5. Útil pra Vinícius imprimir o batch do dia de uma vez.

```tsx
// src/lib/shipping/labels/BatchLabels.tsx
export function BatchLabels({ items, perPage = 4 }: { items: LabelData[]; perPage?: 2 | 4 }) {
  const pages: LabelData[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return (
    <Document>
      {pages.map((page, idx) => (
        <Page key={idx} size="A4" style={{ padding: 10, flexDirection: "row", flexWrap: "wrap" }}>
          {page.map((d, j) => (
            <View key={j} style={{ width: "50%", height: perPage === 4 ? "50%" : "100%", padding: 2 }}>
              <CorreiosLabelInner {...d} />
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
```

### Customização pelo admin (Etiqueta Builder)

Tabela `shipping_label_templates`:

```sql
create table public.shipping_label_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  show_logo boolean not null default true,
  show_chave boolean not null default true,
  show_order_number boolean not null default true,
  show_phone boolean not null default true,
  custom_header text,                -- texto opcional acima da etiqueta
  custom_footer text,                -- texto opcional rodapé ("Obrigado pela preferência")
  paper_size text not null default '100x150',  -- '100x150' | 'A4_4' | 'A4_2'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipping_label_templates enable row level security;
create policy "admin manages templates" on public.shipping_label_templates
  for all using (public.is_admin()) with check (public.is_admin());
```

Tela `/admin/configuracoes/frete/etiquetas` com preview ao vivo. Componente `<CorreiosLabel />` recebe o template como prop e condiciona cada bloco.

---

## 11. Extensões no schema do banco

Migration `0010_correios_integration.sql`:

```sql
-- Estender shipments para Correios direto
alter table public.shipments
  add column if not exists provider text not null default 'melhorenvio',  -- 'melhorenvio' | 'correios'
  add column if not exists correios_prepostagem_id text,
  add column if not exists correios_datamatrix_base64 text,
  add column if not exists correios_barcode_base64 text,
  add column if not exists weight_g integer,
  add column if not exists tracking_events jsonb;

create index if not exists shipments_provider_idx on public.shipments(provider);

-- Tabela DC-e/NF-e (antecipada da Fase 2)
create type if not exists tax_invoice_type as enum ('nfe', 'dce');
create type if not exists tax_invoice_status as enum ('pending', 'authorized', 'rejected', 'cancelled');

create table if not exists public.tax_invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  type tax_invoice_type not null,
  status tax_invoice_status not null default 'pending',
  provider text not null default 'webmaniabr',
  external_id text,
  chave text,
  xml_url text,
  dace_url text,
  raw_response jsonb,
  emitted_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tax_invoices_order_idx on public.tax_invoices(order_id);
create unique index tax_invoices_chave_unique
  on public.tax_invoices(chave) where chave is not null;

alter table public.tax_invoices enable row level security;

create policy "user reads own invoices" on public.tax_invoices
  for select using (
    exists (select 1 from public.orders o
      where o.id = tax_invoices.order_id
        and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "admin manages invoices" on public.tax_invoices
  for all using (public.is_admin()) with check (public.is_admin());

-- Templates de etiqueta
create table if not exists public.shipping_label_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_default boolean not null default false,
  show_logo boolean not null default true,
  show_chave boolean not null default true,
  show_order_number boolean not null default true,
  show_phone boolean not null default true,
  custom_header text,
  custom_footer text,
  paper_size text not null default '100x150',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipping_label_templates enable row level security;
create policy "anyone reads default template" on public.shipping_label_templates
  for select using (is_default = true);
create policy "admin manages templates" on public.shipping_label_templates
  for all using (public.is_admin()) with check (public.is_admin());

-- Settings novos
insert into public.site_settings (key, value, description) values
  ('shipping_provider_default', '"correios"', 'Provider de frete padrão (correios|melhorenvio|auto)'),
  ('shipping_label_template_default', 'null', 'UUID do template padrão'),
  ('correios_origin_cep', '""', 'CEP de origem para postagem nos Correios'),
  ('correios_services_enabled', '["04510","04014","04227"]', 'Códigos de serviço Correios habilitados'),
  ('dce_provider', '"webmaniabr"', 'Provedor de DC-e')
on conflict (key) do nothing;
```

---

## 12. Variáveis de ambiente novas

```bash
# Correios CWS
CORREIOS_AMBIENTE=homologacao
CORREIOS_USUARIO=
CORREIOS_CODIGO_ACESSO=
CORREIOS_CARTAO_POSTAGEM=
CORREIOS_CONTRATO=
CORREIOS_DR=
CORREIOS_CNPJ=

# WebmaniaBR (DC-e — antecipado da Fase 2)
WEBMANIA_TOKEN=
WEBMANIA_WEBHOOK_TOKEN=

# Cron
CRON_SECRET=
```

---

## 13. UI do Admin — fluxos novos

### `/admin/pedidos/[id]` — bloco "Envio"

Substituir o atual "Comprar etiqueta no Melhor Envio" por um sub-fluxo com seletor:

```
┌──────────────────────────────────────────────────┐
│ Envio                                            │
├──────────────────────────────────────────────────┤
│ Provider:  [ Correios ▼ ] [ Melhor Envio ] [ Auto ] │
│ Serviço:   [ PAC ▼ ]                             │
│                                                  │
│ Status fiscal:                                   │
│  ◉ NF-e   ○ DC-e   ○ Sem documento              │
│                                                  │
│ ⚠ Pedido ainda não tem DC-e/NF-e.               │
│   [ Emitir DC-e (Webmania) ]                     │
│                                                  │
│ Após DC-e autorizada:                            │
│   [ Gerar pré-postagem Correios ]                │
│                                                  │
│ Após pré-postagem:                               │
│   Código: BR123456789BR                          │
│   [ Baixar etiqueta padrão ] [ Etiqueta custom ] │
│   [ Marcar como postado ]                        │
└──────────────────────────────────────────────────┘
```

### `/admin/pedidos/lote` — postagem em lote

Nova tela:
- Filtro: status `paid`, sem `shipments` ainda
- Checkbox múltipla seleção
- Botão "Emitir DC-e em lote" → cria DC-e pra cada (em paralelo, com retry)
- Botão "Gerar pré-postagens" → cria PPN pra cada pedido com DC-e aprovada
- Botão "Imprimir etiquetas selecionadas" → PDF A4 com até N por página
- Botão "Marcar todos como postados"

Acelera demais o operacional do Vinícius.

### `/admin/configuracoes/frete/correios`

- Credenciais Correios (read-only depois de configurado, mascarado)
- Botão "Testar conexão" (chama `getCorreiosToken`)
- Lista de serviços habilitados (toggle por código)
- CEP de origem
- Embalagem padrão (dimensões e peso fallback se SKU não tiver)

### `/admin/configuracoes/frete/etiquetas`

- Lista de templates de etiqueta
- Botão "Novo template"
- Editor com preview ao vivo (renderiza PDF em iframe)

### `/admin/configuracoes/frete/dce`

- Status WebmaniaBR (token válido?)
- Dados do emitente
- Histórico de DC-e emitidas (com filtro)

---

## 14. Testes e ambiente de homologação

### Sandbox Correios

- Portal: `https://cwshom.correios.com.br/`
- API: `https://apihom.correios.com.br/`
- **Credenciais separadas** das de produção
- CEPs e códigos de serviço de teste documentados em `developers.correios.com.br`
- Pré-postagens criadas em homologação **não geram cobrança** mas também **não geram tracking real**

### Sandbox WebmaniaBR

- `ambiente: 2` no payload
- DC-e gerada não tem valor fiscal, mas testa o fluxo end-to-end
- DACE PDF é gerado com marca d'água "HOMOLOGAÇÃO"

### Conjuntos de teste

Casos mínimos a cobrir:

1. Cotação PAC + SEDEX + Mini Envios pra 5 CEPs (NE, N, SE, S, MG)
2. Pré-postagem com DC-e válida → rótulo gerado
3. Pré-postagem com chave DC-e inválida → erro tratado
4. DC-e rejeitada pela SEFAZ → admin notificado
5. Rastreamento mock (subir evento PO, BDE)
6. Cancelamento de pré-postagem antes da postagem
7. Token expirado → refresh automático

### Playwright E2E

```ts
test("admin emite DC-e + pré-postagem + baixa etiqueta", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`/admin/pedidos/${TEST_ORDER_ID}`);
  await page.click("text=Emitir DC-e");
  await expect(page.locator("text=DC-e aprovada")).toBeVisible({ timeout: 30_000 });
  await page.click("text=Gerar pré-postagem");
  await expect(page.locator("text=Pré-postagem criada")).toBeVisible();
  const dl = await page.waitForEvent("download", () => page.click("text=Baixar etiqueta"));
  expect(dl.suggestedFilename()).toMatch(/etiqueta-MVP-/);
});
```

---

## 15. Roadmap de implementação

Encaixar nos sprints já planejados sem estourar o prazo:

| Sprint | Item Correios |
|---|---|
| **Sprint 0** | Já feito — só adicionar variáveis de env do Correios e WebmaniaBR no `.env.example` |
| **Sprint 1** | Sem mudança |
| **Sprint 2** (checkout) | Cotação Correios direto entra no roteador `getQuotes()`. Fallback ME se Correios falhar |
| **Sprint 3** (admin) | UI de "Comprar etiqueta" passa a ter seletor de provider |
| **Sprint 3.5** ⬅ **novo** | DC-e (Webmania) + pré-postagem Correios + render PDF custom + tracking cron (5-7 dias adicionais) |
| **Sprint 4** | Sem mudança |
| **Sprint 5** | Postagem em lote + Etiqueta Builder |
| **Sprint 6** (Fase 2) | NF-e via Webmania (substitui DC-e quando MEI fatura > R$ 100k/ano e migra pra ME) |

**Prazo total revisado:** 30 dias → **37-40 dias** com Correios completo.
**Custo adicional de dev:** R$ 3-5k (5-7 dias × valor/dia Sevyn).

### Marcos de validação

- [ ] Token CWS gerando OK em homologação
- [ ] Cotação PAC retornando valor próximo do site dos Correios
- [ ] DC-e aprovada na Webmania em sandbox
- [ ] Pré-postagem aceita a chave DC-e
- [ ] Rótulo PDF renderiza e abre no Acrobat sem erros
- [ ] Tracking polling atualiza status em < 6h após postagem real
- [ ] Vinícius posta pedido teste real, etiqueta é aceita na agência

---

## 16. Custos operacionais

| Item | Custo | Quem paga |
|---|---|---|
| Contrato Correios e-commerce | Sem mensalidade fixa; tarifa por envio (depende do volume) | Vinícius |
| API Correios CWS | Grátis (incluso no contrato) | — |
| WebmaniaBR — plano DC-e | A partir de **R$ 49/mês** (~200 DC-e) | Vinícius |
| Upstash Redis (cache token) | Já no stack — sem custo adicional | Sevyn |
| Vercel cron | Grátis no plano Pro (até 100 invocações/dia) | Sevyn |
| Supabase Storage (PDFs de etiqueta) | ~R$ 0,02/GB; ignorável | Sevyn |

Estimativa de envio Correios PAC pra 1kg até 500km com contrato: **~R$ 18-25** (vs **~R$ 35-45 no balcão** sem contrato). Justifica abrir o contrato logo no início.

---

## 17. Riscos e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Contrato Correios demora > 30 dias | Alta | Lançar com Melhor Envio; migrar quando contrato sair |
| DC-e rejeitada por dado incorreto | Média | Validação Zod no input + retry com correção manual |
| Token CWS expira durante request alto volume | Baixa | TokenManager com refresh em 401 + cache em Redis |
| Mudança quebrante na API Correios | Baixa-Média | Wrapper isolado; testes E2E em homologação semanal |
| WebmaniaBR cair | Baixa | Fallback: emissão manual via app DC-e (com aviso ao Vinícius) |
| Etiqueta custom rejeitada na agência | Média | Manter template oficial como padrão; custom só após validação manual |
| Cron de rastreio sobrecarrega | Baixa | Limit 50/run + paginação; mover para Edge Function se necessário |
| Chave DC-e vazar em logs | Média | `beforeSend` Sentry filtra; nunca logar `raw_response` completo |

---

## 18. Checklist pré go-live (parte Correios)

- [ ] Contrato Correios ativo em produção
- [ ] Cartão de postagem físico em mãos do Vinícius
- [ ] Serviços 38202, 38210 e Pré-Postagem ativos no contrato
- [ ] Conta WebmaniaBR plano DC-e ativa
- [ ] Variáveis de produção configuradas na Vercel
- [ ] Cron `track-shipments` agendado e testado
- [ ] Template de etiqueta padrão publicado
- [ ] Vinícius treinado: imprimir, cortar, colar, postar
- [ ] Cota mínima de Correios revisada (peso/dim fallback)
- [ ] Logo da loja em alta resolução pra etiqueta (PNG transparente)
- [ ] Endereço de origem confirmado (CEP do galpão)
- [ ] Teste em produção: 1 pedido real R$ 5 enviado pra colaborador da Sevyn
- [ ] Backup de credenciais no 1Password compartilhado

---

## 19. Não fazer

- **Não chamar a API a partir do client.** Sempre via Server Action ou Route Handler. Token nunca pode aparecer no bundle.
- **Não persistir token JWT em banco com TTL longo.** Use Upstash Redis (já no stack) e cache de 23h.
- **Não inventar chave DC-e/NF-e dummy** "só pra testar". O Correios valida na pré-postagem.
- **Não permitir que o cliente final escolha "Correios direto vs Melhor Envio"** — confunde. O cliente vê serviços (PAC, SEDEX), o admin escolhe o roteador interno.
- **Não tentar emitir DC-e síncrono no checkout.** É assíncrono. Emitir após pagamento aprovado, antes da pré-postagem.
- **Não usar Puppeteer pra etiqueta em Vercel** sem ajustar runtime; ele estoura limite de tamanho da função. Usar `@react-pdf/renderer`.

---

## 20. Quando estiver em dúvida

- Documentação oficial CWS: `https://www.correios.com.br/atendimento/developers`
- Manual API Token: `https://www.correios.com.br/atendimento/developers/manuais/manual-uso-da-api-token`
- Manual Preço: `https://www.correios.com.br/atendimento/developers/manuais/manual-api-preco-1`
- Manual Prazo: `https://www.correios.com.br/atendimento/developers/manuais/manual-api-prazo`
- Docs WebmaniaBR DC-e: `https://webmania.com.br/docs/rest-api-dce/`
- Para fluxo end-to-end: este documento + `docs/06-INTEGRATIONS.md` (que continua válido para a parte ME)
- Se travar: **pare e pergunte ao Diego.** Não improvise integração com sistema fiscal.
