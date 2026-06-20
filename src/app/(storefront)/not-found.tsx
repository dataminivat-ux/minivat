import Link from 'next/link'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-heading text-6xl font-bold">404</p>
      <h1 className="mt-4 text-xl font-semibold">Pagina nao encontrada</h1>
      <p className="mt-2 text-muted-foreground">
        O conteudo que voce procura nao existe ou foi movido.
      </p>
      <Link href="/produtos" className={cn(buttonVariants(), 'mt-6')}>
        Ver produtos
      </Link>
    </div>
  )
}
