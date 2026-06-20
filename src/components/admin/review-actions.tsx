'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { deleteReview, setReviewPublished } from '@/lib/actions/reviews'
import { Button } from '@/components/ui/button'

export function ReviewActions({
  id,
  published,
}: {
  id: string
  published: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={published ? 'outline' : 'default'}
        disabled={pending}
        onClick={() =>
          start(() =>
            setReviewPublished(id, !published).then(() => {
              toast.success(published ? 'Despublicada' : 'Publicada')
              router.refresh()
            })
          )
        }
      >
        {published ? 'Despublicar' : 'Publicar'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          start(() =>
            deleteReview(id).then(() => {
              toast.success('Removida')
              router.refresh()
            })
          )
        }
      >
        Excluir
      </Button>
    </div>
  )
}
