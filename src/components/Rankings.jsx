import React, { useState, useMemo } from 'react'
import { SECTION_POINTS } from '../choreConfig.js'
import { MONTHS } from '../constants.js'

const KIDS_INFO = {
  kai:   { name: 'Kai',   color: '#ff9500' },
  janel: { name: 'Janel', color: '#39d353' },
  koa:   { name: 'Koa',   color: '#00e5ff' },
}

const CONFETTI = ['🌟','⭐','🎉','🎊','✨','🏆','👑','🌈','💫','🥳']

function getCurrentMonthStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(m) {
  const [y, mo] = m.split('-')
  return `${MONTHS[+mo - 1]} ${y}`
}

function isMonthComplete(m) {
  return m < getCurrentMonthStr()
}

function getMonthlyKidScores(chores, month) {
  const scores = { kai: 0, janel: 0 }
  for (const kidId of ['kai', 'janel']) {
    const kidData = chores[kidId] || {}
    for (const [dateStr, dayData] of Object.entries(kidData)) {
      if (!dateStr.startsWith(month)) continue
      for (const [section, sectionData] of Object.entries(dayData)) {
        const pts = SECTION_POINTS[section] || 0
        for (const done of Object.values(sectionData)) {
          if (done) scores[kidId] += pts
        }
      }
    }
  }
  return scores
}

function getAvailableMonths(chores) {
  const months = new Set([getCurrentMonthStr()])
  for (const kidData of Object.values(chores)) {
    for (const dateStr of Object.keys(kidData)) {
      if (dateStr?.length >= 7) months.add(dateStr.slice(0, 7))
    }
  }
  return [...months].sort().reverse()
}

function PlaceBadge({ place }) {
  if (place === 1) return <span className="place-badge gold">🥇 1st Place</span>
  if (place === 2) return <span className="place-badge silver">🥈 2nd Place</span>
  if (place === 3) return <span className="place-badge bronze">🥉 3rd Place</span>
  return null
}

function MonthCard({ monthStr, scores, isCurrentMonth }) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  const [secondId, secondPts] = sorted[0]
  const [thirdId,  thirdPts]  = sorted[1]

  return (
    <div className={`month-card ${isCurrentMonth ? 'current' : ''}`}>
      <div className="month-card-header">
        {isCurrentMonth && <span className="live-dot" />}
        <span className="month-card-title">
          {isCurrentMonth ? 'Current Month — ' : ''}{getMonthLabel(monthStr)}
        </span>
        {isCurrentMonth && <span className="month-live-badge">Live</span>}
      </div>

      <div className="month-podium">
        {/* 1st — Koa always wins */}
        <div className="podium-entry first">
          <div className="podium-crown">👑</div>
          <div className="podium-avatar" style={{ background: KIDS_INFO.koa.color, boxShadow: `0 0 20px ${KIDS_INFO.koa.color}88` }}>K</div>
          <div className="podium-name" style={{ color: KIDS_INFO.koa.color }}>Koa</div>
          <PlaceBadge place={1} />
          <div className="podium-pts koa-pts">The Baby 🍼</div>
        </div>

        {/* 2nd */}
        <div className="podium-entry second">
          <div className="podium-avatar" style={{ background: KIDS_INFO[secondId].color, boxShadow: `0 0 16px ${KIDS_INFO[secondId].color}66` }}>
            {KIDS_INFO[secondId].name[0]}
          </div>
          <div className="podium-name" style={{ color: KIDS_INFO[secondId].color }}>{KIDS_INFO[secondId].name}</div>
          <PlaceBadge place={2} />
          <div className="podium-pts">{secondPts} pts</div>
          {isCurrentMonth && <div className="podium-hint">Win = Yes Day! 🎉</div>}
        </div>

        {/* 3rd */}
        <div className="podium-entry third">
          <div className="podium-avatar" style={{ background: KIDS_INFO[thirdId].color, boxShadow: `0 0 12px ${KIDS_INFO[thirdId].color}44` }}>
            {KIDS_INFO[thirdId].name[0]}
          </div>
          <div className="podium-name" style={{ color: KIDS_INFO[thirdId].color }}>{KIDS_INFO[thirdId].name}</div>
          <PlaceBadge place={3} />
          <div className="podium-pts">{thirdPts} pts</div>
        </div>
      </div>

      {!isCurrentMonth && (
        <div className="month-winner-banner" style={{ borderColor: `${KIDS_INFO[secondId].color}66` }}>
          <span style={{ color: KIDS_INFO[secondId].color }}>🎉 {KIDS_INFO[secondId].name} earned a Yes Day!</span>
        </div>
      )}
    </div>
  )
}

