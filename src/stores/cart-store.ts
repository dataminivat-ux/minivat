import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  variant_id: string
  product_id: string
  sku: string
  product_name: string
  variant_name: string | null
  thumbnail_url: string | null
  price_cents: number
  quantity: number
  weight_g: number | null
  slug: string
  attributes: Record<string, string>
}

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variant_id: string) => void
  updateQuantity: (variant_id: string, qty: number) => void
  clear: () => void
  getSubtotalCents: () => number
  getTotalQuantity: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variant_id === item.variant_id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variant_id === item.variant_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (variant_id) =>
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variant_id),
        })),
      updateQuantity: (variant_id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variant_id === variant_id ? { ...i, quantity: Math.max(1, qty) } : i
          ),
        })),
      clear: () => set({ items: [] }),
      getSubtotalCents: () =>
        get().items.reduce((acc, i) => acc + i.price_cents * i.quantity, 0),
      getTotalQuantity: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    { name: 'mvp-cart-v1' }
  )
)
