import type { Metadata } from 'next'

import { InstitutionalPage } from '@/components/storefront/institutional-page'

export const metadata: Metadata = {
  title: 'Termos de uso | MINI VAT PREMIUM',
}

export default function Page() {
  return (
    <InstitutionalPage
      title="Termos de uso"
      settingKey="terms_md"
      fallback="Termos de uso em breve."
    />
  )
}
