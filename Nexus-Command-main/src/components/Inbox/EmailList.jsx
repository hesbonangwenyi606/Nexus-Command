import React from 'react'

export default function EmailList({ emails, selectedEmail, onSelect }) {
  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const dayMs = 24 * 60 * 60 * 1000

    if (diff < dayMs) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (diff < 7 * dayMs) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  function getInitials(name, email) {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    if (email) return email[0].toUpperCase()
    return '?'
  }

  function avatarColor(str) {
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-red-600', 'bg-yellow-600', 'bg-pink-600', 'bg-cyan-600']
    let hash = 0
    for (const c of (str || '')) hash = ((hash << 5) - hash) + c.charCodeAt(0)
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div className="divide-y divide-slate-800">
      {emails.map(email => (
        <button
          key={email.id}
          onClick={() => onSelect(email)}
          className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors
            ${selectedEmail?.id === email.id ? 'bg-slate-800 border-l-2 border-blue-500' : ''}
            ${!email.is_read ? 'bg-slate-800/30' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full ${avatarColor(email.from_address)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5`}>
              {getInitials(email.from_name, email.from_address)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
                  {email.from_name || email.from_address || 'Unknown'}
                </span>
                <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatDate(email.date)}</span>
              </div>
              <p className={`text-sm truncate mb-0.5 ${!email.is_read ? 'font-medium text-slate-200' : 'text-slate-400'}`}>
                {email.subject || '(No Subject)'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {(email.body_text || '').slice(0, 80)}
              </p>
            </div>
          </div>
          {!email.is_read && (
            <div className="flex justify-end mt-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
