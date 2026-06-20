// Eventos de e-commerce GA4 via dataLayer (GTM). Precos sempre em reais
// (a fonte guarda centavos; converter antes de chamar).

export type GAItem = {
  item_id: string
  item_name: string
  item_brand?: string
  item_category?: string
  item_variant?: string
  price: number
  quantity: number
}

export type ConsentChoice = { analytics: boolean; marketing: boolean }

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ecommerce: null }) // limpa contexto anterior
  window.dataLayer.push({ event, ...payload })
}

export function trackViewItem(item: GAItem) {
  track('view_item', {
    ecommerce: { currency: 'BRL', value: item.price, items: [item] },
  })
}

export function trackAddToCart(item: GAItem) {
  track('add_to_cart', {
    ecommerce: {
      currency: 'BRL',
      value: item.price * item.quantity,
      items: [item],
    },
  })
}

export function trackViewCart(items: GAItem[], value: number) {
  track('view_cart', { ecommerce: { currency: 'BRL', value, items } })
}

export function trackSelectItem(item: GAItem) {
  track('select_item', { ecommerce: { items: [item] } })
}

export function trackSearch(searchTerm: string) {
  track('search', { search_term: searchTerm })
}

// Consent Mode v2 — chamado pelo banner LGPD.
export function updateConsent(choice: ConsentChoice) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('consent', 'update', {
    ad_storage: choice.marketing ? 'granted' : 'denied',
    ad_user_data: choice.marketing ? 'granted' : 'denied',
    ad_personalization: choice.marketing ? 'granted' : 'denied',
    analytics_storage: choice.analytics ? 'granted' : 'denied',
  })
}
