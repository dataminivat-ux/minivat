import { getSetting } from '@/lib/settings'
import { Markdown } from '@/components/shared/markdown'

// Pagina institucional generica: le o conteudo (markdown) de site_settings
// e cai para um fallback enquanto o cliente nao preencher.
export async function InstitutionalPage({
  title,
  settingKey,
  fallback,
}: {
  title: string
  settingKey: string
  fallback: string
}) {
  const content = (await getSetting(settingKey)) ?? fallback

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">{title}</h1>
      <Markdown content={content} />
    </div>
  )
}
