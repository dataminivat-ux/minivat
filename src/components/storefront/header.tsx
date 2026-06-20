'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Droplet, Menu, Search, User } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CartDrawer } from './cart-drawer'

export type HeaderCategory = { slug: string; name: string }

export function Header({ categories }: { categories: HeaderCategory[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (term) router.push(`/busca?q=${encodeURIComponent(term)}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* menu mobile */}
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Categorias</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {categories.map((c) => (
                <SheetClose
                  key={c.slug}
                  nativeButton={false}
                  render={
                    <Link
                      href={`/categorias/${c.slug}`}
                      className="rounded-md px-2 py-2 text-sm hover:bg-muted hover:text-accent"
                    />
                  }
                >
                  {c.name}
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="gradient-minivat-cyan flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Droplet className="size-5 text-white" />
          </span>
          <span className="text-lg font-bold whitespace-nowrap">
            MINI VAT <span className="text-muted-foreground">PREMIUM</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-5 md:flex">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categorias/${c.slug}`}
              className="text-sm text-muted-foreground transition-colors hover:text-accent"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <form
          onSubmit={onSearch}
          className="relative hidden w-full max-w-xs sm:block"
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produtos..."
            className="pl-8"
          />
        </form>

        <div className="flex items-center gap-1">
          <Link
            href="/conta"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Minha conta"
          >
            <User className="size-5" />
          </Link>
          <CartDrawer />
        </div>
      </div>
    </header>
  )
}
