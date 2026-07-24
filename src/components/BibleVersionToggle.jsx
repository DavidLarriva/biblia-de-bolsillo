import { useBibleVersion } from '../hooks/useBibleVersion'

const OPTIONS = [
  { value: 'rvr1960', label: 'RVR1960' },
  { value: 'ntv', label: 'NTV' },
]

export default function BibleVersionToggle() {
  const { version, setVersion } = useBibleVersion()

  return (
    <div className="flex items-center gap-3 text-sm">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setVersion(option.value)}
          className={option.value === version ? 'text-accent' : 'text-text-muted'}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