function YesDayCelebration({ winner, month, onDismiss }) {
  const pieces = useMemo(() =>
    [...Array(40)].map((_, i) => ({
      id: i,
      emoji: CONFETTI[i % CONFETTI.length],
      left: `${(i * 7.3 + 5) % 100}%`,
      delay: `${(i * 0.17) % 3}s`,
      duration: `${2.5 + (i * 0.13) % 2.5}s`,
      size: `${1 + (i * 0.11) % 1.4}rem`,
    })), [])

  return (
    <div className="yesday-overlay">
      <div className="confetti-container" aria-hidden>
        {pieces.map(p => (
          <span key={p.id} className="confetti-piece" style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
          }}>{p.emoji}</span>
        ))}
      </div>

      <div className="yesday-dialog">
        <div className="yesday-burst">✨ 🌟 ✨</div>
        <div className="yesday-trophy">🏆</div>
        <h1 className="yesday-heading">YES DAY!</h1>
        <div className="yesday-winner">{winner}</div>
        <p className="yesday-month">wins a Yes Day for {month}!</p>
        <p className="yesday-desc">
          For one whole day YOU are in charge — say yes to almost anything! 🥳
        </p>
        <div className="yesday-emoji-row">🎉 🌈 🎊 💫 🥳 ⭐ 🎉</div>
        <button className="btn btn-primary yesday-btn" onClick={onDismiss}>
          Let's Celebrate! 🎉
        </button>
      </div>
    </div>
  )
}

export default function Rankings({ chores, koaPoints }) {
  const months      = useMemo(() => getAvailableMonths(chores), [chores])
  const currentMonth = getCurrentMonthStr()
  const completed    = useMemo(() => months.filter(isMonthComplete), [months])
  const lastMonth    = completed[0] ?? null

  const lastScores   = useMemo(() => lastMonth ? getMonthlyKidScores(chores, lastMonth) : null, [chores, lastMonth])
  const lastSecond   = lastScores
    ? KIDS_INFO[lastScores.kai >= lastScores.janel ? 'kai' : 'janel'].name
    : null

  const seenKey      = lastMonth ? `yesday-seen-${lastMonth}` : null
  const [celebrating, setCelebrating] = useState(
    () => !!(lastMonth && lastSecond && !sessionStorage.getItem(seenKey))
  )

  function dismissCelebration() {
    if (seenKey) sessionStorage.setItem(seenKey, '1')
    setCelebrating(false)
  }

  const currentScores = useMemo(() => getMonthlyKidScores(chores, currentMonth), [chores, currentMonth])

  return (
    <div className="rankings">
      {celebrating && lastSecond && (
        <YesDayCelebration
          winner={lastSecond}
          month={getMonthLabel(lastMonth)}
          onDismiss={dismissCelebration}
        />
      )}

      <div className="rankings-inner">
        <MonthCard monthStr={currentMonth} scores={currentScores} isCurrentMonth />

        {completed.map(m => (
          <MonthCard
            key={m}
            monthStr={m}
            scores={getMonthlyKidScores(chores, m)}
            isCurrentMonth={false}
          />
        ))}

        {completed.length === 0 && (
          <p className="rankings-empty">Past monthly results will appear here at the end of each month.</p>
        )}
      </div>
    </div>
  )
}
