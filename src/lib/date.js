export function toLocalDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatLongDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
