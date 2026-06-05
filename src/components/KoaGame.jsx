import React, { useState, useCallback } from 'react'
import { getKoaRank, KOA_MESSAGES } from '../choreConfig.js'

const DUTIES = [
  { emoji: '🥰', text: 'Be adorable at all times' },
  { emoji: '💕', text: 'Spread joy everywhere you go' },
  { emoji: '😴', text: 'Nap like an absolute champion' },
  { emoji: '🎉', text: 'Make everyone smile just by existing' },
  { emoji: '⭐', text: 'Just be Koa — you\'re perfect' },
]

export default function KoaGame({ points, onAddPoints }) {
  const [burst, setBurst]       = useState(false)
  const [message, setMessage]   = useState(null)
  const [floats, setFloats]     = useState([])

  const rank = getKoaRank(points)

  const handleTap = useCallback(() => {
    const gained = 5
    onAddPoints(gained)

    // Flash animation
    setBurst(true)
    setTimeout(() => setBurst(false), 600)

    // Random message
    setMessage(KOA_MESSAGES[Math.floor(Math.random() * KOA_MESSAGES.length)])
    setTimeout(() => setMessage(null), 1800)

    // Floating +5 particles
    const id = Date.now()
    const count = 5
    const newFloats = Array.from({ length: count }, (_, i) => ({
      id: `${id}-${i}`,
      x: 40 + Math.random() * 20,
      delay: i * 80,
    }))
    setFloats(prev => [...prev, ...newFloats])
    setTimeout(() => setFloats(prev => prev.filter(f => !newFloats.find(n => n.id === f.id))), 1400)
  }, [onAddPoints])

  const nextRankIdx = Math.min(
    [0,15,40,80,150].findIndex(m => points < m),
    4
  )
  const thresholds = [0, 15, 40, 80, 150]
  const prevThresh = thresholds[Math.max(nextRankIdx - 1, 0)]
  const nextThresh = thresholds[nextRankIdx] ?? 150
  const pct = nextRankIdx >= 4
    ? 100
    : Math.min(100, ((points - prevThresh) / (nextThresh - prevThresh)) * 100)

  return (
    <div className="koa-game">
      {/* Rank display */}
      <div className="koa-rank-badge" style={{ color: rank.color, borderColor: rank.color + '55', boxShadow: `0 0 20px ${rank.color}44` }}>
        <span className="koa-rank-emoji">{rank.emoji}</span>
        <div>
          <div className="koa-rank-label">{rank.label}</div>
          <div className="koa-rank-pts">{points} Cute Points</div>
        </div>
      </div>

      {/* Progress to next rank */}
      {pct < 100 && (
        <div className="koa-progress">
          <div className="koa-progress-bar">
            <div className="koa-progress-fill" style={{ width: `${pct}%`, background: rank.color, boxShadow: `0 0 10px ${rank.color}` }} />
          </div>
          <div className="koa-progress-label" style={{ color: rank.color }}>
            {nextThresh - points} pts to next rank
          </div>
        </div>
      )}

      {/* Big tap button */}
      <div className="koa-btn-wrap">
        {floats.map(f => (
          <div
            key={f.id}
            className="koa-float"
            style={{ left: `${f.x}%`, animationDelay: `${f.delay}ms`, color: rank.color }}
          >
            +5 ✨
          </div>
        ))}

        <button
          className={`koa-btn ${burst ? 'koa-burst' : ''}`}
          onClick={handleTap}
          style={{ '--rank-color': rank.color }}
        >
          <div className="koa-face">🤗</div>
          <div className="koa-tap-hint">Tap for Cuteness!</div>
        </button>

        {message && (
          <div className="koa-message" style={{ color: rank.color }}>
            {message}
          </div>
        )}
      </div>

      {/* Official duties */}
      <div className="koa-duties">
        <h3 className="koa-duties-title">🌟 Koa's Official Duties</h3>
        <div className="koa-duties-list">
          {DUTIES.map((d, i) => (
            <div key={i} className="koa-duty-item">
              <span className="koa-duty-emoji">{d.emoji}</span>
              <span>{d.text}</span>
              <span className="koa-duty-check">✓</span>
            </div>
          ))}
        </div>
      </div>

      {points >= 150 && (
        <div className="koa-legendary">
          👑 LEGENDARY CUTENESS ACHIEVED! The entire universe bows to Koa! 👑
        </div>
      )}
    </div>
  )
}
