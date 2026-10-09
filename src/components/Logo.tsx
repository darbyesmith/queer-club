const MERIDIAN_COUNT = 3
const SPIN_DURATION = 8

// Stylized (not geographically precise) world map, sized to sit on a
// sphere of radius 48 centered at (50, 50).
const CONTINENTS = [
  // North America: broad Alaska/Canada shoulder, narrowing through the US
  // into a thin Central American isthmus.
  'M 21,16 C 27,12 35,13 38,17 C 43,15 47,18 45,23 C 49,25 48,31 43,32 C 45,35 42,39 38,37 C 39,42 35,44 33,40 C 33,44 29,46 28,41 C 26,44 22,42 23,38 C 19,38 18,33 21,31 C 17,29 17,23 21,21 C 18,20 18,17 21,16 Z',
  // South America: wide Colombia/Brazil shoulder tapering to a narrow
  // point at Patagonia.
  'M 35,45 C 40,43 46,45 47,50 C 49,54 48,58 46,60 C 48,64 46,68 44,70 C 45,74 42,79 39,81 C 37,83 35,80 36,76 C 34,72 33,67 35,63 C 32,60 32,55 34,52 C 31,49 32,46 35,45 Z',
  // Europe: small and compact, tucked above Africa.
  'M 50,20 C 53,18 57,19 58,22 C 60,24 58,27 55,27 C 57,29 54,31 52,29 C 50,31 47,29 48,26 C 46,25 47,21 50,20 Z',
  // Africa: a wide shoulder narrowing down, below Europe.
  'M 50,28 C 55,26 62,28 63,34 C 65,38 63,42 61,44 C 62,48 59,52 56,50 C 54,54 50,52 51,47 C 48,44 48,39 50,36 C 47,33 48,30 50,28 Z',
  // Asia: the largest landmass, spanning the right side.
  'M 64,18 C 70,14 80,15 84,20 C 88,24 86,30 82,32 C 84,36 80,40 76,38 C 74,42 68,42 66,38 C 62,38 60,32 63,28 C 60,25 61,20 64,18 Z',
  // Australia: small, isolated, lower-right.
  'M 74,58 C 78,56 84,57 85,61 C 87,64 84,67 80,67 C 82,69 78,70 76,68 C 73,69 71,65 73,62 C 71,60 72,58 74,58 Z',
]

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-6 -6 112 112"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      style={{ filter: 'drop-shadow(0 6px 16px rgba(8, 25, 32, 0.55))' }}
    >
      <defs>
        {/* Smoother, richer falloff than a 5-stop gradient gives a rounder,
           less "flat design" read. */}
        <radialGradient id="sphereBase" cx="30%" cy="24%" r="90%">
          <stop offset="0%" stopColor="#e4fbff" />
          <stop offset="12%" stopColor="#a9edf5" />
          <stop offset="26%" stopColor="#6fd0e2" />
          <stop offset="42%" stopColor="#3fa9c0" />
          <stop offset="58%" stopColor="#237e97" />
          <stop offset="74%" stopColor="#145771" />
          <stop offset="88%" stopColor="#0a3547" />
          <stop offset="100%" stopColor="#051f2b" />
        </radialGradient>
        {/* Ambient occlusion: darkens toward the silhouette edge, the way
           light actually falls off on a sphere, instead of a drawn outline. */}
        <radialGradient id="sphereAO" cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="#000000" stopOpacity="0" />
          <stop offset="88%" stopColor="#01131c" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#01131c" stopOpacity="0.75" />
        </radialGradient>
        <linearGradient id="continentGradient" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#a9f0c1" />
          <stop offset="45%" stopColor="#4cc178" />
          <stop offset="100%" stopColor="#1c7a45" />
        </linearGradient>
        {/* Tight bright hotspot plus a wider soft glow reads as a real
           specular reflection rather than a single blurry blob. */}
        <radialGradient id="specularCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="specularGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="tightBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id="shadowBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {/* Film-grain texture, blended with "overlay" so it darkens and
           lightens the surface beneath it like real grain rather than
           sitting on top as a flat haze. */}
        <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0"
          />
        </filter>
        <clipPath id="globeClip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#sphereBase)" />

      {/* Continents sitting on the ocean sphere. */}
      <g clipPath="url(#globeClip)">
        {CONTINENTS.map((d, i) => (
          <path key={i} d={d} fill="url(#continentGradient)" />
        ))}
      </g>

      {/* Subtle surface variation so the material doesn't read as a
         perfectly uniform gradient. */}
      <g clipPath="url(#globeClip)">
        <ellipse
          cx="64"
          cy="62"
          rx="15"
          ry="10"
          fill="#04202c"
          opacity="0.25"
          filter="url(#shadowBlur)"
          style={{ mixBlendMode: 'multiply' }}
        />
        <ellipse
          cx="42"
          cy="78"
          rx="11"
          ry="7"
          fill="#bdf3ff"
          opacity="0.15"
          filter="url(#shadowBlur)"
          style={{ mixBlendMode: 'screen' }}
        />
      </g>

      <g clipPath="url(#globeClip)">
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          filter="url(#grain)"
          opacity="0.22"
          style={{ mixBlendMode: 'overlay' }}
        />
      </g>

      {/* A clean, sparse grid: one equator, one latitude line each side,
         and meridians that pulse from a thin center line out to the
         sphere's edge and back, simulating longitude sweeping around as
         the globe spins. */}
      <g clipPath="url(#globeClip)">
        <ellipse cx="50" cy="50" rx="48" ry="2.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        <ellipse cx="50" cy="28" rx="38" ry="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />
        <ellipse cx="50" cy="72" rx="38" ry="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.7" />

        {Array.from({ length: MERIDIAN_COUNT }).map((_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="50"
            rx="48"
            ry="48"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.7"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: `globe-meridian ${SPIN_DURATION}s ease-in-out infinite`,
              animationDelay: `${(i * SPIN_DURATION) / MERIDIAN_COUNT}s`,
            }}
          />
        ))}
      </g>

      {/* Ambient occlusion ring, replacing a drawn outline. */}
      <circle cx="50" cy="50" r="48" fill="url(#sphereAO)" style={{ mixBlendMode: 'multiply' }} />

      <ellipse
        cx="34"
        cy="26"
        rx="20"
        ry="13"
        fill="url(#specularGlow)"
        filter="url(#softBlur)"
        opacity="0.6"
        transform="rotate(-18 34 26)"
      />
      <ellipse
        cx="31"
        cy="22"
        rx="6"
        ry="3.5"
        fill="url(#specularCore)"
        filter="url(#tightBlur)"
        opacity="0.9"
        transform="rotate(-18 31 22)"
      />

      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />

      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
        fontWeight="800"
        fontSize="30"
        fill="#ffffff"
        style={{
          letterSpacing: '-0.5px',
          filter:
            'drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 3px rgba(5, 20, 25, 0.65))',
        }}
      >
        QC
      </text>
    </svg>
  )
}
