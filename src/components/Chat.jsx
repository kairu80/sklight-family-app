import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ref, push, onValue, off, query, orderByChild } from 'firebase/database'
import { getDB } from '../firebase.js'
import { FAMILY_MEMBERS } from '../constants.js'

const PARENT_IDS  = ['mommy', 'dada', 'gamgam']
const PARENT_PASS = '1986'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDateLabel(str) {
  const today = getTodayStr()
  if (str === today) return 'Today'
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Passcode overlay ──────────────────────────────────
function PasscodeOverlay({ onUnlock, onCancel }) {
  const [val, setVal] = useState('')
  const [shake, setShake] = useState(false)

  function attempt() {
    if (val === PARENT_PASS) { onUnlock() }
    else { setShake(true); setVal(''); setTimeout(() => setShake(false), 600) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={onCancel}>
      <div style={{
        background: '#13132a', border: '1px solid #2a2a5a', borderRadius: '1rem',
        padding: '2rem', width: 300, textAlign: 'center',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
        <h3 style={{ color: '#e2e8f0', marginBottom: '0.25rem' }}>Parent Access</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Enter parent passcode to chat</p>
        <input
          type="password"
          inputMode="numeric"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
          placeholder="••••"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0f0f2e', border: `1px solid ${shake ? '#f87171' : '#2a2a5a'}`,
            borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '1.2rem',
            padding: '0.6rem', textAlign: 'center', letterSpacing: '0.3rem',
            animation: shake ? 'shake 0.3s' : 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '0.6rem', background: 'transparent',
            border: '1px solid #2a2a5a', borderRadius: '0.5rem',
            color: '#64748b', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={attempt} disabled={!val} style={{
            flex: 1, padding: '0.6rem', background: '#4f46e5',
            border: 'none', borderRadius: '0.5rem',
            color: '#fff', fontWeight: 700, cursor: 'pointer',
          }}>Unlock</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Chat ─────────────────────────────────────────
export default function Chat() {
  const [activeMember, setActiveMember] = useState(null)
  const [unlockedParents, setUnlockedParents] = useState([]) // parents verified this session
  const [pendingParent, setPendingParent] = useState(null)   // parent awaiting passcode
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [viewDate, setViewDate] = useState(getTodayStr())
  const [allDates, setAllDates] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const bottomRef = useRef(null)
  const today = getTodayStr()

  // Load all known chat dates (for history nav)
  useEffect(() => {
    const db = getDB()
    if (!db) return
    const chatRef = ref(db, 'sklightFamily/chat')
    onValue(chatRef, snap => {
      if (!snap.exists()) return
      const dates = Object.keys(snap.val()).sort().reverse()
      setAllDates(dates)
    })
    return () => off(chatRef)
  }, [])

  // Load messages for viewDate
  useEffect(() => {
    const db = getDB()
    if (!db) return
    const dayRef = ref(db, `sklightFamily/chat/${viewDate}`)
    onValue(dayRef, snap => {
      if (!snap.exists()) { setMessages([]); return }
      const raw = snap.val()
      const arr = Object.entries(raw)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => a.ts - b.ts)
      setMessages(arr)
    })
    return () => off(dayRef)
  }, [viewDate])

  // Scroll to bottom when new messages arrive (today only)
  useEffect(() => {
    if (viewDate === today) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, viewDate])

  function selectMember(m) {
    if (PARENT_IDS.includes(m.id)) {
      if (unlockedParents.includes(m.id)) {
        setActiveMember(m)
      } else {
        setPendingParent(m)
      }
    } else {
      setActiveMember(m)
    }
  }

  function handleUnlock() {
    setUnlockedParents(prev => [...prev, pendingParent.id])
    setActiveMember(pendingParent)
    setPendingParent(null)
  }

  function sendMessage() {
    const trimmed = text.trim()
    if (!trimmed || !activeMember) return
    const db = getDB()
    if (!db) return
    push(ref(db, `sklightFamily/chat/${today}`), {
      sender: activeMember.id,
      name:   activeMember.name,
      text:   trimmed,
      ts:     Date.now(),
    })
    setText('')
  }

  const member = FAMILY_MEMBERS.find(m => m.id === activeMember?.id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', maxWidth: 600, margin: '0 auto' }}>

      {/* Passcode overlay */}
      {pendingParent && (
        <PasscodeOverlay
          onUnlock={handleUnlock}
          onCancel={() => setPendingParent(null)}
        />
      )}

      {/* Who are you? picker */}
      {!activeMember && (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>💬</div>
          <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Family Chat</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Who's chatting?</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {FAMILY_MEMBERS.map(m => (
              <button key={m.id} onClick={() => selectMember(m)} style={{
                padding: '0.5rem 1rem', borderRadius: '999px', cursor: 'pointer',
                background: m.bg, border: `1px solid ${m.color}`,
                color: m.color, fontWeight: 700, fontSize: '0.9rem',
              }}>
                {PARENT_IDS.includes(m.id) ? '🔒 ' : ''}{m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header bar (when profile selected) */}
      {activeMember && (
        <div style={{
          padding: '0.6rem 1rem', background: '#13132a',
          borderBottom: '1px solid #2a2a5a',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          {/* Date navigation */}
          <button onClick={() => { setShowHistory(h => !h) }} style={{
            background: showHistory ? '#4f46e5' : '#1e1e3f',
            border: '1px solid #2a2a5a', borderRadius: '0.5rem',
            color: '#e2e8f0', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem',
          }}>
            📅 {fmtDateLabel(viewDate)}
          </button>

          <div style={{ flex: 1 }} />

          {/* Switch user */}
          <button onClick={() => { setActiveMember(null); setViewDate(today); setShowHistory(false) }} style={{
            background: member?.bg, border: `1px solid ${member?.color}`,
            borderRadius: '999px', padding: '0.25rem 0.75rem',
            color: member?.color, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
          }}>
            {member?.name} ✕
          </button>
        </div>
      )}

      {/* History date picker */}
      {showHistory && (
        <div style={{
          background: '#0f0f2e', borderBottom: '1px solid #2a2a5a',
          padding: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
          maxHeight: 120, overflowY: 'auto',
        }}>
          {[today, ...allDates.filter(d => d !== today)].map(d => (
            <button key={d} onClick={() => { setViewDate(d); setShowHistory(false) }} style={{
              padding: '0.3rem 0.7rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem',
              background: viewDate === d ? '#4f46e5' : '#13132a',
              border: `1px solid ${d === today ? '#818cf8' : '#2a2a5a'}`,
              color: viewDate === d ? '#fff' : '#94a3b8',
            }}>
              {fmtDateLabel(d)}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {activeMember && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#334155', marginTop: '2rem', fontSize: '0.9rem' }}>
              {viewDate === today ? 'No messages yet today — say something! 👋' : 'No messages on this day.'}
            </div>
          )}
          {messages.map(msg => {
            const sender = FAMILY_MEMBERS.find(m => m.id === msg.sender)
            const isMe = msg.sender === activeMember?.id
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
              }}>
                {!isMe && (
                  <span style={{ fontSize: '0.72rem', color: sender?.color || '#94a3b8', marginBottom: '0.15rem', paddingLeft: '0.5rem' }}>
                    {msg.name || sender?.name || msg.sender}
                  </span>
                )}
                <div style={{
                  maxWidth: '75%', padding: '0.55rem 0.85rem',
                  borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  background: isMe ? (sender?.bg || 'rgba(99,102,241,0.2)') : '#1e1e3f',
                  border: `1px solid ${isMe ? (sender?.color || '#818cf8') : '#2a2a5a'}`,
                  color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.4, wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.1rem', paddingRight: '0.25rem' }}>
                  {fmtTime(msg.ts)}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input bar — only on today's view */}
      {activeMember && viewDate === today && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#13132a', borderTop: '1px solid #2a2a5a',
          display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={`Message as ${activeMember.name}…`}
            rows={1}
            style={{
              flex: 1, background: '#0f0f2e', border: '1px solid #2a2a5a',
              borderRadius: '0.75rem', color: '#e2e8f0', padding: '0.6rem 0.9rem',
              fontSize: '0.95rem', resize: 'none', outline: 'none', fontFamily: 'inherit',
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? '#4f46e5' : '#1e1e3f',
              border: 'none', borderRadius: '0.75rem', padding: '0.6rem 0.9rem',
              cursor: text.trim() ? 'pointer' : 'default', color: '#fff', fontSize: '1.1rem',
              transition: 'background 0.15s',
            }}
          >
            ➤
          </button>
        </div>
      )}

      {/* Viewing past day notice */}
      {activeMember && viewDate !== today && (
        <div style={{
          padding: '0.6rem 1rem', background: '#13132a', borderTop: '1px solid #2a2a5a',
          textAlign: 'center', color: '#64748b', fontSize: '0.85rem',
        }}>
          Viewing past messages — <button onClick={() => setViewDate(today)} style={{
            background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontWeight: 700,
          }}>Go to today</button>
        </div>
      )}
    </div>
  )
}
