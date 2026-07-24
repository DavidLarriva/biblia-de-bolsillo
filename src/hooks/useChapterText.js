import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { obtenerCapitulo } from '../lib/bibleApi'

export function chapterTextQueryKey(version, bookUsfm, chapter) {
  return ['chapter-text', version, bookUsfm, chapter]
}

async function fetchChapterText(version, bookUsfm, chapter) {
  const { data: cached, error: cacheError } = await supabase
    .from('bible_text_cache')
    .select('versiculos')
    .eq('version', version)
    .eq('book_usfm', bookUsfm)
    .eq('chapter', chapter)
    .maybeSingle()

  if (cacheError) throw cacheError
  if (cached) return cached.versiculos

  const data = await obtenerCapitulo(version, bookUsfm, chapter)

  // Best-effort: si el insert falla (ej. otro request ya cacheó lo mismo),
  // igual mostramos el texto recién obtenido de la API.
  await supabase
    .from('bible_text_cache')
    .insert({ version, book_usfm: bookUsfm, chapter, versiculos: data.versiculos })

  return data.versiculos
}

export function useChapterText(version, bookUsfm, chapter, enabled = true) {
  return useQuery({
    queryKey: chapterTextQueryKey(version, bookUsfm, chapter),
    queryFn: () => fetchChapterText(version, bookUsfm, chapter),
    enabled: Boolean(enabled && version && bookUsfm && chapter),
    staleTime: Infinity,
    retry: false,
  })
}
