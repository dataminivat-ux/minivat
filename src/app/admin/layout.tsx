import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Toaster } from '@/components/ui/sonner'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

// Layout do admin: guard de auth/role (reforca o middleware) + sidebar.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/entrar?next=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar email={profile.email} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <Toaster />
    </div>
  )
}
