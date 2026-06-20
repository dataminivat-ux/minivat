'use client'

import { useEffect } from 'react'

import { track } from '@/lib/analytics/events'

// Dispara o evento GA4 `purchase` na pagina de sucesso (Server Component).
export function PurchaseTracker({
  orderNumber,
  totalReais,
}: {
  orderNumber: string
  totalReais: number
}) {
  useEffect(() => {
    track('purchase', {
      ecommerce: {
        transaction_id: orderNumber,
        currency: 'BRL',
        value: totalReais,
      },
    })
  }, [orderNumber, totalReais])
  return null
}
