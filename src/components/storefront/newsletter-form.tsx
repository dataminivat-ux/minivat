'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { subscribeNewsletter } from '@/lib/actions/newsletter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null)

  useEffect(() => {
    if (!state) return
    if (state.ok) toast.success(state.message)
    else toast.error(state.message)
  }, [state])

  return (
    <form action={action} className="flex max-w-sm gap-2">
      <Input
        type="email"
        name="email"
        required
        placeholder="Seu melhor e-mail"
        aria-label="E-mail para newsletter"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Enviando...' : 'Inscrever'}
      </Button>
    </form>
  )
}
