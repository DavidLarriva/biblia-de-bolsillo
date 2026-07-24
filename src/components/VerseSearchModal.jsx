import { useState } from 'react'
import { useBibleVersion } from '../hooks/useBibleVersion'
import { useBibleBooks } from '../hooks/useBibleBooks'
import { obtenerCapitulo, buscar, describeBibleError } from '../lib/bibleApi'
import { parseReference } from '../lib/parseReference'
import BibleVersionToggle from './BibleVersionToggle'

const MAX_RESULTS = 20

function previewWords(text, count = 12) {
  const words = text.trim().split(/\s+/)
  if (words.length <= count) return text
  return `${words.slice(0, count).join(' ')}…`
}

export default function VerseSearchModal({ onInsert, onClose }) {
  const { version } = useBibleVersion()
  const { data: bibleBooksList } = useBibleBooks()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(event) {
    event.preventDefault()
    if (!query.trim()) return

    setError('')
    setLoading(true)
    setResults([])
    setTruncated(false)

    try {
      const parsed = parseReference(query, bibleBooksList ?? [])

      if (parsed && parsed.verse != null) {
        const data = await obtenerCapitulo(version, parsed.book.usfm_code, parsed.chapter)
        const match = data.versiculos.find((v) => v.versiculo === parsed.verse)
        if (match) {
          setResults([
            {
              referencia: `${parsed.book.name} ${parsed.chapter}:${parsed.verse}`,
              texto: match.texto,
            },
          ])
        } else {
          setError('No se encontró ese versículo.')
        }
      } else {
        const data = await buscar(version, query.trim())
        setTruncated(data.length > MAX_RESULTS)
        setResults(
          data.slice(0, MAX_RESULTS).map((r) => ({
            referencia: `${r.libro} ${r.capitulo}:${r.versiculo}`,
            texto: r.texto,
          }))
        )
        if (data.length === 0) setError('No se encontraron resultados.')
      }
    } catch (err) {
      setError(describeBibleError(err))
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(result) {
    onInsert({ referencia: result.referencia, texto: result.texto, version })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-bg-elevated rounded-xl p-6">
        <h2 className="font-voice text-xl text-text-primary mb-4">Insertar versículo</h2>

        <div className="mb-3">
          <BibleVersionToggle />
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Juan 3:16 o una palabra"
            className="flex-1 bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {results.map((result, index) => (
            <button
              key={`${result.referencia}-${index}`}
              type="button"
              onClick={() => handleSelect(result)}
              className="text-left bg-bg-elevated-2 rounded-lg p-3 hover:bg-bg-elevated"
            >
              <p className="font-voice text-sm text-text-primary">{result.referencia}</p>
              <p className="text-sm text-text-secondary">{previewWords(result.texto)}</p>
            </button>
          ))}
        </div>

        {truncated && (
          <p className="text-xs text-text-muted mt-3">
            Mostrando los primeros {MAX_RESULTS} resultados. Afina la búsqueda para ver menos.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-text-secondary mt-4 self-end"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
