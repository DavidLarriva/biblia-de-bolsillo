import { useMemo, useState } from 'react'
import { useSpiritualGoals } from '../../hooks/useSpiritualGoals'
import GoalFormModal from '../../components/GoalFormModal'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { toLocalDateString, formatLongDate } from '../../lib/date'
import { describeSupabaseError } from '../../lib/errors'

const STATUS_GROUPS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'cumplida', label: 'Cumplida' },
]

function GoalCard({ goal, onEdit, onDelete, onStatusChange }) {
  const today = toLocalDateString(new Date())
  const isOverdue = goal.target_date && goal.status !== 'cumplida' && goal.target_date < today

  return (
    <div className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-primary">{goal.title}</p>
        <select
          value={goal.status}
          onChange={(event) => onStatusChange(goal.id, event.target.value)}
          className="bg-bg-elevated-2 border border-border-subtle rounded px-2 py-1 text-xs text-text-secondary shrink-0"
        >
          {STATUS_GROUPS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {goal.description && <p className="text-sm text-text-secondary">{goal.description}</p>}

      {goal.target_date && (
        <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-text-muted'}`}>
          {isOverdue ? 'Venció el ' : 'Fecha límite: '}
          {formatLongDate(goal.target_date)}
        </p>
      )}

      <div className="flex items-center gap-4 mt-1">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Editar
        </button>
        <button type="button" onClick={onDelete} className="text-xs text-red-400">
          Eliminar
        </button>
      </div>
    </div>
  )
}

export default function MetasPage() {
  const { goals, isLoading, isError, updateStatus, remove, actionError } = useSpiritualGoals()
  const [formState, setFormState] = useState(null)

  const grouped = useMemo(
    () => ({
      pendiente: goals.filter((g) => g.status === 'pendiente'),
      en_progreso: goals.filter((g) => g.status === 'en_progreso'),
      cumplida: goals.filter((g) => g.status === 'cumplida'),
    }),
    [goals]
  )

  const hasAnyGoals = goals.length > 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-voice text-lg text-text-primary">Metas</h1>
        <button
          type="button"
          onClick={() => setFormState({ mode: 'create' })}
          className="bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium shrink-0"
        >
          + nueva meta
        </button>
      </div>

      {actionError && (
        <p className="text-sm text-red-400">{describeSupabaseError(actionError)}</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tus metas. Intentá recargar la página.
        </p>
      )}

      {isLoading && <SkeletonList count={3} />}

      {!isLoading && !isError && !hasAnyGoals && (
        <EmptyState title="Poné tu primera meta">
          Un propósito espiritual concreto —leer un libro, memorizar un salmo, orar cada mañana—
          empieza acá. Tocá «+ nueva meta».
        </EmptyState>
      )}

      {!isLoading &&
        hasAnyGoals &&
        STATUS_GROUPS.map((group) => (
          <section key={group.value}>
            <h2 className="text-sm text-text-secondary mb-3">{group.label}</h2>
            {grouped[group.value].length === 0 && (
              <p className="text-sm text-text-secondary">Nada por acá todavía.</p>
            )}
            <div className="flex flex-col gap-3">
              {grouped[group.value].map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => setFormState({ mode: 'edit', existingGoal: goal })}
                  onDelete={() => remove(goal.id)}
                  onStatusChange={(id, status) => updateStatus({ id, status })}
                />
              ))}
            </div>
          </section>
        ))}

      {formState && (
        <GoalFormModal
          mode={formState.mode}
          existingGoal={formState.existingGoal}
          onClose={() => setFormState(null)}
        />
      )}
    </div>
  )
}
