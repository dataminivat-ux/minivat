# 14 — Testing

## Filosofia

- **Pirâmide saudável.** Muitos unit, médio integration, poucos E2E críticos.
- **Testar comportamento, não implementação.** Refatorar não deve quebrar testes.
- **E2E em fluxos que se quebrarem geram perda de dinheiro.** Checkout, webhook MP, etiqueta.
- **CI tem que ser rápido.** Suite total < 5min, senão PRs morrem.
- **Sem mock de DB nos unit.** Use schema separado de teste (testcontainers ou Supabase branch).

## Camadas

```
                    ┌───────────────────┐
                    │   E2E (Playwright)│  ~10 testes — fluxos críticos
                    └───────────────────┘
                ┌───────────────────────────┐
                │  Integration (Vitest)     │  ~50 testes — Server Actions, integrações
                └───────────────────────────┘
        ┌─────────────────────────────────────────┐
        │  Unit (Vitest)                          │  ~200 testes — utilitários, validators, lógica pura
        └─────────────────────────────────────────┘
```

## Configuração

### Vitest

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["**/node_modules/**", "**/migrations/**", "src/db/seed.ts"],
    },
  },
})
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom"
import { vi } from "vitest"
// Mocks globais (next/navigation, etc.)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))
```

### Playwright

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: devices["Desktop Chrome"] },
    { name: "mobile-safari", use: devices["iPhone 14"] },
  ],
  webServer: process.env.CI ? undefined : { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true },
})
```

---

## Unit tests

### Cobertura mínima

- **100%** dos validators Zod
- **100%** dos utilitários (`format.ts`, `cep.ts`, `gtm.ts`, cálculo de preços/frete/cupom)
- **80%** dos hooks customizados
- **80%** dos Server Actions (regras de negócio)

### Exemplo: validator de cupom

```ts
// src/server/coupons/apply-coupon.test.ts
import { describe, it, expect } from "vitest"
import { calculateCouponDiscount } from "./apply-coupon"

describe("calculateCouponDiscount", () => {
  it("aplica desconto percentual", () => {
    const result = calculateCouponDiscount({
      coupon: { type: "percent", value: 10, minOrderAmount: 0 },
      orderSubtotal: 100,
    })
    expect(result.discount).toBe(10)
  })

  it("respeita valor mínimo do pedido", () => {
    const result = calculateCouponDiscount({
      coupon: { type: "percent", value: 10, minOrderAmount: 200 },
      orderSubtotal: 100,
    })
    expect(result.discount).toBe(0)
    expect(result.error).toBe("MIN_ORDER_NOT_REACHED")
  })

  it("frete grátis zera apenas o frete", () => {
    const result = calculateCouponDiscount({
      coupon: { type: "free_shipping", value: 0 },
      orderSubtotal: 100,
      shippingAmount: 29.5,
    })
    expect(result.discount).toBe(29.5)
    expect(result.appliedTo).toBe("shipping")
  })

  it("nunca aplica desconto maior que subtotal", () => {
    const result = calculateCouponDiscount({
      coupon: { type: "fixed", value: 500 },
      orderSubtotal: 100,
    })
    expect(result.discount).toBe(100)
  })
})
```

### Exemplo: formatador

```ts
// src/lib/format.test.ts
import { formatBRL, formatCEP, formatCpfCnpj, maskPhone } from "./format"

describe("formatBRL", () => {
  it.each([
    [1, "R$ 1,00"],
    [1099, "R$ 1.099,00"],
    [1100.5, "R$ 1.100,50"],
    [0, "R$ 0,00"],
  ])("formats %d as %s", (input, expected) => {
    expect(formatBRL(input)).toBe(expected)
  })
})

describe("formatCpfCnpj", () => {
  it("formata CPF", () => {
    expect(formatCpfCnpj("12345678901")).toBe("123.456.789-01")
  })
  it("formata CNPJ", () => {
    expect(formatCpfCnpj("12345678000190")).toBe("12.345.678/0001-90")
  })
})
```

---

## Integration tests

### Server Actions

