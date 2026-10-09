import { useRef, useState } from 'react'

export function PhotoCarousel({
  photos,
  alt,
  heightClassName,
}: {
  photos: string[]
  alt: string
  heightClassName: string
}) {
  const [activePhoto, setActivePhoto] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToPhoto(index: number) {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (!el.clientWidth) return
    setActivePhoto(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (photos.length === 0) {
    return (
      <img
        src="https://placehold.co/400x400/1e1629/a89ab8?text=No+photo"
        alt={alt}
        className={`w-full object-cover ${heightClassName}`}
      />
    )
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden ${heightClassName}`}
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((url, i) => (
          <img
            key={url + i}
            src={url}
            alt={alt}
            className={`w-full shrink-0 snap-center object-cover ${heightClassName}`}
          />
        ))}
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-1.5 border-t border-white/10 py-3">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPhoto(i)}
              aria-label={`Photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === activePhoto ? 'w-5 bg-pink-400' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
