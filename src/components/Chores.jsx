import React, { useState, useCallback } from 'react'
import { FAMILY_MEMBERS, KIDS } from '../constants.js'
import {
  SECTIONS, KINDNESS_CHORES, SECTION_POINTS,
  getChoresForSection, getRank,
} from '../choreConfig.js'
import KoaGame from './KoaGame.jsx'
import Passcode from './Passcode.jsx'
import ParentAdjust from './ParentAdjust.jsx'

function isLastDayOfMonth() {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return tomorrow.getMonth() !== today.getMonth()
}

const KIDS_DATA = FAMILY_MEMBERS.filter(m => KIDS.includes(m.id))

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtDate(str) {
  const [y, m, d] = str.split('-')
  return new Date(+y, +m-1, +d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function shiftDate(str, days) {
  const d = new Date(str + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Returns true if this date+section should be locked by the clock/calendar rules
function getSectionLocked(dateStr, section) {
  const today = getTodayStr()
  if (dateStr < today) return true   // past day — always locked
  if (dateStr > today) return false  // future — always open
  // Today: time-based
  const hour = new Date().getHours()
  if (section === 'morning'   && hour >= 12) return true
  if (section === 'afternoon' && hour >= 23) return true
  if (section === 'weekend'   && hour >= 23) return true
  if (section === 'kindness'  && hour >= 23) return true
  return false
}

function lockLabel(dateStr, section) {
  const today = getTodayStr()
  if (dateStr < today) return 'Past day — locked'
  if (section === 'morning')   return 'Locked after 12 pm'
  return 'Locked after 11 pm'
}

// ── Kindness Panel ─────────────────────────────────────
function KindnessPanel({ kidId, dateStr, kindnessData, customKindness, onToggle, onAdd, onRemove, kidColor, locked, onClickLocked }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const allKindness = [...KINDNESS_CHORES, ...customKindness]
  const total    = allKindness.length
  const completed = Object.values(kindnessData).filter(Boolean).length

  return (
    <div className="kindness-panel">
      <div className="kindness-header">
        <span className="kindness-icon">💝</span>
        <div>
          <div className="kindness-title">Random Acts of Kindness</div>
          <div className="kindness-subtitle">+25 ⭐ each!</div>
        </div>
        <div className="kindness-count" style={{ color: kidColor }}>{completed}/{total}</div>
        {locked && (
          <button className="lock-badge" onClick={onClickLocked} title="Tap to unlock">🔒</button>
        )}
      </div>

      <div className={`kindness-list ${locked ? 'section-locked' : ''}`}>
        {allKindness.map((chore, i) => {
          const done = !!kindnessData[i]
          const isCustom = i >= KINDNESS_CHORES.length
          return (
            <div
              key={i}
              className={`kindness-item ${done ? 'done' : ''}`}
              onClick={() => locked ? onClickLocked() : onToggle(i)}
            >
              <div className="kindness-check" style={done ? { background: '#f472b6', borderColor: '#f472b6', boxShadow: '0 0 8px #f472b666' } : { borderColor: '#f472b6' }}>
                {done && '✓'}
              </div>
              <span className="kindness-name">{chore}</span>
              {isCustom && !locked && (
                <button className="icon-btn danger tiny" onClick={e => { e.stopPropagation(); onRemove(chore) }}>✕</button>
              )}
              <span className="kindness-pts" style={{ color: '#f472b6' }}>25⭐</span>
            </div>
          )
        })}
      </div>

      {!locked && (adding ? (
        <div className="kindness-add-row">
          <input
            className="input"
            placeholder="New act of kindness…"
            value={newName}
            autoFocus
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onAdd(newName); setNewName(''); setAdding(false) } if (e.key === 'Escape') setAdding(false) }}
          />
          <button className="btn btn-primary small" onClick={() => { onAdd(newName); setNewName(''); setAdding(false) }}>Add</button>
          <button className="btn btn-ghost small" onClick={() => setAdding(false)}>✕</button>
        </div>
      ) : (
        <button className="btn btn-ghost small kindness-add-btn" onClick={() => setAdding(true)}>+ Add</button>
      ))}
    </div>
  )
}

// ── Main Chores component ──────────────────────────────
export default function Chores({
  chores, toggleChore,
  customChores, addCustomChore, removeCustomChore,
  getScore, getDayScore,
  koaPoints, addKoaPoints,
  addBonusPoints, getMonthScore,
}) {
  const [activeKid, setActiveKid]         = useState('kai')
  const [activeSection, setActiveSection] = useState('morning')
  const [dateStr, setDateStr]             = useState(getTodayStr())
  const [editMode, setEditMode]           = useState(false)
  const [newChore, setNewChore]           = useState('')

  // Lock state: Set of "dateStr:section" keys that have been parent-unlocked
  const [unlocked, setUnlocked]           = useState(new Set())
  // Which section is the passcode modal targeting
  const [passcodeFor, setPasscodeFor]     = useState(null) // { dateStr, section, label } or 'parentAdjust'
  const [showParentAdjust, setShowParentAdjust] = useState(false)

  const lastDay = isLastDayOfMonth()

  const kid = FAMILY_MEMBERS.find(m => m.id === activeKid)

  const unlockKey = (ds, sec) => `${ds}:${sec}`

  const isLocked = useCallback((ds, sec) => {
    if (!getSectionLocked(ds, sec)) return false
    return !unlocked.has(unlockKey(ds, sec))
  }, [unlocked])

  function requestUnlock(ds, sec, label) {
    setPasscodeFor({ dateStr: ds, section: sec, label })
  }

  function requestParentAdjust() {
    setPasscodeFor('parentAdjust')
  }

  function handleUnlocked() {
    if (passcodeFor === 'parentAdjust') {
      setPasscodeFor(null)
      setShowParentAdjust(true)
    } else {
      setUnlocked(prev => new Set([...prev, unlockKey(passcodeFor.dateStr, passcodeFor.section)]))
      setPasscodeFor(null)
    }
  }

  // Determine monthly second-place winner (for crown display)
  const today = new Date()
  const kaiMonthScore   = getMonthScore ? getMonthScore('kai',   today.getFullYear(), today.getMonth() + 1) : 0
  const janelMonthScore = getMonthScore ? getMonthScore('janel', today.getFullYear(), today.getMonth() + 1) : 0
  const monthWinnerId   = kaiMonthScore >= janelMonthScore ? 'kai' : 'janel'

  // Koa view
  if (activeKid === 'koa') {
    return (
      <div className="chores">
        {passcodeFor && (
          <Passcode
            sectionLabel={passcodeFor === 'parentAdjust' ? 'Parent Controls' : passcodeFor.label}
            onUnlock={handleUnlocked}
            onClose={() => setPasscodeFor(null)}
          />
        )}
        {showParentAdjust && (
          <ParentAdjust
            getScore={getScore}
            addBonusPoints={addBonusPoints}
            onClose={() => setShowParentAdjust(false)}
          />
        )}
        <KidTabs
          activeKid={activeKid}
          setActiveKid={setActiveKid}
          getScore={getScore}
          koaPoints={koaPoints}
          monthWinnerId={lastDay ? monthWinnerId : null}
          onParentAdjust={requestParentAdjust}
        />
        <KoaGame points={koaPoints} onAddPoints={addKoaPoints} />
      </div>
    )
  }

  const baseChores   = getChoresForSection(activeSection)
  const custom       = customChores?.[activeKid]?.[activeSection] || []
  const allChores    = [...baseChores, ...custom]
  const sectionData  = chores?.[activeKid]?.[dateStr]?.[activeSection] || {}
  const kindnessData = chores?.[activeKid]?.[dateStr]?.kindness || {}

  const completed = Object.values(sectionData).filter(Boolean).length
  const total     = allChores.length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  const score = getScore(activeKid)
  const rank  = getRank(score)

  const todayDay = new Date(dateStr + 'T00:00:00').getDay()
  const isWeekend = todayDay === 0 || todayDay === 6

  const mainLocked    = isLocked(dateStr, activeSection)
  const kindnessLocked = isLocked(dateStr, 'kindness')

  function handleAddChore() {
    if (newChore.trim()) {
      addCustomChore(activeKid, activeSection, newChore.trim())
      setNewChore('')
    }
  }

  return (
    <div className="chores">
      {passcodeFor && (
        <Passcode
          sectionLabel={passcodeFor === 'parentAdjust' ? 'Parent Controls' : passcodeFor.label}
          onUnlock={handleUnlocked}
          onClose={() => setPasscodeFor(null)}
        />
      )}
      {showParentAdjust && (
        <ParentAdjust
          getScore={getScore}
          addBonusPoints={addBonusPoints}
          onClose={() => setShowParentAdjust(false)}
        />
      )}

      <KidTabs
        activeKid={activeKid}
        setActiveKid={setActiveKid}
        getScore={getScore}
        koaPoints={koaPoints}
        monthWinnerId={lastDay ? monthWinnerId : null}
        onParentAdjust={requestParentAdjust}
      />

      {/* Section tabs */}
      <div className="section-tabs">
        {SECTIONS.map(s => {
          const tabLocked = isLocked(dateStr, s.id)
          return (
            <button
              key={s.id}
              className={`section-tab ${activeSection === s.id ? 'active' : ''}`}
              style={activeSection === s.id
                ? { color: kid.color, borderBottomColor: kid.color, background: `${kid.color}12` }
                : {}}
              onClick={() => setActiveSection(s.id)}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              {tabLocked
                ? <span className="section-lock-icon">🔒</span>
                : <span className="section-pts-badge" style={activeSection === s.id ? { background: kid.color } : {}}>+{s.points}⭐</span>
              }
            </button>
          )
        })}
      </div>

      <div className="chore-layout">
        {/* ── Main chore list ── */}
        <div className="chore-main">
          {/* Date nav */}
          <div className="chore-top-bar">
            <div className="date-nav">
              <button className="icon-btn" onClick={() => setDateStr(d => shiftDate(d, -1))}>‹</button>
              <span className="date-nav-label">{fmtDate(dateStr)}</span>
              <button className="icon-btn" onClick={() => setDateStr(d => shiftDate(d, 1))}>›</button>
              <button className="btn btn-ghost small" onClick={() => setDateStr(getTodayStr())}>Today</button>
            </div>

            <div className="rank-badge" style={{ color: rank.color, borderColor: `${rank.color}44`, boxShadow: `0 0 10px ${rank.color}33` }}>
              {rank.emoji} <span className="rank-label">{rank.label}</span>
              <span className="rank-pts">· {score} pts</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-section">
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: kid.color, boxShadow: `0 0 12px ${kid.color}` }} />
            </div>
            <span className="progress-label" style={{ color: kid.color }}>
              {completed}/{total} done · {pct}%
            </span>
          </div>

          {/* Lock banner */}
          {mainLocked && (
            <div className="lock-banner" onClick={() => requestUnlock(dateStr, activeSection, SECTIONS.find(s => s.id === activeSection)?.label)}>
              <span className="lock-banner-icon">🔒</span>
              <span className="lock-banner-text">{lockLabel(dateStr, activeSection)}</span>
              <span className="lock-banner-action">Tap to unlock →</span>
            </div>
          )}

          {/* Weekend hint */}
          {activeSection === 'weekend' && !isWeekend && !mainLocked && (
            <div className="section-hint">📅 Weekend chores — tackle these on Sat & Sun!</div>
          )}

          {/* Chore items */}
          <div className={`chore-list ${mainLocked ? 'section-locked' : ''}`}>
            {allChores.map((chore, i) => {
              const done      = !!sectionData[i]
              const isCustom  = i >= baseChores.length
              const pts       = SECTION_POINTS[activeSection]

              return (
                <div
                  key={i}
                  className={`chore-item ${done ? 'done' : ''} ${mainLocked ? 'locked-item' : ''}`}
                  onClick={() => mainLocked
                    ? requestUnlock(dateStr, activeSection, SECTIONS.find(s => s.id === activeSection)?.label)
                    : toggleChore(activeKid, dateStr, activeSection, i)
                  }
                >
                  <div
                    className="chore-check"
                    style={done
                      ? { background: kid.color, borderColor: kid.color, boxShadow: `0 0 10px ${kid.color}88` }
                      : { borderColor: `${kid.color}88` }
                    }
                  >
                    {mainLocked ? '🔒' : (done && '✓')}
                  </div>
                  <span className="chore-name">{chore}</span>

                  {done && !mainLocked && <span className="chore-star" style={{ color: kid.color }}>⭐</span>}

                  <span className="chore-pts-tag" style={{ color: `${kid.color}bb`, borderColor: `${kid.color}33` }}>
                    +{pts}
                  </span>

                  {editMode && isCustom && !mainLocked && (
                    <button
                      className="icon-btn danger tiny"
                      onClick={e => { e.stopPropagation(); removeCustomChore(activeKid, activeSection, chore) }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}

            {editMode && !mainLocked && (
              <div className="add-chore-row">
                <input
                  className="input"
                  placeholder={`Add to ${SECTIONS.find(s => s.id === activeSection)?.label} chores…`}
                  value={newChore}
                  onChange={e => setNewChore(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddChore()}
                />
                <button className="btn btn-primary small" onClick={handleAddChore} disabled={!newChore.trim()}>Add</button>
              </div>
            )}
          </div>

          {!mainLocked && (
            <button
              className="btn btn-ghost small manage-btn"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? '✓ Done editing' : '⚙ Edit chores'}
            </button>
          )}
        </div>

        {/* ── Kindness sidebar ── */}
        <KindnessPanel
          kidId={activeKid}
          dateStr={dateStr}
          kindnessData={kindnessData}
          customKindness={customChores?.[activeKid]?.kindness || []}
          onToggle={i => toggleChore(activeKid, dateStr, 'kindness', i)}
          onAdd={name => addCustomChore(activeKid, 'kindness', name)}
          onRemove={name => removeCustomChore(activeKid, 'kindness', name)}
          kidColor={kid.color}
          locked={kindnessLocked}
          onClickLocked={() => requestUnlock(dateStr, 'kindness', 'Kindness')}
        />
      </div>
    </div>
  )
}

// ── Kid Tabs ───────────────────────────────────────────
function KidTabs({ activeKid, setActiveKid, getScore, koaPoints, monthWinnerId, onParentAdjust }) {
  return (
    <div className="kid-tabs-row">
      <div className="kid-tabs">
        {KIDS_DATA.map(k => {
          const score       = k.id === 'koa' ? koaPoints : getScore(k.id)
          const isKoa       = k.id === 'koa'
          const isWinner    = monthWinnerId && k.id === monthWinnerId
          const hasCrown    = isKoa || isWinner

          return (
            <button
              key={k.id}
              className={`kid-tab ${activeKid === k.id ? 'active' : ''} ${isWinner ? 'kid-tab-winner' : ''}`}
              style={activeKid === k.id
                ? { borderColor: k.color, color: k.color, background: `${k.color}15`, boxShadow: `0 0 12px ${k.color}33` }
                : {}}
              onClick={() => setActiveKid(k.id)}
            >
              {hasCrown && (
                <span className={`tab-crown ${isWinner ? 'tab-crown-animated' : ''}`}>
                  {isWinner ? '👑' : '🍼'}
                </span>
              )}
              <span className="kid-avatar" style={{ background: k.color, boxShadow: `0 0 8px ${k.color}` }}>
                {k.name[0]}
              </span>
              {k.name}
              <span className="kid-score-badge" style={{ background: k.color, boxShadow: `0 0 6px ${k.color}` }}>
                {score}
              </span>
            </button>
          )
        })}
      </div>
      <button className="parent-lock-btn" onClick={onParentAdjust} title="Parent score adjustment">
        🔐
      </button>
    </div>
  )
}
