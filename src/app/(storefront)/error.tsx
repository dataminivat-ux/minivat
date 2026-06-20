'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-muted-foreground">
        Ocorreu um erro inesperado. Tente novamente em instantes.
      </p>
      <Button className="mt-6" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}
