import { useId } from 'react'

// Monograma de Samuel Martínez: "sm" en cursiva con una ola, a juego con el mar del fondo.
function Logo({ tamano = 34 }) {
  const id = useId()

  return (
    <svg className="logo" viewBox="0 0 40 40" width={tamano} height={tamano} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-fondo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fb6d3" />
          <stop offset="0.5" stopColor="#415a77" />
          <stop offset="1" stopColor="#0d1b2a" />
        </linearGradient>
        <linearGradient id={`${id}-brillo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="12" fill={`url(#${id}-fondo)`} />
      <rect x="1" y="1" width="38" height="38" rx="12" fill={`url(#${id}-brillo)`} />
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="11.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
      />
      <text
        x="19.5"
        y="24"
        textAnchor="middle"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontStyle="italic"
        fontSize="20"
        fill="#fff"
      >
        sm
      </text>
      <path
        d="M9.5 30.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 2.5 1.4 3.5 1"
        fill="none"
        stroke="#7fd1a8"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default Logo
