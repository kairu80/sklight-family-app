import React, { useState, useEffect } from 'react'

export default function NeonBorder() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pad = 4
  const rw = size.w - pad * 2
  const rh = size.h - pad * 2
  const P = 2 * (rw + rh)
  const dash = Math.round(P * 0.06)
  const gap = P - dash
  const whiteDash = Math.round(dash * 0.28)
  const whiteGap = P - whiteDash

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 200,
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="nb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="nb-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Static dim border always visible */}
      <rect
        x={pad} y={pad} width={rw} height={rh}
        fill="none"
        stroke="rgba(139,92,246,0.2)"
        strokeWidth="1"
        rx="2"
      />

      {/* Wide color-cycling glow layer */}
      <rect
        x={pad} y={pad} width={rw} height={rh}
        fill="none"
        strokeWidth="12"
        opacity="0.5"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        rx="2"
        filter="url(#nb-glow-soft)"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to={-P}
          dur="6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke"
          values="#8b5cf6;#22d3ee;#f472b6;#fbbf24;#8b5cf6"
          dur="12s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Tighter glow layer for definition */}
      <rect
        x={pad} y={pad} width={rw} height={rh}
        fill="none"
        strokeWidth="5"
        opacity="0.85"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        rx="2"
        filter="url(#nb-glow)"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to={-P}
          dur="6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke"
          values="#8b5cf6;#22d3ee;#f472b6;#fbbf24;#8b5cf6"
          dur="12s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Bright white core highlight */}
      <rect
        x={pad} y={pad} width={rw} height={rh}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.5"
        strokeDasharray={`${whiteDash} ${whiteGap}`}
        strokeLinecap="round"
        rx="2"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to={-P}
          dur="6s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  )
}
