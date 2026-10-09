import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'

export function Join() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState<'signup' | 'signin'>(
    searchParams.get('mode') === 'signin' ? 'signin' : 'signup'
  )

  useEffect(() => {
    setMode(searchParams.get('mode') === 'signin' ? 'signin' : 'signup')
  }, [searchParams])

  function switchMode(next: 'signup' | 'signin') {
    setMode(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'signin') {
          params.set('mode', 'signin')
        } else {
          params.delete('mode')
        }
        return params
      },
      { replace: true }
    )
  }

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { signUpWithEmail, signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const next = searchParams.get('next') || '/directory'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'signup') {
      const result = await signUpWithEmail(email, password, name)
      setSubmitting(false)

      if (result.error) {
        setError(result.error)
        return
      }
      if (result.needsConfirmation) {
        setInfo('Check your email for a confirmation link, then sign in below.')
        setMode('signin')
        return
      }
      navigate(next)
      return
    }

    const result = await signInWithEmail(email, password)
    setSubmitting(false)

    if (result) {
      setError(result)
      return
    }
    navigate(next)
  }

  async function handleGoogle() {
    setError(null)
    const result = await signInWithGoogle(next)
    if (result) setError(result)
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center px-6 py-16">
      <Logo size={80} />

      <h1 className="mt-6 text-2xl font-extrabold">
        {mode === 'signup' ? 'Join the club' : 'Welcome back'}
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        {mode === 'signup'
          ? 'Members can search and filter the whole directory.'
          : 'Sign in to browse and update your profile.'}
      </p>

      <button
        onClick={handleGoogle}
        className="card mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-fg transition hover:border-white/20"
      >
        Continue with Google
      </button>

      <div className="my-5 flex w-full items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-white/10" />
        OR
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {mode === 'signup' && (
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </Field>
        )}
        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </Field>

        {info && <p className="text-sm text-violet-300">{info}</p>}
        {error && <p className="text-sm text-pink-300">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="glow w-full rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {mode === 'signup' ? (
          <>
            Already a member?{' '}
            <button className="font-semibold text-fg underline" onClick={() => switchMode('signin')}>
              Sign in
            </button>
          </>
        ) : (
          <>
            New here?{' '}
            <button className="font-semibold text-fg underline" onClick={() => switchMode('signup')}>
              Create an account
            </button>
          </>
        )}
      </p>

      <Link to="/" className="mt-4 text-xs text-muted underline">
        Back home
      </Link>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}
