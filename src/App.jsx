import React, { useState } from 'react'
import Calendar from './components/Calendar.jsx'
import Chores from './components/Chores.jsx'
import Stars from './components/Stars.jsx'
import MonthlyChampion from './components/MonthlyChampion.jsx'
import FirebaseSetup from './components/FirebaseSetup.jsx'
import { useStore } from './useStore.js'
import { isConfigured } from './firebase.js'

export default function App() {
  const [view, setView] = useState('calendar')
  // null = undecided, 'setup' = show setup, 'ready' = skip setup
  const [setupState, setSetupState] = useState(() =>
    isConfigured() ? 'ready' : null
  )
  const store = useStore()

  // First visit: show choice modal
  if (setupState === null) {
    return (
      <FirebaseSetup
        onDone={() => { window.location.reload() }}
        onSkip={() => setSetupState('ready')}
      />
    )
  }

  return (
    <div className="app">
      <Stars />

      <nav className="app-nav">
        <div className="app-brand">
          <span className="brand-icon">🌟</span>
          <span className="brand-name">Sklight Family</span>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={`nav-tab ${view === 'chores' ? 'active' : ''}`}
            onClick={() => setView('chores')}
          >
            ✅ Chores
          </button>
        </div>
        {/* Cloud sync status indicator */}
        {store.ready && (
          <div
            title={store.fbOk ? 'Syncing to cloud' : 'Local only — click to configure cloud sync'}
            onClick={() => !store.fbOk && setSetupState(null)}
            style={{
              marginLeft: 'auto', cursor: store.fbOk ? 'default' : 'pointer',
              fontSize: '1rem', opacity: 0.7,
            }}
          >
            {store.fbOk ? '☁️' : '💾'}
          </div>
        )}
      </nav>

      <main className="app-main">
        {!store.ready ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p>Loading family data…</p>
          </div>
        ) : view === 'calendar' ? (
          <Calendar
            events={store.events}
            addEvent={store.addEvent}
            updateEvent={store.updateEvent}
            deleteEvent={store.deleteEvent}
          />
        ) : (
          <Chores
            chores={store.chores}
            toggleChore={store.toggleChore}
            customChores={store.customChores}
            addCustomChore={store.addCustomChore}
            removeCustomChore={store.removeCustomChore}
            getScore={store.getScore}
            getDayScore={store.getDayScore}
            getMonthScore={store.getMonthScore}
            koaPoints={store.koaPoints}
            addKoaPoints={store.addKoaPoints}
            addBonusPoints={store.addBonusPoints}
          />
        )}
      </main>

      {store.ready && (
        <MonthlyChampion getMonthScore={store.getMonthScore} />
      )}
    </div>
  )
}
