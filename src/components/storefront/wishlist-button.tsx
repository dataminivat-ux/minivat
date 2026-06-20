'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function WishlistButton({
  productId,
  initialInWishlist,
}: {
  productId: string
  initialInWishlist: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [inWl, setInWl] = useState(initialInWishlist)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    setBusy(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/entrar?next=/conta/lista-desejos')
        return
      }
      if (inWl) {
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
        setInWl(false)
        toast.success('Removido da lista de desejos')
      } else {
        await supabase
          .from('wishlist_items')
          .insert({ user_id: user.id, product_id: productId })
        setInWl(true)
        toast.success('Adicionado a lista de desejos')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={toggle}
      disabled={busy}
      aria-label="Favoritar"
      title="Adicionar a lista de desejos"
    >
      <Heart className={cn('size-5', inWl && 'fill-current text-accent')} />
    </Button>
  )
}
