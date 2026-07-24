import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function spiritualGoalsQueryKey(userId) {
  return ['spiritual-goals', userId]
}

export function useSpiritualGoals() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = spiritualGoalsQueryKey(user?.id)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spiritual_goals')
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

  const saveMutation = useMutation({
    mutationFn: async ({ id, title, description, status, targetDate }) => {
      const payload = {
        title,
        description,
        status,
        target_date: targetDate,
      }

      if (id) {
        const { error } = await supabase.from('spiritual_goals').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('spiritual_goals')
          .insert({ ...payload, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: invalidateAll,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('spiritual_goals').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('spiritual_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    remove: deleteMutation.mutate,
    actionError: updateStatusMutation.error || deleteMutation.error || null,
  }
}
