import React, { useState } from 'react'
import { saveConfig, clearConfig } from '../firebase.js'

export default function FirebaseSetup({ onDone, onSkip }) {
  const [step, setStep] = useState('intro') // intro | paste | done
  const [raw, setRaw]   = useState('')
  const [err, setErr]   = useState('')

  function parseConfig(text) {
    // Accept raw JS snippet or plain JSON
    try {
      // Try JSON first
      return JSON.parse(text)
    } catch {
      // Extract object literal from firebaseConfig = { ... }
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        // Convert JS object literal to JSON
        const jsonStr = match[0]
          .replace(/\/\/[^\n]*/g, '')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        try { return JSON.parse(jsonStr) } catch {}
      }
      return null
    }
  }

  function handleSave() {
    const cfg = parseConfig(raw)
    if (!cfg || !cfg.apiKey || !cfg.projectId || !cfg.databaseURL) {
      setErr('Could not parse config — make sure you included the full firebaseConfig block including databaseURL.')
      return
    }
    saveConfig(cfg)
    onDone()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a1a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#13132a', border: '1px solid #2a2a5a', borderRadius: '1rem',
        padding: '2rem', maxWidth: '560px', width: '100%', color: '#e2e8f0',
        boxShadow: '0 0 40px rgba(99,102,241,0.15)',
      }}>
        <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>🌟</div>
        <h1 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Sklight Family App
        </h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          One-time cloud setup — takes about 5 minutes
        </p>

        {step === 'intro' && (
          <>
            <div style={{ background: '#1e1e3f', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.7 }}>
              <strong style={{ color: '#818cf8' }}>Why this step?</strong><br />
              The app needs a free Firebase database so your family's data syncs across all phones, tablets, and computers in real time.<br /><br />
              <strong style={{ color: '#818cf8' }}>Steps:</strong><br />
              1. Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>console.firebase.google.com</a><br />
              2. Click <em>"Add project"</em> → name it <code style={{ background: '#0f0f2e', padding: '0 4px', borderRadius: 3 }}>sklight-family</code> → Continue<br />
              3. Disable Google Analytics (optional) → <em>"Create project"</em><br />
              4. Click the web icon (<strong>&lt;/&gt;</strong>) → register app → copy the <code style={{ background: '#0f0f2e', padding: '0 4px', borderRadius: 3 }}>firebaseConfig</code> object<br />
              5. In the left sidebar go to <em>Build → Realtime Database → Create database → Start in test mode</em><br />
              6. Paste the config below
            </div>
            <button
              onClick={() => setStep('paste')}
              style={{
                width: '100%', padding: '0.75rem', background: '#4f46e5', color: '#fff',
                border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
              }}
            >
              I created the project → Paste config
            </button>
            <button
              onClick={onSkip}
              style={{
                width: '100%', marginTop: '0.5rem', padding: '0.6rem',
                background: 'transparent', color: '#64748b', border: '1px solid #2a2a5a',
                borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              Skip for now (saves to this device only)
            </button>
          </>
        )}

        {step === 'paste' && (
          <>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Paste your <code>firebaseConfig</code> object here:
            </p>
            <textarea
              value={raw}
              onChange={e => { setRaw(e.target.value); setErr('') }}
              rows={10}
              placeholder={`const firebaseConfig = {\n  apiKey: "AIza...",\n  authDomain: "sklight-family.firebaseapp.com",\n  databaseURL: "https://sklight-family-default-rtdb.firebaseio.com",\n  projectId: "sklight-family",\n  storageBucket: "sklight-family.appspot.com",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
              style={{
                width: '100%', boxSizing: 'border-box', background: '#0f0f2e',
                border: `1px solid ${err ? '#f87171' : '#2a2a5a'}`, borderRadius: '0.5rem',
                color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.8rem',
                padding: '0.75rem', resize: 'vertical',
              }}
            />
            {err && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.4rem' }}>{err}</p>}
            <button
              onClick={handleSave}
              style={{
                width: '100%', marginTop: '0.75rem', padding: '0.75rem',
                background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
              }}
            >
              Save & Connect
            </button>
            <button
              onClick={() => setStep('intro')}
              style={{
                width: '100%', marginTop: '0.4rem', padding: '0.5rem',
                background: 'transparent', color: '#64748b', border: 'none',
                cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
