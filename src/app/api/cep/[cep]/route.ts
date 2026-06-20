import { NextResponse } from 'next/server'

// Proxy ViaCEP (cache 24h). Sem chave externa.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cep: string }> }
) {
  const { cep } = await params
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) {
    return NextResponse.json({ error: 'CEP invalido' }, { status: 400 })
  }

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Falha ao consultar CEP' }, { status: 502 })
  }
  const data = await res.json()
  if (data.erro) {
    return NextResponse.json({ error: 'CEP nao encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    cep: digits,
    street: data.logradouro ?? '',
    neighborhood: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
    complement: data.complemento ?? '',
  })
}
