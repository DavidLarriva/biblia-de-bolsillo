import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function studyNotesQueryKey(userId) {
  return ['study-notes', userId]
}

export function useStudyNotes() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = studyNotesQueryKey(user?.id)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_notes')
        .select('*, saved_verses(*)')
        .eq('user_id', user.id)
        .order('note_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
  }

  const saveMutation = useMutation({
    mutationFn: async ({ id, noteDate, title, linkedVerseId, content }) => {
      const payload = { note_date: noteDate, title, linked_verse_id: linkedVerseId, content }

      if (id) {
        const { error } = await supabase.from('study_notes').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('study_notes')
          .insert({ ...payload, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('study_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error || null,
  }
}
