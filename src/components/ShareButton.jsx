import { useState } from 'react'

export default function ShareButton({ title, text, className = '' }) {
  const [copiado, setCopiado] = useState(false)

  async function handleShare(event) {
    event.stopPropagation()

    if (navigator.share) {
      try {
        await navigator.share({ title, text })
      } catch {
        // el usuario canceló el share o el navegador lo rechazó; no hacemos nada más
      }
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // sin permiso de portapapeles; no hay más que ofrecer
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path strokeLinecap="round" d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
      </svg>
      {copiado ? 'Copiado' : 'Compartir'}
    </button>
  )
}
