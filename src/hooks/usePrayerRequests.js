import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function prayerRequestsQueryKey(userId) {
  return ['prayer-requests', userId]
}

export function usePrayerRequests() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = prayerRequestsQueryKey(user?.id)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] })
  }

  const createMutation = useMutation({
    mutationFn: async ({ content, tags }) => {
      const { error } = await supabase.from('prayer_requests').insert({
        user_id: user.id,
        content,
        tags: tags ?? [],
      })
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, content, tags, answerNote }) => {
      const payload = { content, tags: tags ?? [] }
      if (answerNote !== undefined) payload.answer_note = answerNote
      const { error } = await supabase.from('prayer_requests').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  const markAnsweredMutation = useMutation({
    mutationFn: async ({ id, answerNote }) => {
      const { error } = await supabase
        .from('prayer_requests')
        .update({
          status: 'respondida',
          answered_at: new Date().toISOString(),
          answer_note: answerNote || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('prayer_requests').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateContent: updateContentMutation.mutate,
    isUpdatingContent: updateContentMutation.isPending,
    markAnswered: markAnsweredMutation.mutate,
    isMarkingAnswered: markAnsweredMutation.isPending,
    remove: deleteMutation.mutate,
    actionError:
      createMutation.error ||
      updateContentMutation.error ||
      markAnsweredMutation.error ||
      deleteMutation.error ||
      null,
  }
}
