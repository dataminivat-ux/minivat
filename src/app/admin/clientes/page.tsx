import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Clientes | Admin MINI VAT' }

export default async function AdminClientes() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const list = profiles ?? []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">E-mail</th>
              <th className="p-3 font-medium">Papel</th>
              <th className="p-3 font-medium">Desde</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <Link
                    href={`/admin/clientes/${p.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {p.full_name ?? '(sem nome)'}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{p.email}</td>
                <td className="p-3">
                  {p.role === 'customer' ? (
                    <Badge variant="secondary">Cliente</Badge>
                  ) : (
                    <Badge>{p.role}</Badge>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Nenhum cliente cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
