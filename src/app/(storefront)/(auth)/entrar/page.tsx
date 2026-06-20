import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'

import { LoginForm } from '@/components/shared/login-form'

export const metadata: Metadata = { title: 'Entrar | MINI VAT PREMIUM' }

export default function EntrarPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Nao tem conta?{' '}
        <Link href="/cadastrar" className="text-accent hover:underline">
          Criar conta
        </Link>
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
