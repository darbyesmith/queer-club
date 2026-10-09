import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Message, Profile } from '../types'

export function Messages() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const toParam = searchParams.get('to')

  const [messages, setMessages] = useState<Message[]>([])
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [myCity, setMyCity] = useState<string | null>(null)
  const [sortByCity, setSortByCity] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(toParam)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  useEffect(() => {
    if (toParam) setSelectedId(toParam)
  }, [toParam])

  async function load() {
    if (!user) return
    setLoading(true)

    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    const msgs = (msgData as Message[]) ?? []
    setMessages(msgs)

    const partnerIds = new Set(
      msgs.map((m) => (m.sender_id === user.id ? m.recipient_id : m.sender_id))
    )
    if (toParam) partnerIds.add(toParam)

    if (partnerIds.size > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(partnerIds))

      const map: Record<string, Profile> = {}
      for (const p of (profileData as Profile[]) ?? []) map[p.id] = p
      setProfilesById(map)
    }

    const { data: favData } = await supabase
      .from('favorites')
      .select('favorite_id')
      .eq('user_id', user.id)
    setFavorites(new Set(((favData as { favorite_id: string }[]) ?? []).map((f) => f.favorite_id)))

    const { data: ownProfile } = await supabase
      .from('profiles')
      .select('city')
      .eq('id', user.id)
      .maybeSingle()
    setMyCity((ownProfile as { city: string | null } | null)?.city ?? null)

    setLoading(false)
  }

  async function toggleFavorite(partnerId: string) {
    if (!user) return
    const isFavorite = favorites.has(partnerId)

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('favorite_id', partnerId)
      setFavorites((prev) => {
        const next = new Set(prev)
        next.delete(partnerId)
        return next
      })
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, favorite_id: partnerId })
      setFavorites((prev) => new Set(prev).add(partnerId))
    }
  }

  const conversations = useMemo(() => {
    if (!user) return []
    const byPartner = new Map<string, Message[]>()

    for (const m of messages) {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id
      if (!byPartner.has(partnerId)) byPartner.set(partnerId, [])
      byPartner.get(partnerId)!.push(m)
    }

    if (toParam && !byPartner.has(toParam)) byPartner.set(toParam, [])

    return Array.from(byPartner.entries())
      .map(([partnerId, msgs]) => ({
        partnerId,
        messages: msgs,
        lastMessage: msgs[msgs.length - 1] ?? null,
        unread: msgs.some((m) => m.recipient_id === user.id && !m.read_at),
      }))
      .sort((a, b) => {
        const aFav = favorites.has(a.partnerId) ? 1 : 0
        const bFav = favorites.has(b.partnerId) ? 1 : 0
        if (aFav !== bFav) return bFav - aFav

        if (sortByCity && myCity) {
          const aCity = profilesById[a.partnerId]?.city === myCity ? 1 : 0
          const bCity = profilesById[b.partnerId]?.city === myCity ? 1 : 0
          if (aCity !== bCity) return bCity - aCity
        }

        const at = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : Infinity
        const bt = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : Infinity
        return bt - at
      })
  }, [messages, user, toParam, favorites, sortByCity, myCity, profilesById])

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].partnerId)
    }
  }, [conversations, selectedId])

  useEffect(() => {
    if (!user || !selectedId) return
    const unread = messages.filter(
      (m) => m.sender_id === selectedId && m.recipient_id === user.id && !m.read_at
    )
    if (unread.length === 0) return

    const ids = unread.map((m) => m.id)
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids)
      .then(() => {
        setMessages((prev) =>
          prev.map((m) => (ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m))
        )
      })
  }, [selectedId, user, messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !selectedId || !reply.trim()) return
    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, recipient_id: selectedId, body: reply.trim() })
      .select()
      .single()

    setSending(false)
    if (error) return

    setMessages((prev) => [...prev, data as Message])
    setReply('')
  }

  function selectConversation(partnerId: string) {
    setSelectedId(partnerId)
    setSearchParams(partnerId === toParam ? { to: partnerId } : {})
  }

  const selectedProfile = selectedId ? profilesById[selectedId] : null
  const selectedMessages = selectedId
    ? conversations.find((c) => c.partnerId === selectedId)?.messages ?? []
    : []

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">Loading…</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>

      {conversations.length === 0 ? (
        <p className="text-center text-muted">
          No messages yet. Message someone from the directory to start a conversation.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-end gap-2">
            <span className="text-sm text-muted">
              Prioritize my city{myCity ? ` (${myCity})` : ''}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={sortByCity}
              disabled={!myCity}
              onClick={() => setSortByCity((v) => !v)}
              title={myCity ? undefined : 'Set your city on your profile to use this'}
              className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                sortByCity ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  sortByCity ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="card glow grid grid-cols-1 overflow-hidden rounded-2xl sm:grid-cols-[220px_1fr]">
          <div className="max-h-[70vh] overflow-y-auto border-b border-white/10 sm:border-b-0 sm:border-r">
            {conversations.map((c) => {
              const profile = profilesById[c.partnerId]
              const isFavorite = favorites.has(c.partnerId)
              return (
                <div
                  key={c.partnerId}
                  className={`flex items-center gap-2 border-b border-white/5 pl-4 pr-2 py-3 transition hover:bg-white/5 ${
                    selectedId === c.partnerId ? 'bg-white/5' : ''
                  }`}
                >
                  <button
                    onClick={() => selectConversation(c.partnerId)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img
                      src={
                        profile?.photo_url || 'https://placehold.co/80x80/1e1629/a89ab8?text=%3F'
                      }
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {profile?.name ?? 'Member'}
                        </span>
                        {c.unread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-pink-400" />
                        )}
                      </div>
                      {profile?.city && (
                        <p className="truncate text-xs text-muted">{profile.city}</p>
                      )}
                      <p className="truncate text-xs text-muted">
                        {c.lastMessage?.body ?? 'Say hello…'}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleFavorite(c.partnerId)}
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className={`shrink-0 rounded-full p-1.5 text-lg leading-none transition hover:scale-110 ${
                      isFavorite ? 'text-pink-400' : 'text-muted'
                    }`}
                  >
                    {isFavorite ? '♥' : '♡'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex max-h-[70vh] flex-col">
            {selectedId ? (
              <>
                <Link
                  to={`/members/${selectedId}`}
                  className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-3 transition hover:bg-white/5"
                >
                  <div>
                    <div className="font-medium">{selectedProfile?.name ?? 'Member'}</div>
                    {selectedProfile?.city && (
                      <div className="text-xs text-muted">{selectedProfile.city}</div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-pink-300">View profile</span>
                </Link>

                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {selectedMessages.length === 0 && (
                    <p className="text-sm text-muted">
                      No messages yet. Say hi to {selectedProfile?.name ?? 'them'}.
                    </p>
                  )}
                  {selectedMessages.map((m) => {
                    const mine = m.sender_id === user?.id
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                            mine
                              ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white'
                              : 'card'
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 border-t border-white/10 p-3"
                >
                  <input
                    className="input"
                    placeholder="Write a message…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="shrink-0 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted">
                Select a conversation
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  )
}
