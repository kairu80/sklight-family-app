import React, { useMemo } from 'react'

function lcg(seed) {
  let s = seed | 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 4294967296
  }
}

const GLOW_COLORS = [
  '#c4b5fd',  // purple
  '#22d3ee',  // cyan
  '#fbbf24',  // gold
  '#f472b6',  // pink
  '#86efac',  // green
  '#818cf8',  // indigo
]

// 4 gentle drift directions — stars travel slowly across the field
const DRIFT = ['space-a', 'space-b', 'space-c', 'space-d']

export default function Stars() {
  const { tiny, small, medium, large, glowing } = useMemo(() => {
    const rng = lcg(42317)

    // Tiny background stars — barely visible, very slow
    const tiny = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: rng() * 110 - 5,
      y: rng() * 110 - 5,
      size: rng() * 0.8 + 0.3,
      delay: -(rng() * 50),        // negative delay = pre-started
      dur: rng() * 20 + 40,        // 40–60s very slow
      drift: DRIFT[Math.floor(rng() * DRIFT.length)],
    }))

    // Small stars — main field
    const small = Array.from({ length: 110 }, (_, i) => ({
      id: i,
      x: rng() * 110 - 5,
      y: rng() * 110 - 5,
      size: rng() * 1.2 + 0.8,
      delay: -(rng() * 40),
      dur: rng() * 15 + 25,        // 25–40s
      drift: DRIFT[Math.floor(rng() * DRIFT.length)],
      bright: rng() > 0.65,
    }))

    // Medium stars — occasional pops
    const medium = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: rng() * 110 - 5,
      y: rng() * 110 - 5,
      size: rng() * 1.8 + 1.8,
      delay: -(rng() * 30),
      dur: rng() * 12 + 18,        // 18–30s
      drift: DRIFT[Math.floor(rng() * DRIFT.length)],
    }))

    // Large accent stars — sparse, noticeable
    const large = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: rng() * 100,
      y: rng() * 100,
      size: rng() * 2.5 + 3.0,
      delay: -(rng() * 25),
      dur: rng() * 10 + 15,        // 15–25s
      drift: DRIFT[Math.floor(rng() * DRIFT.length)],
    }))

    // Glowing colored stars
    const glowing = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: rng() * 110 - 5,
      y: rng() * 110 - 5,
      size: rng() * 3 + 2,
      delay: -(rng() * 35),
      dur: rng() * 14 + 20,        // 20–34s
      color: GLOW_COLORS[Math.floor(rng() * GLOW_COLORS.length)],
      drift: DRIFT[Math.floor(rng() * DRIFT.length)],
    }))

    return { tiny, small, medium, large, glowing }
  }, [])

  const renderStar = (s, className, extra = {}) => (
    <div
      key={s.id}
      className={`star ${s.drift} ${className}`}
      style={{
        left: `${s.x}%`,
        top: `${s.y}%`,
        width: `${s.size}px`,
        height: `${s.size}px`,
        animationDelay: `${s.delay}s`,
        animationDuration: `${s.dur}s`,
        ...extra,
      }}
    />
  )

  return (
    <div className="starfield" aria-hidden="true">
      {tiny.map(s => renderStar(s, 'star-tiny', undefined))}
      {small.map(s => renderStar(s, s.bright ? 'star-bright' : '', undefined))}
      {medium.map(s => renderStar(s, 'star-medium', undefined))}
      {large.map(s => renderStar(s, 'star-large', undefined))}
      {glowing.map(s => renderStar({ ...s, id: `g${s.id}` }, 'star-glow', { '--gc': s.color, '--gc-dim': s.color.replace(')', ',0.4)').replace('rgb', 'rgba') }))}
    </div>
  )
}
