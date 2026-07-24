function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Interpreta una referencia bíblica escrita libremente (ej. "Juan 3:16", "Salmos 23")
 * contra una lista de libros ya cargada desde Supabase.
 * @param {string} texto
 * @param {Array<{id: any, name: string, usfm_code: string, chapters_count: number, testament: string, order_num: number}>} bibleBooksList
 * @returns {{ book: object, chapter: number|null, verse: number|null } | null}
 */
export function parseReference(texto, bibleBooksList) {
  if (!texto || !bibleBooksList?.length) return null

  const normalizado = normalizar(texto)
  const match = normalizado.match(/^(.*?)\s*(\d+)(?::(\d+))?$/)

  const nombreLibro = match ? match[1].trim() : normalizado
  const capitulo = match ? Number(match[2]) : null
  const versiculo = match?.[3] ? Number(match[3]) : null

  if (!nombreLibro) return null

  const libro = bibleBooksList.find((b) => normalizar(b.name) === nombreLibro)
  if (!libro) return null

  return { book: libro, chapter: capitulo, verse: versiculo }
}
