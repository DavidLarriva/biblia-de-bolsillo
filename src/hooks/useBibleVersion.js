import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const DEFAULT_VERSION = 'rvr1960'

export function useBibleVersion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['bible-version', user?.id]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_bible_version')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      return data?.preferred_bible_version ?? DEFAULT_VERSION
    },
    enabled: !!user,
  })

  const mutation = useMutation({
    mutationFn: async (version) => {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_bible_version: version })
        .eq('id', user.id)
      if (error) throw error
      return version
    },
    onSuccess: (version) => {
      queryClient.setQueryData(queryKey, version)
    },
  })

  return {
    version: query.data ?? DEFAULT_VERSION,
    isLoading: query.isLoading,
    setVersion: mutation.mutate,
    isUpdating: mutation.isPending,
  }
}