Testam a Server Action de ponta a ponta com banco real (Supabase branch ou testcontainers).

```ts
// src/server/actions/cart.integration.test.ts
import { beforeEach, describe, it, expect } from "vitest"
import { resetDb, seedTestData } from "@/test/db-helpers"
import { addToCart, getCart } from "./cart"

describe("addToCart (integration)", () => {
  beforeEach(async () => {
    await resetDb()
    await seedTestData()
  })

  it("adiciona item novo ao carrinho", async () => {
    const result = await addToCart({ variantId: "test-variant-1", quantity: 1 })
    expect(result.ok).toBe(true)
    const cart = await getCart()
    expect(cart.data?.items).toHaveLength(1)
  })

  it("incrementa quantidade se variant já está no carrinho", async () => {
    await addToCart({ variantId: "test-variant-1", quantity: 1 })
    await addToCart({ variantId: "test-variant-1", quantity: 2 })
    const cart = await getCart()
    expect(cart.data?.items[0].quantity).toBe(3)
  })

  it("falha se estoque insuficiente", async () => {
    const result = await addToCart({ variantId: "test-variant-out-of-stock", quantity: 1 })
    expect(result.ok).toBe(false)
    expect(result.error).toBe("STOCK_UNAVAILABLE")
  })
})
```

### Webhooks

```ts
// src/app/api/webhooks/mercado-pago/route.integration.test.ts
import { describe, it, expect, vi } from "vitest"
import { POST } from "./route"
import { signPayload } from "@/test/helpers"

describe("MP webhook", () => {
  it("rejeita assinatura inválida", async () => {
    const req = new Request("https://example.com/api/webhooks/mercado-pago", {
      method: "POST",
      headers: { "x-signature": "invalid" },
      body: JSON.stringify({ data: { id: "123" }, action: "payment.updated" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("processa pagamento aprovado e atualiza pedido", async () => {
    // setup: cria order com payment pending
    // mock: MP API retorna status='approved'
    // assert: order.status === 'paid', estoque decrementado
  })

  it("é idempotente: webhook duplicado não decrementa estoque 2x", async () => {
    // ...
  })
})
```

### Integrações externas — mocks

Mocks com MSW (Mock Service Worker) ou nock:

```ts
// src/test/mocks/mercado-pago.ts
import { http, HttpResponse } from "msw"

export const mercadoPagoHandlers = [
  http.post("https://api.mercadopago.com/v1/payments", () => {
    return HttpResponse.json({
      id: 12345,
      status: "pending",
      point_of_interaction: {
        transaction_data: {
          qr_code: "00020126...",
          qr_code_base64: "iVBORw0...",
        },
      },
    })
  }),
]
```

---

## E2E tests (Playwright)

### Fluxos críticos cobertos

1. **Compra Pix completa**
2. **Compra cartão aprovado**
3. **Compra cartão recusado (mensagem clara)**
4. **Cadastro de cliente + login + logout**
5. **Aplicação de cupom válido + inválido**
6. **Cálculo de frete**
7. **Admin login + criar produto + ele aparece na storefront**
8. **Admin emissão de etiqueta**
9. **Carrinho persiste entre sessões**
10. **Recuperação de senha**

### Exemplo

