import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBibleBooks } from '../hooks/useBibleBooks'
import { useBibleVersion } from '../hooks/useBibleVersion'
import { bibleChapterQueryKey } from '../hooks/useBibleChapter'
import { obtenerCapitulo, describeBibleError } from '../lib/bibleApi'

const VERSIONES = [
  { value: 'rvr1960', label: 'RVR1960' },
  { value: 'ntv', label: 'NTV' },
]

export default function VerseSearchModal({ onInsert, onClose }) {
  const { data: bibleBooksList } = useBibleBooks()
  const { version, setVersion } = useBibleVersion()
  const queryClient = useQueryClient()

  const [libroId, setLibroId] = useState(null)
  const [capituloInput, setCapituloInput] = useState('1')
  const [libroCargado, setLibroCargado] = useState(null)
  const [versiculos, setVersiculos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const libros = bibleBooksList ?? []
  const libroSeleccionado = libros.find((libro) => libro.id === libroId) ?? libros[0]
  const maxCapitulo = libroSeleccionado?.chapters_count ?? 150
  // El campo permite escribir libremente (incluso vacío mientras se borra);
  // el número efectivo se recorta solo al usarlo, no en cada tecla.
  const capitulo = Math.min(Math.max(1, Number(capituloInput) || 1), maxCapitulo)

  function cambiarLibro(id) {
    setLibroId(id)
    setCapituloInput('1')
    setVersiculos(null)
    setLibroCargado(null)
  }

  function cambiarCapituloInput(valor) {
    setCapituloInput(valor.replace(/[^0-9]/g, ''))
  }

  function normalizarCapituloInput() {
    setCapituloInput(String(capitulo))
  }

  async function handleCargar() {
    if (!libroSeleccionado) return

    normalizarCapituloInput()
    setCargando(true)
    setError('')
    setVersiculos(null)

    try {
      // El texto bíblico es estático: se cachea por versión/libro/capítulo
      // para no repetir la llamada a la API externa cada vez que se abre
      // este panel y se pide el mismo capítulo (comparte caché con Lectura).
      const datos = await queryClient.fetchQuery({
        queryKey: bibleChapterQueryKey(version, libroSeleccionado.usfm_code, capitulo),
        queryFn: () => obtenerCapitulo(version, libroSeleccionado.usfm_code, capitulo),
        staleTime: Infinity,
      })
      setLibroCargado(datos.libro)
      setVersiculos(datos.versiculos)
    } catch (err) {
      setError(describeBibleError(err))
    } finally {
      setCargando(false)
    }
  }

  function handleSelect(versiculo) {
    onInsert({
      referencia: `${libroCargado ?? libroSeleccionado?.name} ${capitulo}:${versiculo.versiculo}`,
      texto: versiculo.texto,
      version,
    })
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

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-text-muted">Versión:</span>
          {VERSIONES.map((opcion) => (
            <button
              key={opcion.value}
              type="button"
              onClick={() => setVersion(opcion.value)}
              className={`text-sm rounded-full px-3 py-1 border ${
                version === opcion.value
                  ? 'bg-accent text-accent-text border-accent'
                  : 'border-text-muted text-text-muted hover:text-text-primary'
              }`}
            >
              {opcion.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <select
            value={libroSeleccionado?.id ?? ''}
            onChange={(event) => cambiarLibro(Number(event.target.value))}
            className="flex-1 min-w-0 bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          >
            {libros.map((libro) => (
              <option key={libro.id} value={libro.id}>
                {libro.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={capituloInput}
            onChange={(event) => cambiarCapituloInput(event.target.value)}
            onBlur={normalizarCapituloInput}
            className="w-16 bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleCargar}
            disabled={cargando || !libroSeleccionado}
            className="bg-accent text-accent-text rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60 shrink-0"
          >
            {cargando ? 'Cargando…' : 'Cargar'}
          </button>
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {versiculos?.map((v) => (
            <button
              key={v.versiculo}
              type="button"
              onClick={() => handleSelect(v)}
              className="text-left rounded-lg px-3 py-2 hover:bg-bg-elevated-2"
            >
              <p className="font-voice text-sm text-accent">
                {libroCargado ?? libroSeleccionado?.name} {capitulo}:{v.versiculo}
              </p>
              <p className="text-sm text-text-primary">{v.texto}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-start text-sm text-text-secondary mt-4"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
