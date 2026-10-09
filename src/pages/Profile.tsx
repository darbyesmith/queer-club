import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { HEIGHT_OPTIONS } from '../lib/height'
import { TagSelect } from '../components/TagSelect'
import type { Profile } from '../types'

const INTERESTED_IN_OPTIONS = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'nonbinary', label: 'Nonbinary people' },
  { value: 'everyone', label: 'Everyone' },
]

const IDENTITY_OPTIONS = [
  { value: 'women', label: 'A woman' },
  { value: 'men', label: 'A man' },
  { value: 'nonbinary', label: 'Nonbinary' },
]

const MAX_PHOTOS = 5

const SEED_INTERESTS = [
  'Hiking', 'Live music', 'Cooking', 'Yoga', 'Board games', 'Travel', 'Photography',
  'Reading', 'Dancing', 'Wine tasting', 'Rock climbing', 'Running', 'Art', 'Film',
  'Gaming', 'Volunteering', 'Coffee', 'Brunch', 'Cycling', 'Karaoke',
]

const emptyDraft = {
  name: '',
  age: '',
  height_in: '',
  single: '',
  identity: '',
  country: '',
  city: '',
  neighborhood: '',
  occupation: '',
  languages: '',
  social_handle: '',
  about: '',
}

export function ProfilePage() {
  const { user } = useAuth()
  const [draft, setDraft] = useState(emptyDraft)
  const [interestedIn, setInterestedIn] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>(SEED_INTERESTS)
  const [photos, setPhotos] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const profile = data as Profile | null
        if (profile) {
          setDraft({
            name: profile.name ?? '',
            age: profile.age?.toString() ?? '',
            height_in: profile.height_in?.toString() ?? '',
            single: profile.single == null ? '' : profile.single ? 'yes' : 'no',
            identity: profile.identity ?? '',
            country: profile.country ?? '',
            city: profile.city ?? '',
            neighborhood: profile.neighborhood ?? '',
            occupation: profile.occupation ?? '',
            languages: profile.languages ?? '',
            social_handle: profile.social_handle ?? '',
            about: profile.about ?? '',
          })
          setInterestedIn(profile.interested_in ?? [])
          setInterests(profile.interests ?? [])
          const existingPhotos =
            profile.photos && profile.photos.length > 0
              ? profile.photos
              : profile.photo_url
                ? [profile.photo_url]
                : []
          setPhotos(existingPhotos)
          setVideoUrl(profile.video_url ?? '')
        }
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('interests')
      .not('interests', 'is', null)
      .then(({ data }) => {
        const fromMembers = ((data as { interests: string[] | null }[]) ?? []).flatMap(
          (row) => row.interests ?? []
        )
        const merged = new Map<string, string>()
        for (const tag of [...SEED_INTERESTS, ...fromMembers]) {
          if (!merged.has(tag.toLowerCase())) merged.set(tag.toLowerCase(), tag)
        }
        setInterestSuggestions(Array.from(merged.values()))
      })
  }, [])

  function set<K extends keyof typeof emptyDraft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleInterestedIn(value: string) {
    setInterestedIn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  async function handleAddPhoto(file: File) {
    if (!user || photos.length >= MAX_PHOTOS) return
    setUploadingPhoto(true)
    setMessage(null)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/photo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
    })

    if (uploadError) {
      setMessage(uploadError.message)
      setUploadingPhoto(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setPhotos((prev) => [...prev, data.publicUrl])
    setUploadingPhoto(false)
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleAddVideo(file: File) {
    if (!user) return
    setUploadingVideo(true)
    setMessage(null)

    const ext = file.name.split('.').pop()
    const path = `${user.id}/video-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
    })

    if (uploadError) {
      setMessage(uploadError.message)
      setUploadingVideo(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setVideoUrl(data.publicUrl)
    setUploadingVideo(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: draft.name,
      age: draft.age ? Number(draft.age) : null,
      height_in: draft.height_in ? Number(draft.height_in) : null,
      single: draft.single === '' ? null : draft.single === 'yes',
      identity: draft.identity || null,
      interested_in: interestedIn.length ? interestedIn : null,
      country: draft.country || null,
      city: draft.city || null,
      neighborhood: draft.neighborhood || null,
      occupation: draft.occupation || null,
      languages: draft.languages || null,
      social_handle: draft.social_handle || null,
      about: draft.about || null,
      interests: interests.length ? interests : null,
      photo_url: photos[0] || null,
      photos: photos.length ? photos : null,
      video_url: videoUrl || null,
    })

    setSaving(false)
    setMessage(error ? error.message : 'Profile saved.')
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">Loading…</div>
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My profile</h1>
        <Link to="/directory" className="text-sm text-muted underline hover:text-fg">
          Directory
        </Link>
      </div>

      <form onSubmit={handleSave} className="card glow rounded-2xl p-6">
        <span className="mb-2 block text-xs font-medium text-muted">Photos</span>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((url, i) => (
            <div
              key={url + i}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Main
                </span>
              )}
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 px-1 text-center text-xs text-muted transition hover:border-white/30 hover:text-fg">
              {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => e.target.files?.[0] && handleAddPhoto(e.target.files[0])}
              />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          {photos.length}/{MAX_PHOTOS} photos · the first is your main photo
        </p>

        <div className="mt-5">
          <span className="mb-1 block text-xs font-medium text-muted">Video (optional)</span>
          {videoUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10">
              <video src={videoUrl} controls className="max-h-64 w-full bg-black" />
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="card flex h-20 cursor-pointer items-center justify-center rounded-xl text-sm text-muted transition hover:border-white/20">
              {uploadingVideo ? 'Uploading…' : '+ Add a video'}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                disabled={uploadingVideo}
                onChange={(e) => e.target.files?.[0] && handleAddVideo(e.target.files[0])}
              />
            </label>
          )}
        </div>

        <div className="mt-5">
          <Field label="Name">
            <input
              required
              className="input"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Age">
            <input
              type="number"
              min={18}
              className="input"
              value={draft.age}
              onChange={(e) => set('age', e.target.value)}
            />
          </Field>
          <Field label="Height">
            <select
              className="input"
              value={draft.height_in}
              onChange={(e) => set('height_in', e.target.value)}
            >
              <option value="">Select height</option>
              {HEIGHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Single">
            <select
              className="input"
              value={draft.single}
              onChange={(e) => set('single', e.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="I am">
            <select
              className="input"
              value={draft.identity}
              onChange={(e) => set('identity', e.target.value)}
            >
              <option value="">Prefer not to say</option>
              {IDENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Interested in">
            <div className="flex flex-wrap gap-2">
              {INTERESTED_IN_OPTIONS.map((o) => {
                const selected = interestedIn.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleInterestedIn(o.value)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? 'border-transparent bg-gradient-to-r from-pink-500 to-violet-500 text-white'
                        : 'border-white/10 text-muted hover:border-white/20'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Country">
            <input
              className="input"
              value={draft.country}
              onChange={(e) => set('country', e.target.value)}
            />
          </Field>
          <Field label="City">
            <input
              className="input"
              value={draft.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Neighborhood">
            <input
              className="input"
              value={draft.neighborhood}
              onChange={(e) => set('neighborhood', e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Occupation">
            <input
              className="input"
              value={draft.occupation}
              onChange={(e) => set('occupation', e.target.value)}
            />
          </Field>
          <Field label="Languages">
            <input
              className="input"
              value={draft.languages}
              onChange={(e) => set('languages', e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Social handle (Instagram, LinkedIn, etc.)">
            <input
              className="input"
              placeholder="@you"
              value={draft.social_handle}
              onChange={(e) => set('social_handle', e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-left text-xs font-medium text-muted">Interests</span>
          <TagSelect
            value={interests}
            onChange={setInterests}
            suggestions={interestSuggestions}
            placeholder="Search or add an interest…"
          />
        </div>

        <div className="mt-4">
          <Field label="About you">
            <textarea
              className="input min-h-24"
              value={draft.about}
              onChange={(e) => set('about', e.target.value)}
            />
          </Field>
        </div>

        {message && <p className="mt-4 text-sm text-pink-300">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="glow mt-6 w-full rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
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
