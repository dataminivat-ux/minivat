'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { updateConsent, type ConsentChoice } from '@/lib/analytics/events'
import { Button } from '@/components/ui/button'

const COOKIE = 'lgpd_consent'
const ONE_YEAR = 60 * 60 * 24 * 365

function hasConsent() {
  if (typeof document === 'undefined') return true
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=`))
}

function persist(choice: ConsentChoice) {
  const value = JSON.stringify(choice)
  document.cookie = `${COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; samesite=lax`
  localStorage.setItem(COOKIE, value)
}

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!hasConsent()) setShow(true)
  }, [])

  function choose(choice: ConsentChoice) {
    persist(choice)
    updateConsent(choice)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          Usamos cookies para melhorar sua experiencia e, com seu consentimento,
          para analytics e marketing. Veja a{' '}
          <Link href="/institucional/privacidade" className="underline">
            Politica de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => choose({ analytics: false, marketing: false })}
          >
            Apenas necessarios
          </Button>
          <Button onClick={() => choose({ analytics: true, marketing: true })}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  )
}
