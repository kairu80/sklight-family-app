/**
 * iCalendar (.ics) export AND import utilities.
 */

const RECUR_MAP = {
  daily:   'FREQ=DAILY',
  weekly:  'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
  yearly:  'FREQ=YEARLY',
}

// ── Export ────────────────────────────────────────────

function toICalDate(dateStr) {
  return dateStr.replace(/-/g, '')
}

function toICalDateTime(dateStr, timeStr) {
  const base = dateStr.replace(/-/g, '')
  const t = timeStr ? timeStr.replace(':', '') + '00' : '000000'
  return `${base}T${t}`
}

function escapeText(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sklight Family//Sklight Family App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Sklight Family',
  ]

  for (const ev of events) {
    const uid = `${ev.id}@sklight-family`
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${now}Z`)
    lines.push(`SUMMARY:${escapeText(ev.title)}`)
    if (ev.note) lines.push(`DESCRIPTION:${escapeText(ev.note)}`)

    if (ev.allDay !== false || (!ev.startTime && !ev.endTime)) {
      lines.push(`DTSTART;VALUE=DATE:${toICalDate(ev.date)}`)
      const endDate = ev.endDate || ev.date
      const end = new Date(endDate + 'T00:00:00')
      end.setDate(end.getDate() + 1)
      lines.push(`DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, '')}`)
    } else {
      lines.push(`DTSTART:${toICalDateTime(ev.date, ev.startTime)}`)
      lines.push(`DTEND:${toICalDateTime(ev.endDate || ev.date, ev.endTime || ev.startTime)}`)
    }

    if (ev.recurrence && ev.recurrence !== 'none' && RECUR_MAP[ev.recurrence]) {
      lines.push(`RRULE:${RECUR_MAP[ev.recurrence]}`)
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(events, filename = 'sklight-family.ics') {
  const content = generateICS(events)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Import ────────────────────────────────────────────

function parseProp(line) {
  // Split "KEY;PARAM=VAL:value" into { name, params, value }
  const colon = line.indexOf(':')
  if (colon === -1) return null
  const keyPart = line.slice(0, colon)
  const value = line.slice(colon + 1)
  const semi = keyPart.indexOf(';')
  const name = (semi === -1 ? keyPart : keyPart.slice(0, semi)).toUpperCase()
  return { name, value }
}

function icsDateToStr(raw) {
  // raw is like 20260414 or 20260414T090000 or 20260414T090000Z
  const d = raw.replace(/[TZ]/g, '').slice(0, 8)
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

function icsTimeToStr(raw) {
  if (!raw.includes('T')) return ''
  const t = raw.replace(/Z$/, '').split('T')[1]
  return `${t.slice(0, 2)}:${t.slice(2, 4)}`
}

export function parseICS(text) {
  // Unfold continuation lines
  const unfolded = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')

  const events = []
  let current = null

  for (const line of unfolded.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === 'BEGIN:VEVENT') {
      current = {}
    } else if (trimmed === 'END:VEVENT' && current) {
      const ev = buildEvent(current)
      if (ev) events.push(ev)
      current = null
    } else if (current) {
      const prop = parseProp(trimmed)
      if (prop) current[prop.name] = prop.value
    }
  }

  return events
}

function buildEvent(raw) {
  const dtstart = raw['DTSTART'] || ''
  const dtend   = raw['DTEND']   || ''
  const summary = raw['SUMMARY'] || 'Imported Event'
  const desc    = raw['DESCRIPTION'] || ''
  const rrule   = raw['RRULE'] || ''

  if (!dtstart) return null

  const isAllDay = !dtstart.includes('T')

  const date    = icsDateToStr(dtstart)
  const rawEnd  = dtend ? icsDateToStr(dtend) : date
  let endDate   = ''

  if (isAllDay) {
    // iCal all-day DTEND is exclusive — subtract one day
    const e = new Date(rawEnd + 'T00:00:00')
    e.setDate(e.getDate() - 1)
    const fixed = e.toISOString().slice(0, 10)
    endDate = fixed !== date ? fixed : ''
  } else {
    endDate = rawEnd !== date ? rawEnd : ''
  }

  const startTime = isAllDay ? '' : icsTimeToStr(dtstart)
  const endTime   = isAllDay ? '' : icsTimeToStr(dtend)

  let recurrence = 'none'
  if (rrule.includes('FREQ=DAILY'))   recurrence = 'daily'
  else if (rrule.includes('FREQ=WEEKLY'))  recurrence = 'weekly'
  else if (rrule.includes('FREQ=MONTHLY')) recurrence = 'monthly'
  else if (rrule.includes('FREQ=YEARLY'))  recurrence = 'yearly'

  return {
    title: summary.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\\\/g, '\\'),
    note:  desc.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\\\/g, '\\'),
    date,
    endDate,
    startTime,
    endTime,
    allDay: isAllDay,
    recurrence,
    members: [],
  }
}
