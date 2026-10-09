import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <Logo size={32} />
          <span className="font-display text-sm font-semibold tracking-wide text-fg">
            Queer Club
          </span>
        </Link>

        <nav className="hidden items-center gap-3 text-sm sm:flex">
          {user ? (
            <>
              <Link
                to="/directory"
                className="rounded-full px-3 py-1.5 text-muted transition hover:text-fg"
              >
                Directory
              </Link>
              <Link
                to="/profile"
                className="rounded-full px-3 py-1.5 text-muted transition hover:text-fg"
              >
                My profile
              </Link>
              <Link
                to="/messages"
                className="rounded-full px-3 py-1.5 text-muted transition hover:text-fg"
              >
                Messages
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-white/10 px-3 py-1.5 text-muted transition hover:border-white/20 hover:text-fg"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/join?mode=signin"
                className="rounded-full px-3 py-1.5 text-muted transition hover:text-fg"
              >
                Sign in
              </Link>
              <span className="rainbow-frame inline-block rounded-full">
                <Link
                  to="/join"
                  className="block rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-1.5 font-medium text-white shadow-lg shadow-pink-500/20 transition hover:opacity-90"
                >
                  Become a member
                </Link>
              </span>
            </>
          )}
        </nav>

        <div className="flex items-center sm:hidden">
          {user ? (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-fg"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          ) : (
            <Link
              to="/join"
              className="shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition hover:opacity-90"
            >
              Join
            </Link>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 text-sm sm:hidden">
          <Link
            to="/directory"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-muted transition hover:bg-white/5 hover:text-fg"
          >
            Directory
          </Link>
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-muted transition hover:bg-white/5 hover:text-fg"
          >
            My profile
          </Link>
          <Link
            to="/messages"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-muted transition hover:bg-white/5 hover:text-fg"
          >
            Messages
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg px-3 py-2 text-left text-muted transition hover:bg-white/5 hover:text-fg"
          >
            Sign out
          </button>
        </nav>
      )}
    </header>
  )
}
