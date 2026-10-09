import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from './Logo'

interface CityCount {
  city: string
  count: number
}

// The dot field is a band across the full page width, centered on the globe.
const LAYER_TOP = -70
const LAYER_HEIGHT = 300
const GLOBE_CENTER_Y = 100 - LAYER_TOP
const CLEAR_RADIUS = 92
const EDGE = 16

function halton(index: number, base: number) {
  let f = 1
  let r = 0
  for (let i = index; i > 0; i = Math.floor(i / base)) {
    f /= base
    r += f * (i % base)
  }
  return r
}

// Evenly scattered points across the band (Halton sequence), skipping the area
// around the globe. Point i belongs to the i-th ranked city.
function scatter(count: number, width: number) {
  const points: { x: number; y: number }[] = []
  for (let k = 1; points.length < count && k < count * 60 + 200; k++) {
    const x = EDGE + halton(k, 2) * (width - 2 * EDGE)
    const y = EDGE + halton(k, 3) * (LAYER_HEIGHT - 2 * EDGE)
    if (Math.hypot(x - width / 2, y - GLOBE_CENTER_Y) < CLEAR_RADIUS) continue
    points.push({ x, y })
  }
  return points
}

// Dots grow with member count, plus a small per-city offset so cities with the
// same count still read as different sizes.
function dotSize(city: string, count: number) {
  let hash = 0
  for (const ch of city) hash = (hash * 31 + ch.charCodeAt(0)) % 1000
  return 8 + Math.min(count - 1, 6) * 2 + (hash % 5) * 1.5
}

export function GlobeHero() {
  const [cities, setCities] = useState<CityCount[]>([])
  const [activeCity, setActiveCity] = useState<string | null>(null)
  const [width, setWidth] = useState(() => document.documentElement.clientWidth)

  useEffect(() => {
    const onResize = () => setWidth(document.documentElement.clientWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('city')
      .not('city', 'is', null)
      .then(({ data }) => {
        const counts = new Map<string, number>()
        for (const row of (data as { city: string }[]) ?? []) {
          counts.set(row.city, (counts.get(row.city) ?? 0) + 1)
        }
        const sorted = Array.from(counts, ([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
        setCities(sorted)
      })
  }, [])

  const points = useMemo(() => scatter(cities.length, width), [cities.length, width])

  return (
    <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
      {/* Soft ambient glow behind the globe. */}
      <div
        className="pointer-events-none absolute -inset-10 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,95,158,0.45), rgba(139,92,246,0.35) 55%, transparent 75%)',
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <Logo size={128} />
      </div>

      <div
        className="pointer-events-none absolute z-10"
        style={{ left: '50%', marginLeft: -width / 2, width, top: LAYER_TOP, height: LAYER_HEIGHT }}
      >
        {cities.map((c, i) => {
          const point = points[i]
          if (!point) return null
          const isActive = activeCity === c.city
          const size = dotSize(c.city, c.count)
          const labelAlign =
            point.x < 90 ? 'left-0' : point.x > width - 90 ? 'right-0' : 'left-1/2 -translate-x-1/2'
          return (
            <div
              key={c.city}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: point.x, top: point.y }}
            >
              <button
                type="button"
                onClick={() => setActiveCity((cur) => (cur === c.city ? null : c.city))}
                className="relative flex items-center justify-center"
                style={{ width: size + 12, height: size + 12 }}
                aria-label={`${c.city} · ${c.count} ${c.count === 1 ? 'member' : 'members'}`}
              >
                <span
                  className="absolute animate-ping rounded-full bg-pink-400 opacity-75"
                  style={{ width: size, height: size }}
                />
                <span
                  className="relative rounded-full bg-pink-400 shadow-[0_0_8px_2px_rgba(255,95,158,0.8)]"
                  style={{ width: size, height: size }}
                />
              </button>

              {isActive && (
                <Link
                  to={`/directory?city=${encodeURIComponent(c.city)}`}
                  className={`absolute top-full z-20 mt-1 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-fg shadow-lg ring-1 ring-white/10 transition hover:bg-white/5 ${labelAlign}`}
                >
                  {c.city} · {c.count} {c.count === 1 ? 'member' : 'members'}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
