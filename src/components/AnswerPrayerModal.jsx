import { useState } from 'react'
import NotebookEditor from './NotebookEditor'

export default function AnswerPrayerModal({ onConfirm, onClose, isSaving }) {
  const [answerNote, setAnswerNote] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onConfirm(answerNote.trim() || null)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md bg-bg-elevated rounded-xl p-6">
        <h2 className="font-voice text-xl text-text-primary mb-2">Marcar como respondida</h2>
        <p className="text-sm text-text-secondary mb-4">
          Si quieres, cuenta cómo respondió Dios esta oración. Puedes dejarlo en blanco.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NotebookEditor
            value={answerNote}
            onChange={setAnswerNote}
            editorClassName="text-text-primary leading-relaxed"
            minHeightClass="min-h-[4.5rem]"
          />

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="text-sm text-text-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-accent text-accent-text rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
