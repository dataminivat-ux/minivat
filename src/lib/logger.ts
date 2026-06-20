// Logger estruturado simples (JSON). Suficiente para o checkout; em producao
// os logs caem no Vercel/Sentry.
type Fields = Record<string, unknown>

function emit(level: 'info' | 'warn' | 'error', base: Fields, msg: string, extra?: Fields) {
  const line = JSON.stringify({
    level,
    msg,
    ...base,
    ...extra,
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export function createLogger(base: Fields = {}) {
  return {
    child: (more: Fields) => createLogger({ ...base, ...more }),
    info: (extra: Fields, msg: string) => emit('info', base, msg, extra),
    warn: (extra: Fields, msg: string) => emit('warn', base, msg, extra),
    error: (extra: Fields, msg: string) => emit('error', base, msg, extra),
  }
}

export const logger = createLogger({ app: 'minivat' })
