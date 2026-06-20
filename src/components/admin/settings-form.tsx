'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { saveSettings } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type SettingsValues = {
  contact_email: string
  contact_whatsapp: string
  about_text: string
  shipping_policy_md: string
  return_policy_md: string
  privacy_policy_md: string
  terms_md: string
  max_installments: number
  free_shipping_threshold_reais: number
  checkout_min_total_reais: number
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, action, pending] = useActionState(saveSettings, null)

  useEffect(() => {
    if (state?.ok) toast.success('Configuracoes salvas.')
    else if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={action} className="grid max-w-3xl gap-6">
      <Section title="Contato">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">E-mail</Label>
            <Input
              id="contact_email"
              name="contact_email"
              defaultValue={values.contact_email}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_whatsapp">WhatsApp</Label>
            <Input
              id="contact_whatsapp"
              name="contact_whatsapp"
              defaultValue={values.contact_whatsapp}
            />
          </div>
        </div>
      </Section>

      <Section title="Loja">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="free_shipping_threshold_reais">
              Frete gratis acima de (R$)
            </Label>
            <Input
              id="free_shipping_threshold_reais"
              name="free_shipping_threshold_reais"
              type="number"
              step="0.01"
              min="0"
              defaultValue={values.free_shipping_threshold_reais || ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="checkout_min_total_reais">Compra minima (R$)</Label>
            <Input
              id="checkout_min_total_reais"
              name="checkout_min_total_reais"
              type="number"
              step="0.01"
              min="0"
              defaultValue={values.checkout_min_total_reais || ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_installments">Parcelas max</Label>
            <Input
              id="max_installments"
              name="max_installments"
              type="number"
              min="1"
              defaultValue={values.max_installments || 6}
            />
          </div>
        </div>
      </Section>

      <Section title="Textos institucionais (Markdown)">
        <div className="space-y-1.5">
          <Label htmlFor="about_text">Sobre</Label>
          <Textarea
            id="about_text"
            name="about_text"
            rows={4}
            defaultValue={values.about_text}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shipping_policy_md">Politica de frete</Label>
          <Textarea
            id="shipping_policy_md"
            name="shipping_policy_md"
            rows={4}
            defaultValue={values.shipping_policy_md}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="return_policy_md">Trocas e devolucoes</Label>
          <Textarea
            id="return_policy_md"
            name="return_policy_md"
            rows={4}
            defaultValue={values.return_policy_md}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="privacy_policy_md">Politica de privacidade</Label>
          <Textarea
            id="privacy_policy_md"
            name="privacy_policy_md"
            rows={4}
            defaultValue={values.privacy_policy_md}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="terms_md">Termos de uso</Label>
          <Textarea
            id="terms_md"
            name="terms_md"
            rows={4}
            defaultValue={values.terms_md}
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Salvando...' : 'Salvar configuracoes'}
        </Button>
      </div>
    </form>
  )
}
