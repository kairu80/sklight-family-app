import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { networkInterfaces } from 'os'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data.json')

const DEFAULT_CUSTOM = {
  kai:   { morning: [], afternoon: [], weekend: [], kindness: [] },
  janel: { morning: [], afternoon: [], weekend: [], kindness: [] },
  koa:   {},
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return { events: [], chores: {}, customChores: DEFAULT_CUSTOM, koaPoints: 0 }
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

function getLanIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

// ── Express ───────────────────────────────────────────

const app = express()
app.use(express.json())

// Always serve the built React app
const distPath = path.join(__dirname, 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
} else {
  app.get('/', (req, res) => {
    res.send('<h2>Run <code>npm run build</code> first, then restart.</h2>')
  })
}

// ── API routes ────────────────────────────────────────

app.get('/api/data', (req, res) => {
  res.json(readData())
})

app.post('/api/events', (req, res) => {
  const data = readData()
  const event = { ...req.body, id: Date.now().toString() }
  data.events.push(event)
  writeData(data)
  broadcast({ type: 'events', events: data.events })
  res.json(event)
})

app.put('/api/events/:id', (req, res) => {
  const data = readData()
  data.events = data.events.map(e =>
    e.id === req.params.id ? { ...e, ...req.body } : e
  )
  writeData(data)
  broadcast({ type: 'events', events: data.events })
  res.json({ ok: true })
})

app.delete('/api/events/:id', (req, res) => {
  const data = readData()
  data.events = data.events.filter(e => e.id !== req.params.id)
  writeData(data)
  broadcast({ type: 'events', events: data.events })
  res.json({ ok: true })
})

app.put('/api/chores', (req, res) => {
  const data = readData()
  data.chores = req.body
  writeData(data)
  broadcast({ type: 'chores', chores: data.chores })
  res.json({ ok: true })
})

app.put('/api/customchores', (req, res) => {
  const data = readData()
  data.customChores = req.body
  writeData(data)
  broadcast({ type: 'customChores', customChores: data.customChores })
  res.json({ ok: true })
})

app.put('/api/koapoints', (req, res) => {
  const data = readData()
  data.koaPoints = req.body.points || 0
  writeData(data)
  broadcast({ type: 'koaPoints', koaPoints: data.koaPoints })
  res.json({ ok: true })
})

app.put('/api/bonuspoints', (req, res) => {
  const data = readData()
  data.bonusPoints = req.body
  writeData(data)
  broadcast({ type: 'bonusPoints', bonusPoints: data.bonusPoints })
  res.json({ ok: true })
})

app.post('/api/reset', (req, res) => {
  const data = readData()
  data.chores = {}
  data.koaPoints = 0
  writeData(data)
  broadcast({ type: 'chores', chores: {} })
  broadcast({ type: 'koaPoints', koaPoints: 0 })
  res.json({ ok: true })
})

// SPA fallback — must come after API routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Not found — run npm run build first')
  }
})

// ── WebSocket ─────────────────────────────────────────

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })
const clients = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  ws.on('close', () => clients.delete(ws))
  ws.on('error', () => clients.delete(ws))
})

function broadcast(msg) {
  const str = JSON.stringify(msg)
  for (const client of clients) {
    if (client.readyState === 1) client.send(str)
  }
}

// ── Start ─────────────────────────────────────────────

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, '0.0.0.0', () => {
  const lan = getLanIP()
  console.log('\n  ╔══════════════════════════════════════════╗')
  console.log(`  ║   Sklight Family App is running!         ║`)
  console.log('  ╠══════════════════════════════════════════╣')
  console.log(`  ║  On this Mac:  http://localhost:${PORT}      ║`)
  console.log(`  ║  On iPhone:   http://${lan}:${PORT}   ║`)
  console.log('  ╚══════════════════════════════════════════╝\n')
})
