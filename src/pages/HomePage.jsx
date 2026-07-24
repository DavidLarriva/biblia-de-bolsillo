import { Link } from 'react-router-dom'
import { useDashboardData, TOTAL_CHAPTERS } from '../hooks/useDashboardData'
import { stripHtml } from '../lib/stripHtml'
import { formatLongDate } from '../lib/date'
import { Skeleton } from '../components/Skeleton'

function Card({ children, className = '' }) {
  return <div className={`bg-bg-elevated rounded-xl p-5 ${className}`}>{children}</div>
}

export default function HomePage() {
  const { data, isLoading, isError } = useDashboardData()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-400">
        No pudimos cargar tu panel. Intenta recargar la página.
      </p>
    )
  }

  const {
    streak,
    readToday,
    chaptersCompleted,
    savedVersesCount,
    memorizingCount,
    pendingPrayersCount,
    activeGoalsCount,
    lastJournalEntry,
  } = data

  const progressPct = Math.min(100, Math.round((chaptersCompleted / TOTAL_CHAPTERS) * 100))
  const journalPreview = lastJournalEntry ? stripHtml(lastJournalEntry.content) : ''
  const journalTruncated = journalPreview.length > 180

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <p className="text-sm text-text-secondary mb-1">Racha actual</p>
        <p className="font-voice text-3xl text-text-primary">{streak.current} días</p>
        <p className="text-sm text-text-muted mt-1">Récord: {streak.record} días</p>
      </Card>

      <Card>
        <p className="text-sm text-text-secondary mb-2">Lectura de hoy</p>
        {readToday ? (
          <p className="text-text-primary">Ya completaste tu lectura de hoy.</p>
        ) : (
          <Link
            to="/lectura"
            className="inline-block bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium"
          >
            Ir a Lectura
          </Link>
        )}
      </Card>

      <Card className="sm:col-span-2">
        <p className="text-sm text-text-secondary mb-2">Progreso general</p>
        <div className="h-2 rounded-full bg-bg-elevated-2 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-sm text-text-muted mt-2">
          {chaptersCompleted} / {TOTAL_CHAPTERS} capítulos ({progressPct}%)
        </p>
      </Card>

      <Card>
        <p className="text-sm text-text-secondary mb-3">Resumen</p>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-text-secondary">Versículos guardados</span>
            <span className="text-text-primary">{savedVersesCount}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-text-secondary">En memorización</span>
            <span className="text-text-primary">{memorizingCount}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-text-secondary">Oraciones pendientes</span>
            <span className="text-text-primary">{pendingPrayersCount}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-text-secondary">Metas activas</span>
            <span className="text-text-primary">{activeGoalsCount}</span>
          </li>
        </ul>
      </Card>

      <Card>
        <p className="text-sm text-text-secondary mb-2">Última entrada del diario</p>
        {lastJournalEntry ? (
          <>
            <p className="text-sm text-text-muted mb-1">
              {formatLongDate(lastJournalEntry.entry_date)}
            </p>
            <p className="font-voice text-text-primary line-clamp-3">
              {journalPreview.slice(0, 180)}
              {journalTruncated ? '…' : ''}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted">Todavía no escribiste ninguna entrada.</p>
        )}
      </Card>
    </div>
  )
}
