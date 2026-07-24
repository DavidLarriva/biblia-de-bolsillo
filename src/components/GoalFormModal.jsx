import { useState } from 'react'
import { useSpiritualGoals } from '../hooks/useSpiritualGoals'

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'cumplida', label: 'Cumplida' },
]

export default function GoalFormModal({ mode, existingGoal, onClose }) {
  const { save, remove, isSaving } = useSpiritualGoals()
  const [title, setTitle] = useState(existingGoal?.title ?? '')
  const [description, setDescription] = useState(existingGoal?.description ?? '')
  const [status, setStatus] = useState(existingGoal?.status ?? 'pendiente')
  const [targetDate, setTargetDate] = useState(existingGoal?.target_date ?? '')
  const [formError, setFormError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    save(
      {
        id: existingGoal?.id,
        title: title.trim(),
        description: description.trim() || null,
        status,
        targetDate: targetDate || null,
      },
      {
        onSuccess: onClose,
        onError: (err) => setFormError(err.message ?? 'No se pudo guardar la meta.'),
      }
    )
  }

  function handleDelete() {
    setFormError('')
    remove(existingGoal.id, {
      onSuccess: onClose,
      onError: (err) => setFormError(err.message ?? 'No se pudo eliminar la meta.'),
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-bg-elevated rounded-xl p-6">
        <h2 className="font-voice text-xl text-text-primary mb-4">
          {mode === 'edit' ? 'Editar meta' : 'Nueva meta'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm text-text-secondary">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm text-text-secondary">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Opcional"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm text-text-secondary">
              Estado
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="targetDate" className="text-sm text-text-secondary">
              Fecha límite
            </label>
            <input
              id="targetDate"
              type="date"
              value={targetDate ?? ''}
              onChange={(event) => setTargetDate(event.target.value)}
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {formError && <p className="text-sm text-red-400">{formError}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            {mode === 'edit' ? (
              <button type="button" onClick={handleDelete} className="text-sm text-red-400">
                Eliminar
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="text-sm text-text-secondary">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="bg-accent text-accent-text rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {isSaving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
