import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatHeight } from '../lib/height'
import { PhotoCarousel } from '../components/PhotoCarousel'
import type { Profile } from '../types'

export function MemberProfile() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile((data as Profile | null) ?? null)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">Loading…</div>
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-muted">This profile isn't available.</p>
        <Link to="/directory" className="mt-4 inline-block text-sm text-pink-300 underline">
          Back to directory
        </Link>
      </div>
    )
  }

  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : profile.photo_url
      ? [profile.photo_url]
      : []
  const location = [profile.neighborhood, profile.city].filter(Boolean).join(', ')
  const isSelf = user?.id === profile.id

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/messages" className="text-sm text-muted underline hover:text-fg">
          Back to messages
        </Link>
        <Link to="/directory" className="text-sm text-muted underline hover:text-fg">
          Directory
        </Link>
      </div>

      <div className="card glow overflow-hidden rounded-2xl">
        <PhotoCarousel photos={photos} alt={profile.name} heightClassName="h-80" />

        {profile.video_url && (
          <div className="border-t border-white/10 p-3">
            <video src={profile.video_url} controls className="w-full rounded-lg bg-black" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <div className="flex shrink-0 items-center gap-2">
              {profile.single === true && (
                <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-300">
                  Single
                </span>
              )}
              {profile.age && <span className="text-muted">{profile.age}</span>}
            </div>
          </div>
          {profile.occupation && <p className="mt-1 text-violet-300">{profile.occupation}</p>}
          {location && <p className="text-muted">{location}</p>}
          <p className="mt-2 text-sm text-muted">
            {[formatHeight(profile.height_in), profile.languages].filter(Boolean).join(' · ')}
            {profile.social_handle && (
              <>
                {(profile.height_in || profile.languages) && ' · '}
                {profile.social_handle}
              </>
            )}
          </p>
          {profile.about && <p className="mt-4 text-fg/90">{profile.about}</p>}

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs text-fg"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {!isSelf && (
            <button
              onClick={() => {
                const target = `/messages?to=${profile.id}`
                navigate(user ? target : `/join?next=${encodeURIComponent(target)}`)
              }}
              className="glow mt-6 w-full rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2.5 font-semibold text-white transition hover:opacity-90"
            >
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
