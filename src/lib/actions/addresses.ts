'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export type AddressState = { error?: string; ok?: boolean } | null

export async function saveAddress(
  _prev: AddressState,
  formData: FormData
): Promise<AddressState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Faca login.' }

  const id = String(formData.get('id') ?? '').trim() || null
  const isDefault = formData.get('is_default') === 'on'

  const payload = {
    user_id: user.id,
    recipient_name: String(formData.get('recipient_name') ?? '').trim(),
    cep: String(formData.get('cep') ?? '').replace(/\D/g, ''),
    street: String(formData.get('street') ?? '').trim(),
    number: String(formData.get('number') ?? '').trim(),
    complement: String(formData.get('complement') ?? '').trim() || null,
    neighborhood: String(formData.get('neighborhood') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    state: String(formData.get('state') ?? '')
      .trim()
      .toUpperCase()
      .slice(0, 2),
    is_default: isDefault,
  }

  if (
    !payload.recipient_name ||
    !payload.cep ||
    !payload.street ||
    !payload.number ||
    !payload.city ||
    !payload.state
  ) {
    return { error: 'Preencha os campos obrigatorios.' }
  }

  // garante apenas um endereco padrao
  if (isDefault) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('type', 'shipping')
  }

  const { error } = id
    ? await supabase
        .from('addresses')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
    : await supabase.from('addresses').insert(payload)

  if (error) return { error: error.message }

  revalidatePath('/conta/enderecos')
  return { ok: true }
}

export async function deleteAddress(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('addresses').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/conta/enderecos')
}
