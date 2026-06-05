import { useState, useEffect, useCallback, useRef } from 'react'
import { ref, onValue, set, update } from 'firebase/database'
import { SECTION_POINTS } from './choreConfig.js'
import { initFirebase, getDB, isConfigured } from './firebase.js'

const DEFAULT_CUSTOM = {
  kai:   { morning: [], afternoon: [], weekend: [], kindness: [] },
  janel: { morning: [], afternoon: [], weekend: [], kindness: [] },
  koa:   {},
}

const DEFAULT_DATA = {
  events: [],
  chores: {},
  customChores: DEFAULT_CUSTOM,
  koaPoints: 0,
  bonusPoints: {},
}

// Fallback: localStorage-only mode when Firebase isn't configured
function lsGet()  { try { return JSON.parse(localStorage.getItem('sklightData') || 'null') } catch { return null } }
function lsSave(d){ localStorage.setItem('sklightData', JSON.stringify(d)) }

export function useStore() {
  const [events,       setEvents]       = useState([])
  const [chores,       setChores]       = useState({})
  const [customChores, setCustomChores] = useState(DEFAULT_CUSTOM)
  const [koaPoints,    setKoaPoints]    = useState(0)
  const [bonusPoints,  setBonusPoints]  = useState({})
  const [ready,        setReady]        = useState(false)
  const [fbOk,         setFbOk]         = useState(false)

  const stateRef = useRef({ events: [], chores: {}, customChores: DEFAULT_CUSTOM, koaPoints: 0, bonusPoints: {} })

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { events, chores, customChores, koaPoints, bonusPoints }
  }, [events, chores, customChores, koaPoints, bonusPoints])

  useEffect(() => {
    const ok = isConfigured() ? initFirebase() : false
    setFbOk(ok)

    if (ok) {
      // Firebase mode — listen for real-time changes
      const db = getDB()
      const dataRef = ref(db, 'sklightFamily')
      const unsub = onValue(dataRef, (snap) => {
        const data = snap.val() || DEFAULT_DATA
        setEvents(data.events     ? Object.values(data.events)     : [])
        setChores(data.chores       || {})
        setCustomChores(data.customChores || DEFAULT_CUSTOM)
        setKoaPoints(data.koaPoints   || 0)
        setBonusPoints(data.bonusPoints || {})
        setReady(true)
      }, (err) => {
        console.error('Firebase read error', err)
        // Fall back to localStorage
        loadFromLS()
      })
      return () => unsub()
    } else {
      loadFromLS()
    }
  }, [])

  function loadFromLS() {
    const data = lsGet() || DEFAULT_DATA
    setEvents(data.events || [])
    setChores(data.chores || {})
    setCustomChores(data.customChores || DEFAULT_CUSTOM)
    setKoaPoints(data.koaPoints || 0)
    setBonusPoints(data.bonusPoints || {})
    setReady(true)
  }

  // ── Write helpers ─────────────────────────────────────
  function persist(patch) {
    const next = { ...stateRef.current, ...patch }
    if (fbOk) {
      const db = getDB()
      // Convert events array to object for Firebase
      const toSave = {
        ...next,
        events: next.events.reduce((acc, e) => ({ ...acc, [e.id]: e }), {}),
      }
      set(ref(db, 'sklightFamily'), toSave).catch(console.error)
    } else {
      lsSave(next)
    }
  }

  // ── Events ────────────────────────────────────────────
  const addEvent = useCallback((event) => {
    setEvents(prev => {
      const next = [...prev, event]
      persist({ events: next })
      return next
    })
  }, [fbOk])

  const updateEvent = useCallback((id, updates) => {
    setEvents(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      persist({ events: next })
      return next
    })
  }, [fbOk])

  const deleteEvent = useCallback((id) => {
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id)
      persist({ events: next })
      return next
    })
  }, [fbOk])

  // ── Chores ────────────────────────────────────────────
  const toggleChore = useCallback((kidId, dateStr, section, choreIdx) => {
    setChores(prev => {
      const kid = prev[kidId] || {}
      const day = kid[dateStr] || {}
      const sec = day[section] || {}
      const updated = {
        ...prev,
        [kidId]: {
          ...kid,
          [dateStr]: { ...day, [section]: { ...sec, [choreIdx]: !sec[choreIdx] } },
        },
      }
      persist({ chores: updated })
      return updated
    })
  }, [fbOk])

  // ── Custom chores ─────────────────────────────────────
  const addCustomChore = useCallback((kidId, section, name) => {
    if (!name?.trim()) return
    setCustomChores(prev => {
      const kid = prev[kidId] || { morning: [], afternoon: [], weekend: [], kindness: [] }
      const sec = kid[section] || []
      if (sec.includes(name.trim())) return prev
      const updated = { ...prev, [kidId]: { ...kid, [section]: [...sec, name.trim()] } }
      persist({ customChores: updated })
      return updated
    })
  }, [fbOk])

  const removeCustomChore = useCallback((kidId, section, name) => {
    setCustomChores(prev => {
      const kid = prev[kidId] || {}
      const sec = (kid[section] || []).filter(c => c !== name)
      const updated = { ...prev, [kidId]: { ...kid, [section]: sec } }
      persist({ customChores: updated })
      return updated
    })
  }, [fbOk])

  // ── Koa points ────────────────────────────────────────
  const addKoaPoints = useCallback((pts) => {
    setKoaPoints(prev => {
      const next = prev + pts
      persist({ koaPoints: next })
      return next
    })
  }, [fbOk])

  // ── Bonus points ──────────────────────────────────────
  const addBonusPoints = useCallback((kidId, pts, monthKey) => {
    setBonusPoints(prev => {
      const monthData = prev[monthKey] || {}
      const updated = {
        ...prev,
        [monthKey]: { ...monthData, [kidId]: (monthData[kidId] || 0) + pts },
      }
      persist({ bonusPoints: updated })
      return updated
    })
  }, [fbOk])

  // ── Scores ────────────────────────────────────────────
  const getMonthScore = useCallback((kidId, year, month) => {
    if (kidId === 'koa') return koaPoints
    const prefix = `${year}-${String(month).padStart(2, '0')}-`
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
    const mk = `${year}-${String(month).padStart(2, '0')}`
    return total + ((bonusPoints[mk] || {})[kidId] || 0)
  }, [chores, koaPoints, bonusPoints])

  const getScore = useCallback((kidId) => {
    if (kidId === 'koa') return koaPoints
    const now = new Date()
    return getMonthScore(kidId, now.getFullYear(), now.getMonth() + 1)
  }, [getMonthScore, koaPoints])

  const getDayScore = useCallback((kidId, dateStr) => {
    if (kidId === 'koa') return koaPoints
    const day = (chores[kidId] || {})[dateStr] || {}
    let total = 0
    for (const [section, sectionData] of Object.entries(day)) {
      const pts = SECTION_POINTS[section] || 5
      for (const done of Object.values(sectionData)) {
        if (done) total += pts
      }
    }
    return total
  }, [chores, koaPoints])

  const resetHistory = useCallback(() => {
    const clean = DEFAULT_DATA
    setEvents([])
    setChores({})
    setCustomChores(DEFAULT_CUSTOM)
    setKoaPoints(0)
    setBonusPoints({})
    persist(clean)
  }, [fbOk])

  return {
    ready, fbOk,
    events, addEvent, updateEvent, deleteEvent,
    chores, toggleChore,
    customChores, addCustomChore, removeCustomChore,
    koaPoints, addKoaPoints,
    bonusPoints, addBonusPoints,
    getScore, getDayScore, getMonthScore,
    resetHistory,
  }
}
