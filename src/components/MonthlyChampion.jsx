import React, { useState, useEffect, useMemo } from 'react'
import { FAMILY_MEMBERS } from '../constants.js'
import { getRank } from '../choreConfig.js'

const CONFETTI_COLORS = ['#f472b6', '#22d3ee', '#fbbf24', '#8b5cf6', '#86efac', '#fb923c', '#fff']

function isFirstDayOfMonth() {
  return new Date().getDate() === 1
}

function getLastMonthInfo() {
  const d = new Date()
  let year  = d.getFullYear()
  let month = d.getMonth() // JS month is 0-based, so this is already "last month"
  if (month === 0) { month = 12; year-- }
  const name = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const key  = `${year}-${String(month).padStart(2, '0')}`
  return { year, month, name, key }
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 80 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: Math.random() * 100,
    delay: Math.random() * 4,
    dur: Math.random() * 2 + 2.5,
    size: Math.random() * 10 + 5,
    rotate: Math.random() * 360,
    circle: Math.random() > 0.5,
  })), [])

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.x}%`,
          width: p.size,
          height: p.circle ? p.size : p.size * 0.4,
          borderRadius: p.circle ? '50%' : '2px',
          background: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          transform: `rotate(${p.rotate}deg)`,
          boxShadow: `0 0 6px ${p.color}`,
        }} />
      ))}
    </div>
  )
}

function RankBar({ score, maxScore, color }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return (
    <div className="cscore-bar-wrap">
      <div className="cscore-bar" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
    </div>
  )
}

export default function MonthlyChampion({ getMonthScore }) {
  const [visible,   setVisible]   = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const lastMonth = getLastMonthInfo()
  const lsKey     = `champion_shown_${lastMonth.key}`

  const koa   = FAMILY_MEMBERS.find(m => m.id === 'koa')
  const kids  = ['kai', 'janel'].map(id => {
    const member = FAMILY_MEMBERS.find(m => m.id === id)
    const score  = getMonthScore(id, lastMonth.year, lastMonth.month)
    const rank   = getRank(score)
    return { ...member, score, rank }
  })

  // Sort Kai/Janel by score descending → winner is index 0
  kids.sort((a, b) => b.score - a.score)
  const [winner, runnerUp] = kids
  const maxScore = Math.max(winner.score, 1)

  useEffect(() => {
    if (!isFirstDayOfMonth()) return
    if (localStorage.getItem(lsKey)) return
    const t = setTimeout(() => setVisible(true), 1800)
    return () => clearTimeout(t)
  }, [lsKey])

  function dismiss() {
    localStorage.setItem(lsKey, '1')
    setDismissed(true)
    setTimeout(() => setVisible(false), 600)
  }

  if (!visible) return null

  return (
    <div className={`champion-overlay ${dismissed ? 'fading-out' : ''}`}>
      <Confetti />

      <div className="champion-modal">
        {/* ── Header ── */}
        <div className="champion-header">
          <div className="champion-month">{lastMonth.name} Final Results</div>
          <div className="champion-title">
            <span className="champion-crown-big">👑</span>
            <span>YES DAY WINNER!</span>
            <span className="champion-crown-big">👑</span>
          </div>
        </div>

        {/* ── Podium ── */}
        <div className="champion-podium">
          {/* 1st — Koa (always, forever, the cutest) */}
          <div className="podium-place podium-first">
            <div className="podium-crown">🍼</div>
            <div className="podium-avatar" style={{ background: koa.color, boxShadow: `0 0 20px ${koa.color}` }}>
              {koa.name[0]}
            </div>
            <div className="podium-name" style={{ color: koa.color }}>{koa.name}</div>
            <div className="podium-rank-tag" style={{ color: koa.color }}>👑 Cutest Ever</div>
            <div className="podium-block podium-block-1">
              <span className="podium-num">1</span>
            </div>
          </div>

          {/* 2nd — Winner (higher score of Kai / Janel) */}
          <div className="podium-place podium-second">
            <div className="podium-crown crown-animated">👑</div>
            <div className="podium-avatar winner-pulse"
              style={{ background: winner.color, boxShadow: `0 0 40px ${winner.color}, 0 0 80px ${winner.color}55` }}>
              {winner.name[0]}
            </div>
            <div className="podium-name winner-glow" style={{ color: winner.color }}>{winner.name}</div>
            <div className="podium-rank-tag" style={{ color: winner.rank.color }}>
              {winner.rank.emoji} {winner.rank.label}
            </div>
            <div className="podium-score" style={{ color: winner.color }}>{winner.score} ⭐</div>
            <div className="podium-block podium-block-2"
              style={{ background: `linear-gradient(135deg, ${winner.color}55, ${winner.color}22)`, borderColor: `${winner.color}66` }}>
              <span className="podium-num">2</span>
            </div>
          </div>

          {/* 3rd — Runner up */}
          <div className="podium-place podium-third">
            <div className="podium-crown" style={{ opacity: 0.4 }}>🥉</div>
            <div className="podium-avatar" style={{ background: runnerUp.color, boxShadow: `0 0 14px ${runnerUp.color}` }}>
              {runnerUp.name[0]}
            </div>
            <div className="podium-name" style={{ color: runnerUp.color }}>{runnerUp.name}</div>
            <div className="podium-rank-tag" style={{ color: runnerUp.rank.color }}>
              {runnerUp.rank.emoji} {runnerUp.rank.label}
            </div>
            <div className="podium-score" style={{ color: runnerUp.color }}>{runnerUp.score} ⭐</div>
            <div className="podium-block podium-block-3">
              <span className="podium-num">3</span>
            </div>
          </div>
        </div>

        {/* ── Yes Day banner ── */}
        <div className="champion-yesday">
          <div className="yesday-icon">🎉</div>
          <div className="yesday-text">
            <strong style={{ color: winner.color }}>{winner.name}</strong> earned a{' '}
            <span className="yesday-badge">YES DAY!</span>
            <br />
            <span className="yesday-sub">Name the day — anything goes! 🌈</span>
          </div>
        </div>

        {/* ── Score breakdown with rank bars ── */}
        <div className="champion-scores">
          <div className="cscore-header">Last Month Scores</div>
          {[winner, runnerUp].map(k => (
            <div key={k.id} className="cscore-row">
              <span style={{ color: k.color }}>{k.rank.emoji} {k.name}</span>
              <RankBar score={k.score} maxScore={maxScore} color={k.color} />
              <span style={{ color: k.color }}>{k.score} pts</span>
            </div>
          ))}
        </div>

        {/* ── Rank achievements ── */}
        <div className="champion-ranks">
          <div className="cscore-header">Rank Achieved</div>
          <div className="champion-rank-row">
            {[winner, runnerUp].map(k => (
              <div key={k.id} className="champion-rank-card" style={{ borderColor: `${k.rank.color}55` }}>
                <div className="crankcard-emoji" style={{ color: k.rank.color }}>{k.rank.emoji}</div>
                <div className="crankcard-name" style={{ color: k.color }}>{k.name}</div>
                <div className="crankcard-label" style={{ color: k.rank.color }}>{k.rank.label}</div>
                <div className="crankcard-pts">{k.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary champion-close" onClick={dismiss}>
          🎊 Let's Celebrate!
        </button>
        <div className="champion-reset-note">
          Scores are reset — next month's challenge starts today! Who'll win? 🚀
        </div>
      </div>
    </div>
  )
}
