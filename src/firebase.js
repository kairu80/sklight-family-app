import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBz3wz9hu-B8GBq3tQ5Dy--giv2jWGZFLk",
  authDomain: "skylight-family.firebaseapp.com",
  projectId: "skylight-family",
  storageBucket: "skylight-family.firebasestorage.app",
  messagingSenderId: "21651200147",
  appId: "1:21651200147:web:70efcd8eae029256d2d566",
  databaseURL: "https://skylight-family-default-rtdb.firebaseio.com",
}

let _db = null

export function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig)
    _db = getDatabase(app)
    return true
  } catch (e) {
    console.error('Firebase init failed', e)
    return false
  }
}

export function getDB() { return _db }
export function isConfigured() { return true }
export function saveConfig() {}
export function clearConfig() {}
