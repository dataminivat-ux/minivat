import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  code: z.string().min(1),
  subtotal_cents: z.number().int().nonnegative(),
})

// Valida cupom via funcao validate_coupon do Supabase.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('validate_coupon', {
    p_code: parsed.data.code,
    p_subtotal_cents: parsed.data.subtotal_cents,
    p_user_id: user?.id ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
}
