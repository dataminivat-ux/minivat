import Link from 'next/link'
import { Droplet } from 'lucide-react'

import { NewsletterForm } from './newsletter-form'

const INSTITUTIONAL = [
  { href: '/institucional/sobre', label: 'Sobre' },
  { href: '/institucional/contato', label: 'Contato' },
  { href: '/institucional/trocas-devolucoes', label: 'Trocas e devolucoes' },
  { href: '/institucional/privacidade', label: 'Privacidade' },
  { href: '/institucional/termos', label: 'Termos de uso' },
]

const SHOP = [
  { href: '/produtos', label: 'Todos os produtos' },
  { href: '/categorias/mini-vat', label: 'Mini VATs' },
  { href: '/categorias/mesas', label: 'Mesas de impressao' },
  { href: '/carrinho', label: 'Carrinho' },
]

export function Footer() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="gradient-minivat-cyan flex size-8 items-center justify-center rounded-lg">
                <Droplet className="size-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">
                MINI VAT PREMIUM
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              Impressao 3D de precisao. Acessorios premium para odontologia
              digital.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-white">Institucional</p>
            {INSTITUTIONAL.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 transition hover:text-cyan-400"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-white">Loja</p>
            {SHOP.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 transition hover:text-cyan-400"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div>
            <p className="text-sm font-semibold text-white">Newsletter</p>
            <p className="mt-2 mb-3 text-sm text-slate-400">
              Novidades e ofertas no seu e-mail.
            </p>
            <div className="[&_input]:border-transparent [&_input]:bg-white [&_input]:text-slate-900 [&_input::placeholder]:text-slate-500">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="my-8 h-px bg-slate-800" />

        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 MINI VAT PREMIUM. Todos os direitos reservados.</p>
          <p>www.minivatpremium.com.br</p>
        </div>
      </div>
    </footer>
  )
}
