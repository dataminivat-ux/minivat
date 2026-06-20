import { z } from 'zod'

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const checkoutSchema = z.object({
  email: z.string().refine((v) => emailRegex.test(v), 'E-mail invalido'),
  customer_name: z.string().min(1),
  customer_document: z.string().optional(), // CPF/CNPJ (so digitos)
  customer_phone: z.string().optional(),

  shipping_address: z.object({
    recipient_name: z.string().optional(),
    cep: z.string().min(8),
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2).max(2),
  }),

  items: z
    .array(
      z.object({
        variant_id: z.string(),
        product_id: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),

  // opcao de frete escolhida (o servidor revalida o valor)
  shipping: z.object({
    service_id: z.string().optional(),
    method: z.string().optional(),
    carrier: z.string().optional(),
    price_cents: z.number().int().nonnegative(),
    estimated_days: z.number().int().optional(),
  }),

  coupon_code: z.string().optional(),

  payment_method: z.enum(['pix', 'credit_card']),
  card_token: z.string().optional(),
  installments: z.number().int().positive().optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
