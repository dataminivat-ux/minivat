// Formatadores de apresentacao (a fonte sempre guarda centavos: integer).

// Centavos -> "R$ 1.299,00"
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Parcelamento simples: "6x de R$ 216,50"
export function formatInstallments(cents: number, maxInstallments = 6): string {
  const per = cents / maxInstallments
  return `${maxInstallments}x de ${formatBRL(per)}`
}
