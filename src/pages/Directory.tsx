import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatHeight, HEIGHT_OPTIONS } from '../lib/height'
import { PhotoCarousel } from '../components/PhotoCarousel'
import { TagSelect } from '../components/TagSelect'
import type { Profile } from '../types'

export function Directory() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [messagedIds, setMessagedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [city, setCity] = useState(searchParams.get('city') || 'all')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [heightMin, setHeightMin] = useState('')
  const [heightMax, setHeightMax] = useState('')
  const [single, setSingle] = useState('all')
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProfiles((data as Profile[]) ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!user) {
      setMessagedIds(new Set())
      return
    }
    supabase
      .from('messages')
      .select('sender_id,recipient_id')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .then(({ data }) => {
        const ids = new Set(
          ((data as { sender_id: string; recipient_id: string }[]) ?? []).map((m) =>
            m.sender_id === user.id ? m.recipient_id : m.sender_id
          )
        )
        setMessagedIds(ids)
      })
  }, [user])

  const countries = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.country).filter(Boolean))) as string[],
    [profiles]
  )
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          profiles
            .filter((p) => country === 'all' || p.country === country)
            .map((p) => p.city)
            .filter(Boolean)
        )
      ) as string[],
    [profiles, country]
  )
  const interestOptions = useMemo(
    () => Array.from(new Set(profiles.flatMap((p) => p.interests ?? []))).sort(),
    [profiles]
  )

  const filtered = profiles
    .filter((p) => {
      if (country !== 'all' && p.country !== country) return false
      if (city !== 'all' && p.city !== city) return false
      if (ageMin && (p.age ?? 0) < Number(ageMin)) return false
      if (ageMax && (p.age ?? Infinity) > Number(ageMax)) return false
      if (heightMin && (p.height_in ?? 0) < Number(heightMin)) return false
      if (heightMax && (p.height_in ?? Infinity) > Number(heightMax)) return false
      if (single === 'yes' && p.single !== true) return false
      if (single === 'no' && p.single !== false) return false
      if (interests.length > 0 && !interests.some((i) => (p.interests ?? []).includes(i))) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const haystack = [p.name, p.occupation, p.neighborhood, p.languages, p.about]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })
    .sort((a, b) => {
      const aMessaged = messagedIds.has(a.id) ? 1 : 0
      const bMessaged = messagedIds.has(b.id) ? 1 : 0
      return aMessaged - bMessaged
    })

  function clearFilters() {
    setSearch('')
    setCountry('all')
    setCity('all')
    setAgeMin('')
    setAgeMax('')
    setHeightMin('')
    setHeightMax('')
    setSingle('all')
    setInterests([])
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Member directory</h1>
        <p className="text-sm text-muted">
          {loading ? 'Loading…' : `${filtered.length} of ${profiles.length} members`}
        </p>
      </div>

      <div className="card mb-8 grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">
          <input
            className="input"
            placeholder="Name, occupation, neighborhood, language…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>

        <Field label="Country">
          <select
            className="input"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              setCity('all')
            }}
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="City">
          <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Age range</span>
          <div className="flex gap-2">
            <input
              type="number"
              className="input"
              placeholder="Min"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
            />
            <input
              type="number"
              className="input"
              placeholder="Max"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
            />
          </div>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Height</span>
          <div className="flex gap-2">
            <select
              className="input"
              value={heightMin}
              onChange={(e) => setHeightMin(e.target.value)}
            >
              <option value="">Min</option>
              {HEIGHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={heightMax}
              onChange={(e) => setHeightMax(e.target.value)}
            >
              <option value="">Max</option>
              {HEIGHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Field label="Single">
          <select className="input" value={single} onChange={(e) => setSingle(e.target.value)}>
            <option value="all">Anyone</option>
            <option value="yes">Single</option>
            <option value="no">Not single</option>
          </select>
        </Field>

        <div className="sm:col-span-2 lg:col-span-4">
          <span className="mb-1 block text-left text-xs font-medium text-muted">Interests</span>
          <TagSelect
            value={interests}
            onChange={setInterests}
            suggestions={interestOptions}
            placeholder="Search interests…"
            allowCreate={false}
          />
        </div>

        <button
          onClick={clearFilters}
          className="self-end text-sm text-muted underline hover:text-fg"
        >
          Clear filters
        </button>
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-center text-muted">No members match those filters yet.</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <MemberCard key={p.id} profile={p} hasThread={messagedIds.has(p.id)} />
        ))}
      </div>
    </div>
  )
}

function MemberCard({ profile, hasThread }: { profile: Profile; hasThread: boolean }) {
  const location = [profile.neighborhood, profile.city].filter(Boolean).join(', ')
  const { user } = useAuth()
  const navigate = useNavigate()
  const isSelf = user?.id === profile.id
  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : profile.photo_url
      ? [profile.photo_url]
      : []

  return (
    <div
      className={`card glow overflow-hidden rounded-2xl transition ${hasThread ? 'opacity-60' : ''}`}
    >
      <PhotoCarousel photos={photos} alt={profile.name} heightClassName="h-56" />
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{profile.name}</h3>
          <div className="flex shrink-0 items-center gap-2">
            {profile.single === true && (
              <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-300">
                Single
              </span>
            )}
            {profile.age && <span className="text-sm text-muted">{profile.age}</span>}
          </div>
        </div>
        {profile.occupation && <p className="text-sm text-violet-300">{profile.occupation}</p>}
        {location && <p className="text-sm text-muted">{location}</p>}
        <p className="mt-1 text-xs text-muted">
          {[formatHeight(profile.height_in), profile.languages].filter(Boolean).join(' · ')}
          {profile.social_handle && (
            <>
              {(profile.height_in || profile.languages) && ' · '}
              {profile.social_handle}
            </>
          )}
        </p>
        {profile.about && <p className="mt-2 text-sm text-fg/90">{profile.about}</p>}

        {!isSelf && !hasThread && (
          <button
            onClick={() => {
              const target = `/messages?to=${profile.id}`
              navigate(user ? target : `/join?next=${encodeURIComponent(target)}`)
            }}
            className="mt-4 w-full rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Message
          </button>
        )}
      </div>
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
