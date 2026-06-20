'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AuthState = { error: string } | null

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/admin')

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: 'E-mail ou senha invalidos.' }
  }

  redirect(next)
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const cpf = String(formData.get('cpf') ?? '').replace(/\D/g, '') || null
  const marketing = formData.get('marketing') === 'on'

  if (!fullName || !email || password.length < 6) {
    return { error: 'Preencha nome, e-mail e senha (minimo 6 caracteres).' }
  }

  // Cria o usuario ja confirmado (sem depender de e-mail de confirmacao).
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error || !data.user) {
    return { error: 'Nao foi possivel criar a conta. O e-mail pode ja estar em uso.' }
  }

  await admin.from('profiles').upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    cpf,
    role: 'customer',
    marketing_opt_in: marketing,
  })

  const supabase = await createClient()
  await supabase.auth.signInWithPassword({ email, password })
  redirect('/conta')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/entrar')
}
