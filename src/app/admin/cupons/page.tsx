import { createClient } from '@/lib/supabase/server'
import { CouponManager } from '@/components/admin/coupon-manager'

export const metadata = { title: 'Cupons | Admin MINI VAT' }

export default async function AdminCupons() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('coupons')
    .select(
      'id, code, description, discount_type, discount_value, min_purchase_cents, max_discount_cents, usage_limit, usage_limit_per_user, used_count, expires_at, is_active'
    )
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Cupons</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Crie cupons de desconto (percentual, valor fixo ou frete gratis).
      </p>
      <CouponManager coupons={data ?? []} />
    </div>
  )
}