```ts
// e2e/compra-pix.spec.ts
import { test, expect } from "@playwright/test"

test("compra com Pix do início ao QR", async ({ page }) => {
  // 1. Home
  await page.goto("/")
  await page.getByRole("link", { name: /ver linha premium/i }).click()

  // 2. Categoria → produto
  await page.getByRole("link", { name: /mini vat premium/i }).first().click()

  // 3. Produto: selecionar variante e adicionar
  await page.getByRole("button", { name: /premium/i }).click()
  await page.getByRole("button", { name: /adicionar ao carrinho/i }).click()
  await expect(page.getByText(/adicionado/i)).toBeVisible()

  // 4. Carrinho lateral → finalizar
  await page.getByRole("button", { name: /finalizar compra/i }).click()
  await expect(page).toHaveURL(/\/checkout/)

  // 5. Identificação (visitante)
  await page.fill('input[name="email"]', "teste@minivat.test")
  await page.fill('input[name="name"]', "Teste E2E")
  await page.fill('input[name="cpf"]', "12345678901")

  // 6. Endereço
  await page.fill('input[name="cep"]', "01310100")
  await page.waitForResponse((r) => r.url().includes("viacep"))
  await page.fill('input[name="number"]', "1000")

  // 7. Frete
  await page.getByRole("radio", { name: /pac/i }).check()

  // 8. Pix
  await page.getByRole("tab", { name: /pix/i }).click()

  // 9. Finalizar
  await page.getByRole("button", { name: /finalizar compra/i }).click()

  // 10. QR Code aparece
  await expect(page.getByRole("heading", { name: /aguardando pagamento/i })).toBeVisible()
  await expect(page.locator('img[alt*="QR Code"]')).toBeVisible()
  await expect(page.getByText(/00020126/)).toBeVisible() // pix copia-e-cola
})
```

### Dados de teste

- Banco de staging tem 5 produtos seeds estáveis
- Cliente de teste: `e2e@minivat.test` / senha `Test1234!`
- Cupom `TESTE10` (10%, validade longa)
- MP sandbox com cartões de teste documentados

---

## Acessibilidade

Plugin `@axe-core/playwright` em smoke test por rota:

```ts
import AxeBuilder from "@axe-core/playwright"

test("homepage não tem violações WCAG AA", async ({ page }) => {
  await page.goto("/")
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
  expect(results.violations).toEqual([])
})
```

Rodar em: home, categoria, produto, carrinho, checkout, conta, login.

---

## Performance

### Lighthouse CI

`.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/categoria/mini-vat-premium",
        "http://localhost:3000/produto/mini-vat-premium"
      ],
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

Roda em cada PR no GitHub Actions.

---

## Testes de regressão visual (Fase 2)

- Chromatic ou Percy integrado ao Storybook (Fase 2)
- Storybook nativo do shadcn/ui para componentes principais

---

## Cobertura — meta

| Camada | Meta |
|--------|------|
| Validators (Zod) | 100% |
| Utilitários puros | ≥ 95% |
| Server Actions | ≥ 80% |
| Webhooks | ≥ 85% |
| Componentes UI | ≥ 60% (visual + acessibilidade via E2E) |
| Geral | ≥ 75% |

Coverage badge no README, gate no CI em < 70%.

---

## Estratégia de dados de teste

### Fixtures

`src/test/fixtures/` com:
- `products.ts` — produtos seeds
- `customers.ts` — clientes
- `orders.ts` — pedidos em vários estados
- `webhooks/` — payloads reais de webhook (mockados após inspeção em sandbox)

### Reset

Cada teste integração roda em transação que faz rollback:

```ts
// src/test/db-helpers.ts
export async function withTestDb<T>(fn: (db: DB) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const result = await fn(tx)
    throw new Error("ROLLBACK") // Sempre faz rollback
  }).catch((e) => {
    if (e.message !== "ROLLBACK") throw e
    return undefined as T
  })
}
```

> Alternativa para Supabase: branches (DB efêmero por PR — preview).

---

## Quando NÃO testar

- Implementação interna de libs terceiras (confiar)
- Estilo (Tailwind classes — testar comportamento, não DOM string)
- Configuração de Next.js, Drizzle, etc. (rodar build no CI já valida)

---

## Manual QA — checklist pré-release

Independente de testes automatizados, antes de cada release de produção:

- [ ] Login admin funciona
- [ ] Cadastrar 1 produto novo via admin
- [ ] Produto aparece na home/listagem em < 10s
- [ ] Adicionar ao carrinho, checkout Pix sandbox completo
- [ ] Webhook MP atualiza status no admin
- [ ] E-mail de confirmação chega na caixa
- [ ] WhatsApp dispara (se Watidy configurado)
- [ ] Emitir etiqueta sandbox
- [ ] Visualizar pedido na conta do cliente
- [ ] Excluir conta (LGPD) funciona
- [ ] Sitemap acessível
- [ ] Sentry recebe eventos de teste
- [ ] Health check OK
