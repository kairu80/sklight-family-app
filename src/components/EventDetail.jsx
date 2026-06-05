import React from 'react'
import { FAMILY_MEMBERS, RECURRENCE_OPTIONS, MONTHS } from '../constants.js'

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}

function formatDateRange(date, endDate) {
  const fmt = (str) => {
    const [y, m, d] = str.split('-')
    return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`
  }
  if (!endDate || endDate === date) return fmt(date)
  return `${fmt(date)} – ${fmt(endDate)}`
}

export default function EventDetail({ event, onEdit, onDelete, onClose }) {
  const members = FAMILY_MEMBERS.filter(m => (event.members || []).includes(m.id))

  const recLabel = RECURRENCE_OPTIONS.find(r => r.value === (event.recurrence || 'none'))?.label

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal detail-modal">
        <div className="detail-header">
          <div className="detail-color-bar" style={{
            background: members[0]?.color || '#8b5cf6',
            boxShadow: `0 0 16px ${members[0]?.color || '#8b5cf6'}`,
          }} />
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="detail-body">
          <h2 className="detail-title">{event.title}</h2>

          <div className="detail-row">
            <span className="detail-icon">📅</span>
            <div>
              <div className="detail-value">{formatDateRange(event.date, event.endDate)}</div>
              {!event.allDay && event.startTime && (
                <div className="detail-subvalue">
                  {formatTime(event.startTime)}
                  {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
                </div>
              )}
              {event.allDay && <div className="detail-subvalue">All day</div>}
            </div>
          </div>

          {recLabel && recLabel !== 'Does not repeat' && (
            <div className="detail-row">
              <span className="detail-icon">↻</span>
              <div className="detail-value">{recLabel}</div>
            </div>
          )}

          {members.length > 0 && (
            <div className="detail-row">
              <span className="detail-icon">👥</span>
              <div className="detail-chips">
                {members.map(m => (
                  <span
                    key={m.id}
                    className="detail-chip"
                    style={{ color: m.color, borderColor: m.color, background: m.bg, boxShadow: `0 0 8px ${m.color}55` }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.note && (
            <div className="detail-row">
              <span className="detail-icon">📝</span>
              <div className="detail-value detail-note">{event.note}</div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => onDelete(event.id)}>Delete</button>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => onEdit(event)}>Edit</button>
        </div>
      </div>
    </div>
  )
}
