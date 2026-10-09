import { useMemo, useState } from 'react'

const MAX_SUGGESTIONS = 8

export function TagSelect({
  value,
  onChange,
  suggestions,
  placeholder = 'Search or add…',
  allowCreate = true,
}: {
  value: string[]
  onChange: (next: string[]) => void
  suggestions: string[]
  placeholder?: string
  allowCreate?: boolean
}) {
  const [query, setQuery] = useState('')

  const selectedLower = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = Array.from(new Set(suggestions)).filter((s) => !selectedLower.has(s.toLowerCase()))
    return q ? pool.filter((s) => s.toLowerCase().includes(q)) : pool
  }, [query, suggestions, selectedLower])

  const shown = matches.slice(0, MAX_SUGGESTIONS)
  const hiddenCount = matches.length - shown.length

  const trimmedQuery = query.trim()
  const canCreate =
    allowCreate &&
    trimmedQuery.length > 0 &&
    !selectedLower.has(trimmedQuery.toLowerCase()) &&
    !matches.some((s) => s.toLowerCase() === trimmedQuery.toLowerCase())

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || selectedLower.has(trimmed.toLowerCase())) return
    onChange([...value, trimmed])
    setQuery('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((v) => v !== tag))
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-fg"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-muted hover:text-fg"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (shown[0] && shown[0].toLowerCase() === trimmedQuery.toLowerCase()) {
            addTag(shown[0])
          } else if (canCreate) {
            addTag(trimmedQuery)
          }
        }}
      />

      {(shown.length > 0 || canCreate) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {shown.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-muted transition hover:border-white/20 hover:text-fg"
            >
              {s}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onClick={() => addTag(trimmedQuery)}
              className="rounded-full border border-pink-400/40 px-3 py-1.5 text-sm text-pink-300"
            >
              + Add "{trimmedQuery}"
            </button>
          )}
        </div>
      )}
      {hiddenCount > 0 && (
        <p className="mt-2 text-xs text-muted">Type to search {hiddenCount} more</p>
      )}
    </div>
  )
}
