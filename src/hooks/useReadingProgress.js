import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { toLocalDateString } from '../lib/date'

export function readingProgressQueryKey(userId) {
  return ['reading-progress', userId]
}

export function useReadingProgress() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = readingProgressQueryKey(user?.id)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('id, book_id, chapter, completed_at')
        .eq('user_id', user.id)
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ bookId, chapter, isMarked }) => {
      if (isMarked) {
        const { error } = await supabase
          .from('reading_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .eq('chapter', chapter)
        if (error) throw error
      } else {
        const { error } = await supabase.from('reading_progress').insert({
          user_id: user.id,
          book_id: bookId,
          chapter,
          completed_at: toLocalDateString(new Date()),
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] })
    },
  })

  return {
    progress: query.data ?? [],
    isLoading: query.isLoading,
    toggle: toggleMutation.mutate,
    toggleError: toggleMutation.error || null,
  }
}
