import { Link } from 'react-router-dom'
import { formatLongDate } from '../lib/date'

export default function StudyNoteDetailModal({ note, onClose, onDelete }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-bg-elevated rounded-xl p-6">
        <p className="text-sm text-text-muted mb-1">{formatLongDate(note.note_date)}</p>
        <h2 className="font-voice text-xl text-text-primary mb-1">{note.title}</h2>
        {note.passage && <p className="text-sm text-accent mb-4">{note.passage}</p>}

        <div
          className="font-voice text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border-subtle">
          <button type="button" onClick={onDelete} className="text-sm text-red-400">
            Eliminar
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="text-sm text-text-secondary">
              Cerrar
            </button>
            <Link to={`/notas/${note.id}`} className="text-sm text-accent">
              Editar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
