'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { updateOrderStatus } from '@/lib/actions/orders'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  type OrderStatus,
} from '@/lib/order-status'

export function OrderStatusSelect({
  id,
  current,
}: {
  id: string
  current: OrderStatus
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as OrderStatus
        start(() =>
          updateOrderStatus(id, next).then(() => {
            toast.success('Status atualizado')
            router.refresh()
          })
        )
      }}
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
    >
      {ORDER_STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
