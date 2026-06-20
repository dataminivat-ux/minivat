import type { Metadata } from 'next'

import { InstitutionalPage } from '@/components/storefront/institutional-page'

export const metadata: Metadata = {
  title: 'Politica de Privacidade | MINI VAT PREMIUM',
}

export default function Page() {
  return (
    <InstitutionalPage
      title="Politica de Privacidade"
      settingKey="privacy_policy_md"
      fallback="Politica de privacidade (LGPD) em breve. Tratamos seus dados conforme a Lei Geral de Protecao de Dados."
    />
  )
}
