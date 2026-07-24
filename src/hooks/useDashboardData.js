import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { toLocalDateString } from '../lib/date'

export const TOTAL_CHAPTERS = 1189

function toUTCTimestamp(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function computeStreaks(dates) {
  const unique = [...new Set(dates)].sort()
  if (unique.length === 0) return { current: 0, record: 0 }

  const dayMs = 24 * 60 * 60 * 1000
  let record = 1
  let run = 1
  for (let i = 1; i < unique.length; i++) {
    const diffDays = (toUTCTimestamp(unique[i]) - toUTCTimestamp(unique[i - 1])) / dayMs
    run = diffDays === 1 ? run + 1 : 1
    if (run > record) record = run
  }

  const dateSet = new Set(unique)
  const today = toLocalDateString(new Date())
  let cursor = dateSet.has(today) ? toUTCTimestamp(today) : toUTCTimestamp(today) - dayMs
  let current = 0
  while (dateSet.has(new Date(cursor).toISOString().slice(0, 10))) {
    current += 1
    cursor -= dayMs
  }

  return { current, record }
}

async function fetchDashboard(userId) {
  const [
    { data: progressRows, error: progressError },
    { count: savedVersesCount, error: savedError },
    { count: memorizingCount, error: memoError },
    { count: pendingPrayersCount, error: prayerError },
    { count: activeGoalsCount, error: goalsError },
    { data: journalRows, error: journalError },
  ] = await Promise.all([
    supabase.from('reading_progress').select('completed_at').eq('user_id', userId),
    supabase
      .from('saved_verses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('saved_verses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_memorizing', true),
    supabase
      .from('prayer_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pendiente'),
    supabase
      .from('spiritual_goals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'cumplida'),
    supabase
      .from('journal_entries')
      .select('entry_date, content')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1),
  ])

  const firstError =
    progressError || savedError || memoError || prayerError || goalsError || journalError
  if (firstError) throw firstError

  const dates = (progressRows ?? []).map((row) => row.completed_at)
  const streak = computeStreaks(dates)
  const readToday = dates.includes(toLocalDateString(new Date()))

  return {
    streak,
    readToday,
    chaptersCompleted: progressRows?.length ?? 0,
    savedVersesCount: savedVersesCount ?? 0,
    memorizingCount: memorizingCount ?? 0,
    pendingPrayersCount: pendingPrayersCount ?? 0,
    activeGoalsCount: activeGoalsCount ?? 0,
    lastJournalEntry: journalRows?.[0] ?? null,
  }
}

export function useDashboardData() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => fetchDashboard(user.id),
    enabled: !!user,
  })
}
