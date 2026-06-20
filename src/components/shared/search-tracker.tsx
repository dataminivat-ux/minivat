'use client'

import { useEffect } from 'react'

import { trackSearch } from '@/lib/analytics/events'

// Dispara o evento GA4 `search` (a pagina de busca e Server Component).
export function SearchTracker({ term }: { term: string }) {
  useEffect(() => {
    if (term) trackSearch(term)
  }, [term])
  return null
}
