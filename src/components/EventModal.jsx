import React, { useState } from 'react'
import { FAMILY_MEMBERS, RECURRENCE_OPTIONS } from '../constants.js'

export default function EventModal({ date, event, onSave, onDelete, onClose }) {
  const isEditing = !!event

  const [title,      setTitle]      = useState(event?.title      || '')
  const [date_,      setDate]       = useState(event?.date       || date || '')
  const [endDate,    setEndDate]    = useState(event?.endDate    || '')
  const [startTime,  setStartTime]  = useState(event?.startTime  || '')
  const [endTime,    setEndTime]    = useState(event?.endTime    || '')
  const [members,    setMembers]    = useState(event?.members    || [])
  const [recurrence, setRecurrence] = useState(event?.recurrence || 'none')
  const [note,       setNote]       = useState(event?.note       || '')
  const [allDay,     setAllDay]     = useState(event?.allDay !== false)

  function toggleMember(id) {
    setMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  function handleSave() {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      date: date_,
      endDate,
      startTime: allDay ? '' : startTime,
      endTime:   allDay ? '' : endTime,
      members,
      recurrence,
      note,
      allDay,
    })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Event' : 'New Event'}</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field">
            <input
              className="input-title"
              placeholder="Event title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field row">
            <div className="field-group">
              <label>Start date</label>
              <input type="date" className="input" value={date_} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label>End date</label>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="field align-center">
            <label className="checkbox-label">
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
              All day
            </label>
          </div>

          {!allDay && (
            <div className="field row">
              <div className="field-group">
                <label>Start time</label>
                <input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="field-group">
                <label>End time</label>
                <input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <div className="field">
            <label>Repeats</label>
            <select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
              {RECURRENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Family members</label>
            <div className="member-chips">
              {FAMILY_MEMBERS.map(m => (
                <button
                  key={m.id}
                  className={`member-chip ${members.includes(m.id) ? 'selected' : ''}`}
                  style={members.includes(m.id)
                    ? { background: `${m.color}28`, color: m.color, borderColor: m.color }
                    : { borderColor: `${m.color}55`, color: m.color }
                  }
                  onClick={() => toggleMember(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Note</label>
            <textarea
              className="input"
              placeholder="Optional note…"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="modal-footer">
          {isEditing && (
            <button className="btn btn-danger" onClick={() => onDelete(event.id)}>Delete</button>
          )}
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
            {isEditing ? 'Save changes' : 'Add event'}
          </button>
        </div>
      </div>
    </div>
  )
}
