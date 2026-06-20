import type { Metadata } from 'next'

import { InstitutionalPage } from '@/components/storefront/institutional-page'

export const metadata: Metadata = { title: 'Sobre | MINI VAT PREMIUM' }

export default function Page() {
  return (
    <InstitutionalPage
      title="Sobre a MINI VAT PREMIUM"
      settingKey="about_text"
      fallback="Fabricamos acessorios premium para impressao 3D odontologica. Conteudo institucional em breve."
    />
  )
}
