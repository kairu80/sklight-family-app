import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Firebase config is stored in localStorage after first-time setup.
// To configure, visit the app and click the setup gear icon.
function getConfig() {
  try {
    const raw = localStorage.getItem('sklightFirebaseConfig')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

let _app = null
let _db  = null

export function initFirebase() {
  const cfg = getConfig()
  if (!cfg) return false
  try {
    _app = initializeApp(cfg)
    _db  = getDatabase(_app)
    return true
  } catch (e) {
    console.error('Firebase init failed', e)
    return false
  }
}

export function getDB() { return _db }
export function isConfigured() { return !!getConfig() }

export function saveConfig(cfg) {
  localStorage.setItem('sklightFirebaseConfig', JSON.stringify(cfg))
}

export function clearConfig() {
  localStorage.removeItem('sklightFirebaseConfig')
  _app = null
  _db  = null
}
