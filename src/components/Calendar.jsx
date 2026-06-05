import React, { useState, useRef } from 'react'
import { DAYS_OF_WEEK, MONTHS, FAMILY_MEMBERS } from '../constants.js'
import EventModal from './EventModal.jsx'
import EventDetail from './EventDetail.jsx'
import { downloadICS, parseICS } from '../ical.js'

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr % 12 || 12}:${m}${hr >= 12 ? 'pm' : 'am'}`
}

function isEventOnDay(event, dateStr) {
  const { date, endDate, recurrence } = event
  const d     = new Date(dateStr + 'T00:00:00')
  const start = new Date(date   + 'T00:00:00')

  if (!recurrence || recurrence === 'none') {
    return dateStr >= date && dateStr <= (endDate || date)
  }
  if (d < start) return false

  const diffDays = Math.round((d - start) / 86400000)
  if (recurrence === 'daily')   return true
  if (recurrence === 'weekly')  return diffDays % 7 === 0
  if (recurrence === 'monthly') return d.getDate() === start.getDate()
  if (recurrence === 'yearly')
    return d.getDate() === start.getDate() && d.getMonth() === start.getMonth()
  return false
}

function getMember(memberIds) {
  if (!memberIds?.length) return null
  return FAMILY_MEMBERS.find(f => f.id === memberIds[0]) || null
}

export default function Calendar({ events, addEvent, updateEvent, deleteEvent }) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [modalDate, setModalDate] = useState(null)
  const [editEvent, setEditEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const importRef = useRef(null)

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  // ── Navigation ──────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // ── Grid ────────────────────────────────────────────
  const firstDay      = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev    = new Date(viewYear, viewMonth, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++)
    cells.push({ day: daysInPrev - firstDay + 1 + i, current: false, prev: true })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true })
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++)
    cells.push({ day: i, current: false, next: true })

  function cellDate(cell) {
    if (cell.current) return formatDate(viewYear, viewMonth, cell.day)
    if (cell.prev)    return formatDate(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1, cell.day)
    return formatDate(viewMonth === 11 ? viewYear + 1 : viewYear, viewMonth === 11 ? 0 : viewMonth + 1, cell.day)
  }

  // ── Handlers ────────────────────────────────────────
  function openAdd(dateStr, e) {
    e?.stopPropagation()
    setModalDate(dateStr)
    setEditEvent(null)
    setDetailEvent(null)
  }

  function openDetail(ev, e) {
    e?.stopPropagation()
    setDetailEvent(ev)
    setEditEvent(null)
    setModalDate(null)
  }

  function openEdit(ev) {
    setEditEvent(ev)
    setDetailEvent(null)
    setModalDate(null)
  }

  function handleSave(data) {
    if (editEvent) updateEvent(editEvent.id, data)
    else addEvent(data)
    setModalDate(null)
    setEditEvent(null)
  }

  function handleDelete(id) {
    deleteEvent(id)
    setDetailEvent(null)
    setEditEvent(null)
  }

  // ── ICS Import ──────────────────────────────────────
  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    const imported = parseICS(text)
    for (const ev of imported) addEvent(ev)
    e.target.value = ''
    alert(`Imported ${imported.length} event${imported.length !== 1 ? 's' : ''}!`)
  }

  return (
    <div className="calendar">
      {/* Header */}
      <div className="cal-header">
        <button className="btn btn-ghost small" onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}>
          Today
        </button>

        <div className="cal-nav">
          <button className="icon-btn large" onClick={prevMonth}>‹</button>
          <h1 className="cal-title">{MONTHS[viewMonth]} {viewYear}</h1>
          <button className="icon-btn large" onClick={nextMonth}>›</button>
        </div>

        <div className="cal-actions">
          <button className="btn btn-ghost small" onClick={() => importRef.current.click()} title="Import .ics file">
            📥 Import
          </button>
          <button className="btn btn-ghost small" onClick={() => downloadICS(events)} title="Export to iPhone / Google Calendar">
            📲 Export
          </button>
          <button className="btn btn-primary small" onClick={() => openAdd(todayStr)}>
            + Add
          </button>
          <input ref={importRef} type="file" accept=".ics" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      {/* Day labels */}
      <div className="cal-grid-header">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {cells.map((cell, idx) => {
          const dateStr   = cellDate(cell)
          const dayEvents = events.filter(e => isEventOnDay(e, dateStr))
          const isToday   = dateStr === todayStr

          return (
            <div
              key={idx}
              className={`cal-cell ${cell.current ? '' : 'faded'} ${isToday ? 'today' : ''}`}
              onClick={() => cell.current && openAdd(dateStr)}
            >
              <div className="cal-cell-top">
                <span className={`day-num ${isToday ? 'today-badge' : ''}`}>{cell.day}</span>
                {cell.current && (
                  <button className="add-event-btn" onClick={e => openAdd(dateStr, e)} title="Add event">+</button>
                )}
              </div>

              <div className="cal-events">
                {dayEvents.slice(0, 3).map(ev => {
                  const member = getMember(ev.members)
                  const color  = member?.color || '#8b5cf6'
                  return (
                    <div
                      key={ev.id}
                      className="cal-event-pill"
                      style={{ background: `${color}22`, borderLeft: `3px solid ${color}`, color, boxShadow: `0 0 8px ${color}44` }}
                      onClick={e => openDetail(ev, e)}
                      title={ev.title}
                    >
                      {!ev.allDay && ev.startTime && (
                        <span className="event-time">
                          {formatTime(ev.startTime)}{ev.endTime ? `–${formatTime(ev.endTime)}` : ''}
                        </span>
                      )}
                      <span className="event-title-text">{ev.title}</span>
                      {ev.recurrence && ev.recurrence !== 'none' && (
                        <span className="recur-icon">↻</span>
                      )}
                    </div>
                  )
                })}
                {dayEvents.length > 3 && (
                  <div className="more-events">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="legend">
        {FAMILY_MEMBERS.map(m => (
          <div key={m.id} className="legend-item">
            <span className="legend-dot" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
            <span>{m.name}</span>
          </div>
        ))}
      </div>

      {/* Modals */}
      {detailEvent && (
        <EventDetail
          event={detailEvent}
          onEdit={openEdit}
          onDelete={handleDelete}
          onClose={() => setDetailEvent(null)}
        />
      )}
      {(modalDate || editEvent) && (
        <EventModal
          date={modalDate || editEvent?.date}
          event={editEvent}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setModalDate(null); setEditEvent(null) }}
        />
      )}
    </div>
  )
}
