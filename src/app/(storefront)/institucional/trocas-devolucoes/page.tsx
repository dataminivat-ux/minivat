import type { Metadata } from 'next'

import { InstitutionalPage } from '@/components/storefront/institutional-page'

export const metadata: Metadata = {
  title: 'Trocas e devolucoes | MINI VAT PREMIUM',
}

export default function Page() {
  return (
    <InstitutionalPage
      title="Trocas e devolucoes"
      settingKey="return_policy_md"
      fallback="Politica de trocas e devolucoes em breve."
    />
  )
}
