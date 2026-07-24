import { useQuery } from '@tanstack/react-query'
import { obtenerCapitulo } from '../lib/bibleApi'

export function bibleChapterQueryKey(version, usfmCode, chapter) {
  return ['bible-chapter', version, usfmCode, chapter]
}

export function useBibleChapter(version, usfmCode, chapter, options = {}) {
  return useQuery({
    queryKey: bibleChapterQueryKey(version, usfmCode, chapter),
    queryFn: () => obtenerCapitulo(version, usfmCode, chapter),
    staleTime: Infinity,
    enabled: Boolean(version && usfmCode && chapter) && options.enabled !== false,
  })
}
