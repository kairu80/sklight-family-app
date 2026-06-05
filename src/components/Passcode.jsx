import React, { useState, useEffect } from 'react'

const PASSCODE = '1985'

export default function Passcode({ onUnlock, onClose, sectionLabel }) {
  const [input, setInput] = useState('')
  const [shake, setShake]   = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit() {
    if (input === PASSCODE) {
      onUnlock()
    } else {
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="passcode-overlay" onClick={onClose}>
      <div className="passcode-dialog" onClick={e => e.stopPropagation()}>
        <div className="passcode-icon">🔐</div>
        <h3 className="passcode-title">Parent Unlock</h3>
        <p className="passcode-subtitle">
          {sectionLabel ? `Unlock ${sectionLabel} chores` : 'Enter parent passcode'}
        </p>
        <input
          className={`passcode-input ${shake ? 'shake' : ''}`}
          type="password"
          inputMode="numeric"
          placeholder="Enter passcode"
          value={input}
          autoFocus
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <div className="passcode-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!input}>Unlock</button>
        </div>
      </div>
    </div>
  )
}
