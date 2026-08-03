import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { useBibleBooks } from '../../hooks/useBibleBooks'
import { useReadingProgress } from '../../hooks/useReadingProgress'
import { useBibleVersion } from '../../hooks/useBibleVersion'
import { useChapterText } from '../../hooks/useChapterText'
import BibleVersionToggle from '../../components/BibleVersionToggle'
import { SkeletonList } from '../../components/Skeleton'
import { BibleApiError, describeBibleError } from '../../lib/bibleApi'
import { describeSupabaseError } from '../../lib/errors'

const TESTAMENT_LABELS = {
  AT: 'Antiguo Testamento',
  NT: 'Nuevo Testamento',
}

const ACCENT_COLOR = '#C9A66B'
const BG_ELEVATED_2_COLOR = '#202020'
const EMPTY_PROGRESS = []

function TestamentProgressBar({ label, read, total }) {
  const pct = total > 0 ? (read / total) * 100 : 0
  // Un valor de exactamente 0 hace que Recharts no dibuje ni siquiera el
  // fondo de la barra; un epsilon evita eso sin aparentar progreso real.
  const chartValue = pct === 0 ? 0.0001 : pct

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-text-secondary">
        {label} — {read}/{total}
      </p>
      <ResponsiveContainer width="100%" height={14}>
        <BarChart
          data={[{ name: label, pct: chartValue }]}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Bar
            dataKey="pct"
            fill={ACCENT_COLOR}
            background={{ fill: BG_ELEVATED_2_COLOR, radius: 7 }}
            radius={7}
            barSize={14}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function getHighlightedChapter(bookProgress) {
  if (bookProgress.length === 0) return 1
  const sorted = [...bookProgress].sort((a, b) => {
    if (a.completed_at !== b.completed_at) return a.completed_at < b.completed_at ? 1 : -1
    return b.chapter - a.chapter
  })
  return sorted[0].chapter
}

function ChapterText({ book, chapter }) {
  const { version } = useBibleVersion()
  const { data, isLoading, isError, error } = useChapterText(version, book.usfm_code, chapter)

  // Distingue un fallo de red (BibleApiError con status null) de una respuesta
  // 400/404 del servidor; en ambos casos se puede seguir marcando la lectura.
  const errorMessage =
    error instanceof BibleApiError
      ? describeBibleError(error)
      : 'No se pudo cargar el texto ahora.'

  return (
    <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col gap-3">
      <BibleVersionToggle />

      <p className="text-xs text-text-muted">
        {book.name} {chapter}
      </p>

      {isLoading && <p className="text-sm text-text-secondary">Cargando texto…</p>}

      {isError && (
        <p className="text-sm text-red-400">
          {errorMessage} Puedes seguir marcando el capítulo como leído.
        </p>
      )}

      {data && (
        <div className="flex flex-col gap-2">
          {data.map((verso) => (
            <p key={verso.versiculo} className="font-voice text-text-primary leading-relaxed">
              <span className="text-text-muted text-sm mr-2">{verso.versiculo}</span>
              {verso.texto}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function BookRow({ book, bookProgress, onToggleChapter }) {
  const [expanded, setExpanded] = useState(false)
  const [verTextoOpen, setVerTextoOpen] = useState(false)

  const completedCount = bookProgress.length
  const pct = Math.round((completedCount / book.chapters_count) * 100)
  const markedChapters = useMemo(
    () => new Set(bookProgress.map((p) => p.chapter)),
    [bookProgress]
  )
  const highlightedChapter = useMemo(() => getHighlightedChapter(bookProgress), [bookProgress])

  return (
    <div className="bg-bg-elevated rounded-xl p-4">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-text-primary">{book.name}</p>
          <p className="text-xs text-text-muted shrink-0">
            {completedCount}/{book.chapters_count} capítulos
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-bg-elevated-2 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {expanded && (
        <div className="mt-4">
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {Array.from({ length: book.chapters_count }, (_, i) => i + 1).map((chapter) => {
              const isMarked = markedChapters.has(chapter)
              return (
                <button
                  key={chapter}
                  type="button"
                  onClick={() => onToggleChapter(book.id, chapter, isMarked)}
                  className={`h-8 w-8 rounded text-xs flex items-center justify-center ${
                    isMarked
                      ? 'bg-accent text-accent-text'
                      : 'bg-bg-elevated-2 text-text-secondary'
                  }`}
                >
                  {chapter}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setVerTextoOpen((v) => !v)}
            className="mt-4 text-sm text-text-muted hover:text-accent"
          >
            {verTextoOpen ? 'Ocultar texto' : 'Ver texto'}
          </button>

          {verTextoOpen && <ChapterText book={book} chapter={highlightedChapter} />}
        </div>
      )}
    </div>
  )
}

export default function LecturaPage() {
  const { data: books, isLoading: booksLoading, isError: booksError } = useBibleBooks()
  const { progress, toggle, toggleError } = useReadingProgress()

  const grouped = useMemo(() => {
    const list = books ?? []
    return {
      AT: list.filter((b) => b.testament === 'AT'),
      NT: list.filter((b) => b.testament === 'NT'),
    }
  }, [books])

  const testamentTotals = useMemo(() => {
    const bookTestamentById = new Map((books ?? []).map((b) => [b.id, b.testament]))

    const totals = {
      AT: { read: 0, total: 0 },
      NT: { read: 0, total: 0 },
    }

    for (const book of books ?? []) {
      totals[book.testament].total += book.chapters_count
    }

    for (const entry of progress) {
      const testament = bookTestamentById.get(entry.book_id)
      if (testament) totals[testament].read += 1
    }

    return totals
  }, [books, progress])

  // Antes se hacía progress.filter(...) por cada uno de los 66 libros en
  // cada render (O(libros × progreso)). Agruparlo una sola vez es O(progreso).
  const progressByBook = useMemo(() => {
    const map = new Map()
    for (const entry of progress) {
      const list = map.get(entry.book_id)
      if (list) list.push(entry)
      else map.set(entry.book_id, [entry])
    }
    return map
  }, [progress])

  function handleToggleChapter(bookId, chapter, isMarked) {
    toggle({ bookId, chapter, isMarked })
  }

  if (booksError) {
    return (
      <p className="text-sm text-red-400">
        No pudimos cargar la lista de libros. Intenta recargar la página.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-4">
        <TestamentProgressBar
          label={TESTAMENT_LABELS.AT}
          read={testamentTotals.AT.read}
          total={testamentTotals.AT.total}
        />
        <TestamentProgressBar
          label={TESTAMENT_LABELS.NT}
          read={testamentTotals.NT.read}
          total={testamentTotals.NT.total}
        />
      </div>

      {toggleError && (
        <p className="text-sm text-red-400">{describeSupabaseError(toggleError)}</p>
      )}

      {booksLoading && <SkeletonList count={5} />}

      {!booksLoading &&
        ['AT', 'NT'].map((testament) => (
          <section key={testament}>
            <h2 className="font-voice text-lg text-text-primary mb-3">
              {TESTAMENT_LABELS[testament]}
            </h2>
            <div className="flex flex-col gap-3">
              {grouped[testament].map((book) => (
                <BookRow
                  key={book.id}
                  book={book}
                  bookProgress={progressByBook.get(book.id) ?? EMPTY_PROGRESS}
                  onToggleChapter={handleToggleChapter}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  )
}
