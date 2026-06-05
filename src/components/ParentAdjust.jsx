import React, { useState } from 'react'
import { FAMILY_MEMBERS, KIDS } from '../constants.js'

const KIDS_DATA = FAMILY_MEMBERS.filter(m => KIDS.includes(m.id) && m.id !== 'koa')
const ADJUSTMENTS = [
  { label: '+25', val: 25, color: '#fbbf24' },
  { label: '+10', val: 10, color: '#86efac' },
  { label: '+5',  val: 5,  color: '#22d3ee' },
  { label: '−5',  val: -5, color: '#f472b644' },
  { label: '−10', val: -10, color: '#f4724488' },
  { label: '−25', val: -25, color: '#ef4444' },
]

function getMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ParentAdjust({ getScore, addBonusPoints, onClose }) {
  const [flash, setFlash] = useState(null) // { kidId, pts }
  const mk = getMonthKey()

  function adjust(kidId, pts) {
    addBonusPoints(kidId, pts, mk)
    setFlash({ kidId, pts })
    setTimeout(() => setFlash(null), 900)
  }

  return (
    <div className="parent-overlay" onClick={onClose}>
      <div className="parent-dialog" onClick={e => e.stopPropagation()}>
        <div className="parent-header">
          <span className="parent-icon">🔐</span>
          <h3 className="parent-title">Parent Score Adjust</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <p className="parent-subtitle">Manually add or remove points for this month</p>

        {KIDS_DATA.map(kid => {
          const score = getScore(kid.id)
          const isFlashing = flash?.kidId === kid.id
          const flashPts   = flash?.pts

          return (
            <div key={kid.id} className="parent-kid-row">
              <div className="parent-kid-info">
                <div className="parent-avatar" style={{ background: kid.color, boxShadow: `0 0 10px ${kid.color}` }}>
                  {kid.name[0]}
                </div>
                <span className="parent-kid-name" style={{ color: kid.color }}>{kid.name}</span>
                <span className={`parent-score ${isFlashing ? 'score-flash' : ''}`} style={{ color: kid.color }}>
                  {score} ⭐
                  {isFlashing && (
                    <span className="score-delta" style={{ color: flashPts > 0 ? '#86efac' : '#ef4444' }}>
                      {flashPts > 0 ? `+${flashPts}` : flashPts}
                    </span>
                  )}
                </span>
              </div>
              <div className="parent-btns">
                {ADJUSTMENTS.map(a => (
                  <button
                    key={a.label}
                    className="parent-adj-btn"
                    style={{ borderColor: a.color, color: a.color }}
                    onClick={() => adjust(kid.id, a.val)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        <button className="btn btn-ghost" style={{ width: '100%', marginTop: '1rem' }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
