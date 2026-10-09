import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export function DirectoryPreviewSection() {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .not('photo_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setProfiles((data as Profile[]) ?? []))
  }, [])

  if (profiles.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-pink-300">
          The directory
        </p>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          A world of <span className="gradient-text">queer connections.</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Search by city, interests, and more — wherever you land, you're not alone.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {profiles.map((p) => (
          <Link
            key={p.id}
            to={`/members/${p.id}`}
            className="card glow group overflow-hidden rounded-2xl transition hover:border-white/25"
          >
            <div className="aspect-square w-full overflow-hidden">
              <img
                src={p.photo_url ?? ''}
                alt={p.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <div className="flex items-baseline justify-between gap-1">
                <span className="truncate font-semibold">{p.name}</span>
                {p.age && <span className="text-sm text-muted">{p.age}</span>}
              </div>
              {p.city && <p className="truncate text-sm text-muted">{p.city}</p>}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <span className="rainbow-frame block rounded-xl">
          <Link
            to="/join"
            className="glow block rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-3 text-center font-semibold text-white transition hover:opacity-90"
          >
            Become a member →
          </Link>
        </span>
        <Link
          to="/directory"
          className="card block rounded-xl px-6 py-3 text-center font-medium text-fg transition hover:border-white/20"
        >
          Browse the directory
        </Link>
      </div>
    </section>
  )
}
