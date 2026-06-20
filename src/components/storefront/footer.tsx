import Link from 'next/link'

import { NewsletterForm } from './newsletter-form'

const INSTITUTIONAL = [
  { href: '/institucional/sobre', label: 'Sobre' },
  { href: '/institucional/contato', label: 'Contato' },
  { href: '/institucional/trocas-devolucoes', label: 'Trocas e devolucoes' },
  { href: '/institucional/privacidade', label: 'Privacidade' },
  { href: '/institucional/termos', label: 'Termos de uso' },
]

export function Footer() {
  const year = 2026

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-heading text-lg font-bold">MINI VAT PREMIUM</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Acessorios premium para impressao 3D odontologica.
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Institucional</p>
          {INSTITUTIONAL.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div>
          <p className="text-sm font-semibold">Newsletter</p>
          <p className="mt-2 mb-3 text-sm text-muted-foreground">
            Novidades e ofertas no seu e-mail.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          &copy; {year} MINI VAT PREMIUM. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
