export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function ageLabel(months?: number | null): string {
  if (months == null) return 'Idade não informada'
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(months / 12)
  const remaining = months % 12
  if (!remaining) return `${years} ${years === 1 ? 'ano' : 'anos'}`
  return `${years}a ${remaining}m`
}

export function petStatusLabel(status: string): string {
  return ({ DISPONIVEL: 'Disponível', ADOTADO: 'Adotado', INDISPONIVEL: 'Indisponível' } as Record<string, string>)[status] || status
}

export function capitalize(value: string): string {
  return value.toLocaleLowerCase('pt-BR').replace(/^./, (letter) => letter.toLocaleUpperCase('pt-BR'))
}
