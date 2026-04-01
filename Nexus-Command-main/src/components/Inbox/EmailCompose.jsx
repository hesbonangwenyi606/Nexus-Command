import React, { useState } from 'react'
import { useApp } from '../../App'

export default function EmailCompose({ accounts, defaults, onClose, onSent }) {
  const { addNotification } = useApp()
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const [to, setTo] = useState(defaults?.to || '')
  const [subject, setSubject] = useState(defaults?.subject || '')
  const [body, setBody] = useState(defaults?.body || '')
  const [attachments, setAttachments] = useState([])
  const [sending, setSending] = useState(false)

  async function addAttachment() {
    const result = await window.electronAPI.openDialog({
      filters: [{ name: 'All Files', extensions: ['*'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const name = filePath.split(/[\\/]/).pop()
      setAttachments(prev => [...prev, { path: filePath, filename: name }])
    }
  }

  async function handleSend() {
    if (!to || !subject) {
      addNotification('Please fill in To and Subject fields.', 'error')
      return
    }
    const account = accounts.find(a => a.id == selectedAccountId)
    if (!account) {
      addNotification('Please select an account.', 'error')
      return
    }

    setSending(true)
    try {
      const result = await window.electronAPI.sendEmail({
        account: {
          name: account.name,
          email: account.email,
          username: account.username,
          password: account.password_enc,
          smtp_host: account.smtp_host,
          smtp_port: account.smtp_port
        },
        to,
        subject,
        body,
        attachments: attachments.map(a => ({ filename: a.filename, path: a.path }))
      })

      if (result.success) {
        addNotification('Email sent successfully!', 'success')
        onSent()
      } else {
        addNotification(`Send failed: ${result.error}`, 'error')
      }
    } catch (err) {
      addNotification(`Error: ${err.message}`, 'error')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 pb-4 px-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-slate-100">New Message</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 py-3 space-y-3">
          {accounts.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-12">From:</span>
              <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-100">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name || a.email}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-12">To:</span>
            <input type="email" value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com"
              className="flex-1 bg-transparent border-0 border-b border-slate-700 rounded-none px-0 py-1 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-12">Subject:</span>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
              className="flex-1 bg-transparent border-0 border-b border-slate-700 rounded-none px-0 py-1 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500" />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {a.filename}
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-red-400 ml-1">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Compose your message..."
            rows={8}
            className="w-full bg-transparent border-0 text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <button onClick={addAttachment} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach
            </button>
          </div>
          <button onClick={handleSend} disabled={sending}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {sending ? (
              <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg> Send</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
