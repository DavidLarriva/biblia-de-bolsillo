import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err.message ?? 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-voice text-2xl text-text-primary text-center mb-6">
          Iniciar sesión
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-text-secondary">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-text-secondary">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-text rounded px-3 py-2 font-medium disabled:opacity-60"
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="text-sm text-text-secondary text-center mt-4">
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="text-accent hover:underline">
            Creá una
          </Link>
        </p>
      </div>
    </div>
  )
}
