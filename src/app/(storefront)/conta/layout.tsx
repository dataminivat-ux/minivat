import { redirect } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

const NAV = [
  { href: '/conta', label: 'Visao geral' },
  { href: '/conta/pedidos', label: 'Meus pedidos' },
  { href: '/conta/enderecos', label: 'Enderecos' },
  { href: '/conta/lista-desejos', label: 'Lista de desejos' },
]

export default async function ContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?next=/conta')

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Minha conta</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
        <aside className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm transition hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted"
            >
              Sair
            </button>
          </form>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
