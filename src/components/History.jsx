import React, { useMemo, useState } from 'react'
import { SECTION_POINTS, getRank, getKoaRank } from '../choreConfig.js'

const KIDS = [
  { id: 'kai',   label: 'Kai',   emoji: '🧑' },
  { id: 'janel', label: 'Janel', emoji: '👧' },
  { id: 'koa',   label: 'Koa',   emoji: '🐾' },
]

function calcMonthScore(chores, kidId, yearMonth, bonusPoints) {
  const prefix = yearMonth + '-'
  const kid = chores[kidId] || {}
  let total = 0
  for (const [dateStr, dayData] of Object.entries(kid)) {
    if (!dateStr.startsWith(prefix)) continue
    for (const [section, sectionData] of Object.entries(dayData)) {
      const pts = SECTION_POINTS[section] || 5
      for (const done of Object.values(sectionData)) {
        if (done) total += pts
      }
    }
  }
  return total + ((bonusPoints[yearMonth] || {})[kidId] || 0)
}

export default function History({ chores, koaPoints, bonusPoints }) {
  const [selected, setSelected] = useState(null)

  // Gather all months present in chore data
  const months = useMemo(() => {
    const set = new Set()
    for (const kidData of Object.values(chores)) {
      for (const dateStr of Object.keys(kidData)) {
        set.add(dateStr.slice(0, 7))
      }
    }
    return [...set].sort().reverse()
  }, [chores])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Monthly breakdown detail
  const detail = useMemo(() => {
    if (!selected) return null
    return KIDS.map(({ id, label, emoji }) => {
      const score = id === 'koa'
        ? (selected === currentMonth ? koaPoints : 0)
        : calcMonthScore(chores, id, selected, bonusPoints)
      const rank = id === 'koa' ? getKoaRank(score) : getRank(score)
      return { id, label, emoji, score, rank }
    }).sort((a, b) => b.score - a.score)
  }, [selected, chores, koaPoints, bonusPoints])

  function monthLabel(ym) {
    const [y, m] = ym.split('-')
    return new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  // All-time totals
  const allTime = useMemo(() => {
    return KIDS.map(({ id, label, emoji }) => {
      const score = id === 'koa'
        ? koaPoints
        : months.reduce((s, ym) => s + calcMonthScore(chores, id, ym, bonusPoints), 0)
      const rank = id === 'koa' ? getKoaRank(score) : getRank(score)
      return { id, label, emoji, score, rank }
    }).sort((a, b) => b.score - a.score)
  }, [chores, koaPoints, bonusPoints, months])

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
      {/* All-time leaderboard */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#818cf8', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          🏆 All-Time Leaderboard
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {allTime.map(({ id, label, emoji, score, rank }, i) => (
            <div key={id} style={{
              background: i === 0 ? 'rgba(251,191,36,0.1)' : '#13132a',
              border: `1px solid ${i === 0 ? '#fbbf24' : '#2a2a5a'}`,
              borderRadius: '0.75rem', padding: '0.75rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.5rem', minWidth: 32, textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </span>
              <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: rank.color }}>{rank.emoji} {rank.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: rank.color }}>{score.toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month picker */}
      <h2 style={{ color: '#818cf8', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        📅 Monthly History
      </h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {months.map(ym => (
          <button
            key={ym}
            onClick={() => setSelected(selected === ym ? null : ym)}
            style={{
              padding: '0.4rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
              background: selected === ym ? '#4f46e5' : '#13132a',
              border: `1px solid ${ym === currentMonth ? '#818cf8' : '#2a2a5a'}`,
              color: selected === ym ? '#fff' : '#94a3b8',
              fontWeight: selected === ym ? 700 : 400,
              fontSize: '0.85rem',
            }}
          >
            {ym === currentMonth ? '⭐ ' : ''}{monthLabel(ym)}
          </button>
        ))}
      </div>

      {/* Month detail */}
      {selected && detail && (
        <div style={{
          background: '#13132a', border: '1px solid #2a2a5a',
          borderRadius: '1rem', padding: '1rem',
        }}>
          <h3 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>
            {monthLabel(selected)}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {detail.map(({ id, label, emoji, score, rank }, i) => {
              const maxScore = Math.max(...detail.map(d => d.score)) || 1
              const pct = Math.round((score / maxScore) * 100)
              return (
                <div key={id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                      {i === 0 ? '👑 ' : ''}{emoji} {label}
                      <span style={{ color: rank.color, marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                        {rank.emoji} {rank.label}
                      </span>
                    </span>
                    <span style={{ color: rank.color, fontWeight: 700 }}>{score.toLocaleString()} pts</span>
                  </div>
                  <div style={{ background: '#0f0f2e', borderRadius: '999px', height: 8 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: '999px',
                      background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
