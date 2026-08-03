import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/lectura', label: 'Lectura' },
  { to: '/versiculos', label: 'Versículos' },
  { to: '/diario', label: 'Diario' },
  { to: '/oracion', label: 'Oración' },
  { to: '/notas', label: 'Notas' },
  { to: '/metas', label: 'Metas' },
]

function navLinkClass({ isActive }) {
  return `block rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-accent/10 text-accent'
      : 'text-text-secondary hover:text-text-primary'
  }`
}

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={navLinkClass}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function CuentaActiva() {
  const { user } = useAuth()

  if (!user?.email) return null

  return <p className="px-3 pb-2 text-xs text-text-muted truncate">{user.email}</p>
}

function SignOutButton({ onSignedOut, className = '' }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleClick() {
    await signOut()
    onSignedOut?.()
    navigate('/login', { replace: true })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left rounded-lg px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated-2 ${className}`}
    >
      Cerrar sesión
    </button>
  )
}

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <aside className="hidden sm:flex sm:fixed sm:inset-y-0 sm:left-0 sm:w-[220px] sm:flex-col sm:justify-between bg-bg-elevated border-r border-border-subtle py-4">
        <NavItems />
        <div className="px-3">
          <CuentaActiva />
          <SignOutButton />
        </div>
      </aside>

      <header
        className="sm:hidden sticky top-0 z-20 bg-bg-elevated border-b border-border-subtle"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center h-14 px-4">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 text-text-primary"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-30">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside
            className="absolute inset-y-0 left-0 w-[220px] flex flex-col justify-between bg-bg-elevated py-4"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
            }}
          >
            <NavItems onNavigate={() => setDrawerOpen(false)} />
            <div className="px-3">
              <CuentaActiva />
              <SignOutButton onSignedOut={() => setDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <main className="sm:ml-[220px] p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
