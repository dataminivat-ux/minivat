'use client'

import ReactMarkdown from 'react-markdown'

// Renderiza markdown vindo do banco (site_settings). Estilizacao via
// variantes de child selector (sem plugin de typography).
export function Markdown({ content }: { content: string }) {
  return (
    <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:font-medium [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
