import type { Metadata } from 'next'
import { Mail, MessageCircle } from 'lucide-react'

import { getSetting } from '@/lib/settings'

export const metadata: Metadata = { title: 'Contato | MINI VAT PREMIUM' }

export default async function ContatoPage() {
  const [whatsapp, email] = await Promise.all([
    getSetting('contact_whatsapp'),
    getSetting('contact_email'),
  ])
  const waDigits = whatsapp?.replace(/\D/g, '')

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        Fale com a gente pelos canais abaixo.
      </p>

      <div className="mt-6 space-y-3">
        {whatsapp && waDigits && (
          <a
            href={`https://wa.me/${waDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border p-4 transition hover:bg-muted/40"
          >
            <MessageCircle className="size-5 text-primary" />
            <span>
              <span className="block text-sm font-medium">WhatsApp</span>
              <span className="text-sm text-muted-foreground">{whatsapp}</span>
            </span>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 rounded-lg border p-4 transition hover:bg-muted/40"
          >
            <Mail className="size-5 text-primary" />
            <span>
              <span className="block text-sm font-medium">E-mail</span>
              <span className="text-sm text-muted-foreground">{email}</span>
            </span>
          </a>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        O formulario de contato por e-mail sera ativado com a integracao Resend.
      </p>
    </div>
  )
}
