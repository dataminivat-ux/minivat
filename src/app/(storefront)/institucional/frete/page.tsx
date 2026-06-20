import type { Metadata } from 'next'

import { InstitutionalPage } from '@/components/storefront/institutional-page'

export const metadata: Metadata = {
  title: 'Frete e entrega | MINI VAT PREMIUM',
}

export default function Page() {
  return (
    <InstitutionalPage
      title="Frete e entrega"
      settingKey="shipping_policy_md"
      fallback="Politica de frete em breve. Calculamos o frete no checkout pelo seu CEP."
    />
  )
}
