import type { Metadata } from 'next'
import Link from 'next/link'

import { SignupForm } from '@/components/shared/signup-form'

export const metadata: Metadata = { title: 'Criar conta | MINI VAT PREMIUM' }

export default function CadastrarPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Ja tem conta?{' '}
        <Link href="/entrar" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
      <SignupForm />
    </div>
  )
}
