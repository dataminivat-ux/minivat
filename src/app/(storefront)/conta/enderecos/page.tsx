import { createClient } from '@/lib/supabase/server'
import { AddressManager } from '@/components/storefront/address-manager'

export const metadata = { title: 'Enderecos | MINI VAT PREMIUM' }

export default async function ContaEnderecos() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('addresses')
    .select(
      'id, recipient_name, cep, street, number, complement, neighborhood, city, state, is_default'
    )
    .eq('user_id', user!.id)
    .order('is_default', { ascending: false })

  return <AddressManager addresses={data ?? []} />
}
