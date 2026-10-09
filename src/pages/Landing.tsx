import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { DirectoryPreviewSection } from '../components/DirectoryPreviewSection'
import { GlobeHero } from '../components/GlobeHero'

export function Landing() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/directory" replace />

  return (
    <div className="flex flex-col items-center overflow-x-clip">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <GlobeHero />

        <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl">
          Your people are out there.
          <br />
          <span className="gradient-text">Find them.</span>
        </h1>

        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
          A members-only queer community for finding friends, dates, and connections wherever
          life takes you.
        </p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <span className="rainbow-frame block rounded-xl">
            <Link
              to="/join"
              className="glow block rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Find your people →
            </Link>
          </span>
          <Link
            to="/directory"
            className="card rounded-xl px-6 py-3 font-medium text-fg transition hover:border-white/20"
          >
            Explore the club
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted">Free to join · Made for queer connection</p>
      </div>

      <DirectoryPreviewSection />
    </div>
  )
}
