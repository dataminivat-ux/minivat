import type { NextConfig } from 'next'

// Headers de seguranca (ver docs/07-SECURITY-LGPD.md)
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

// Content Security Policy estrita (ver docs/07-SECURITY-LGPD.md)
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    https://www.googletagmanager.com
    https://www.google-analytics.com
    https://connect.facebook.net
    https://sdk.mercadopago.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self'
    https://*.supabase.co
    wss://*.supabase.co
    https://api.mercadopago.com
    https://www.melhorenvio.com.br
    https://sandbox.melhorenvio.com.br
    https://viacep.com.br
    https://www.google-analytics.com
    https://*.ingest.sentry.io;
  frame-src 'self' https://www.mercadopago.com.br https://www.googletagmanager.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\n/g, ' ')
  .trim()

const nextConfig: NextConfig = {
  // 'standalone' so para build de container/self-host. Desligado por padrao:
  // no Windows o standalone gera symlinks que exigem privilegio elevado (EPERM),
  // e a Vercel nao usa standalone. Ative com STANDALONE_BUILD=true (ex.: Docker/Linux).
  output: process.env.STANDALONE_BUILD === 'true' ? 'standalone' : undefined,

  // Imagens remotas do Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Uploads via Server Actions (ate 5mb)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...securityHeaders, { key: 'Content-Security-Policy', value: cspHeader }],
      },
    ]
  },
}

export default nextConfig
