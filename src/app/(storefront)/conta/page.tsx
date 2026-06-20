import Link from 'next/link'
import { Heart, MapPin, Package } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Minha conta | MINI VAT PREMIUM' }

export default async function ContaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .maybeSingle()

  const [ordersC, wishlistC, addressC] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('wishlist_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  const cards = [
    {
      href: '/conta/pedidos',
      icon: Package,
      label: 'Pedidos',
      value: ordersC.count ?? 0,
    },
    {
      href: '/conta/enderecos',
      icon: MapPin,
      label: 'Enderecos',
      value: addressC.count ?? 0,
    },
    {
      href: '/conta/lista-desejos',
      icon: Heart,
      label: 'Lista de desejos',
      value: wishlistC.count ?? 0,
    },
  ]

  return (
    <div>
      <p className="text-muted-foreground">
        Ola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border p-5 transition hover:border-accent/40 hover:shadow-premium"
          >
            <c.icon className="size-5 text-accent" />
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
