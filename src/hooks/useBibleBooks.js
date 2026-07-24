import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

async function fetchBibleBooks() {
  const { data, error } = await supabase
    .from('bible_books')
    .select('id, testament, order_num, name, chapters_count, usfm_code')
    .order('order_num', { ascending: true })
  if (error) throw error
  return data
}

export function useBibleBooks() {
  return useQuery({
    queryKey: ['bible-books'],
    queryFn: fetchBibleBooks,
    staleTime: Infinity,
  })
}
