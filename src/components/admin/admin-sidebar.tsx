'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FolderTree,
  Images,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Ticket,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: FolderTree },
  { href: '/admin/cupons', label: 'Cupons', icon: Ticket },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/avaliacoes', label: 'Avaliacoes', icon: Star },
  { href: '/admin/configuracoes', label: 'Configuracoes', icon: Settings },
]

const SOON = [{ label: 'Banners', icon: Images }]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20">
      <div className="p-4">
        <Link href="/admin" className="font-heading font-bold">
          MINI VAT <span className="text-muted-foreground">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition',
                active
                  ? 'bg-primary/10 font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}

        <div className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground/60">
          Em breve
        </div>
        {SOON.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground/40"
            title="Disponivel em sprints seguintes"
          >
            <item.icon className="size-4" />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="border-t p-2">
        <p className="truncate px-3 py-1 text-xs text-muted-foreground">{email}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
