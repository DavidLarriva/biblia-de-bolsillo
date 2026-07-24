// Mensaje breve y amable para errores de mutaciones de Supabase, sin exponer
// detalles técnicos crudos cuando no aportan.
export function describeSupabaseError(error, fallback = 'No se pudo completar la acción. Intentá de nuevo.') {
  if (!error) return ''
  const message = typeof error === 'string' ? error : error.message
  return message || fallback
}
