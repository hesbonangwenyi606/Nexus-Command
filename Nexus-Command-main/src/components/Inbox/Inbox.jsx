import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'
import EmailList from './EmailList'
import EmailCompose from './EmailCompose'

function AddAccountModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', email: '', username: '', password: '',
    imap_host: '', imap_port: 993, smtp_host: '', smtp_port: 587,
    provider: 'generic'
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const providers = {
    gmail: { imap_host: 'imap.gmail.com', imap_port: 993, smtp_host: 'smtp.gmail.com', smtp_port: 587 },
    outlook: { imap_host: 'outlook.office365.com', imap_port: 993, smtp_host: 'smtp.office365.com', smtp_port: 587 },
    yahoo: { imap_host: 'imap.mail.yahoo.com', imap_port: 993, smtp_host: 'smtp.mail.yahoo.com', smtp_port: 587 },
    generic: {}
  }

  function selectProvider(p) {
    const config = providers[p] || {}
    setForm(f => ({ ...f, provider: p, ...config }))
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await window.electronAPI.fetchIMAP({
        username: form.username,
        password: form.password,
        imap_host: form.imap_host,
        imap_port: form.imap_port
      })
      setTestResult(result.success ? { ok: true, msg: 'Connected successfully!' } : { ok: false, msg: result.error })
    } catch (err) {
      setTestResult({ ok: false, msg: err.message })
    }
    setTesting(false)
  }

  async function handleSave() {
    if (!form.email || !form.username) return
    await dbRun(
      'INSERT INTO email_accounts (name, email, provider, imap_host, imap_port, smtp_host, smtp_port, username, password_enc) VALUES (?,?,?,?,?,?,?,?,?)',
      [form.name || form.email, form.email, form.provider, form.imap_host, form.imap_port, form.smtp_host, form.smtp_port, form.username, form.password]
    )
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 w-[520px] border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Add Email Account</h3>

        <div className="flex gap-2 mb-4">
          {['gmail','outlook','yahoo','generic'].map(p => (
            <button key={p} onClick={() => selectProvider(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${form.provider === p ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Display Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Work Email" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Username</label>
              <input type="text" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} placeholder="username or email" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password / App Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">IMAP Host</label>
              <input type="text" value={form.imap_host} onChange={e => setForm(f => ({...f, imap_host: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">IMAP Port</label>
              <input type="number" value={form.imap_port} onChange={e => setForm(f => ({...f, imap_port: parseInt(e.target.value)}))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">SMTP Host</label>
              <input type="text" value={form.smtp_host} onChange={e => setForm(f => ({...f, smtp_host: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SMTP Port</label>
              <input type="number" value={form.smtp_port} onChange={e => setForm(f => ({...f, smtp_port: parseInt(e.target.value)}))} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
        </div>

        {testResult && (
          <div className={`mt-3 p-2 rounded text-xs ${testResult.ok ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-700'}`}>
            {testResult.msg}
          </div>
        )}

        <div className="flex justify-between mt-5">
          <button onClick={testConnection} disabled={testing} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors disabled:opacity-50">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">Save Account</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Inbox() {
  const { addNotification } = useApp()
  const [accounts, setAccounts] = useState([])
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [composeDefaults, setComposeDefaults] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadAccounts()
    loadEmails()
  }, [])

  async function loadAccounts() {
    const rows = await dbGetAll('email_accounts')
    setAccounts(rows)
  }

  async function loadEmails() {
    const rows = await dbQuery('SELECT * FROM emails ORDER BY date DESC LIMIT 200', [])
    setEmails(rows)
  }

  async function syncAccount(account) {
    setSyncing(true)
    try {
      const result = await window.electronAPI.fetchIMAP({
        username: account.username,
        password: account.password_enc,
        imap_host: account.imap_host,
        imap_port: account.imap_port
      })

      if (result.success) {
        for (const email of result.emails) {
          try {
            await dbRun(
              'INSERT OR IGNORE INTO emails (account_id, message_id, subject, from_address, from_name, to_address, body_text, body_html, date, folder) VALUES (?,?,?,?,?,?,?,?,?,?)',
              [account.id, email.message_id, email.subject, email.from_address, email.from_name, email.to_address, email.body_text, email.body_html, email.date, email.folder]
            )
          } catch (e) { /* duplicate, skip */ }
        }
        addNotification(`Synced ${result.emails.length} emails from ${account.email}`, 'success')
        loadEmails()
      } else {
        addNotification(`Sync failed: ${result.error}`, 'error')
      }
    } catch (err) {
      addNotification(`Sync error: ${err.message}`, 'error')
    }
    setSyncing(false)
  }

  async function markRead(email) {
    await dbRun('UPDATE emails SET is_read = 1 WHERE id = ?', [email.id])
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: 1 } : e))
  }

  async function removeAccount(id) {
    await dbRun('DELETE FROM email_accounts WHERE id = ?', [id])
    loadAccounts()
  }

  function handleReply(email) {
    setComposeDefaults({
      to: email.from_address,
      subject: `Re: ${email.subject}`,
      body: `\n\n--- Original message ---\nFrom: ${email.from_name} <${email.from_address}>\n\n${email.body_text}`
    })
    setShowCompose(true)
  }

  function handleForward(email) {
    setComposeDefaults({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${email.from_name} <${email.from_address}>\n${email.body_text}`
    })
    setShowCompose(true)
  }

  const filteredEmails = emails.filter(e => {
    if (filter === 'unread' && e.is_read) return false
    if (filter === 'replied' && !e.is_replied) return false
    if (search) {
      const s = search.toLowerCase()
      return (e.subject || '').toLowerCase().includes(s) ||
             (e.from_name || '').toLowerCase().includes(s) ||
             (e.from_address || '').toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div className="flex h-full">
      {/* Accounts sidebar */}
      <div className="w-48 bg-slate-900 border-r border-slate-800 flex flex-col p-3 gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accounts</span>
          <button onClick={() => setShowAddAccount(true)} className="text-blue-400 hover:text-blue-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setSelectedAccount(null)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${!selectedAccount ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          All Inboxes
        </button>

        {accounts.map(acc => (
          <div key={acc.id} className="group relative">
            <button
              onClick={() => setSelectedAccount(acc)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${selectedAccount?.id === acc.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="truncate">{acc.name || acc.email}</span>
            </button>
            <div className="absolute top-0 right-0 hidden group-hover:flex gap-1 pr-1 pt-1">
              <button onClick={() => syncAccount(acc)} className="text-slate-400 hover:text-blue-400 text-xs" title="Sync">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => removeAccount(acc.id)} className="text-slate-400 hover:text-red-400 text-xs" title="Remove">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <p className="text-xs text-slate-600 text-center mt-4">No accounts yet</p>
        )}

        <div className="mt-auto">
          <button
            onClick={() => { setComposeDefaults(null); setShowCompose(true) }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Compose
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="w-80 border-r border-slate-800 flex flex-col">
        {/* Filter bar */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500"
          />
          <div className="flex gap-1">
            {[['all','All'],['unread','Unread'],['replied','Replied']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`flex-1 py-1 text-xs rounded-md transition-colors ${filter === v ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No emails found</p>
              {accounts.length === 0 && <p className="text-xs">Add an email account to get started</p>}
            </div>
          ) : (
            <EmailList
              emails={filteredEmails}
              selectedEmail={selectedEmail}
              onSelect={email => { setSelectedEmail(email); markRead(email) }}
            />
          )}
        </div>
      </div>

      {/* Email reading pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEmail ? (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-100 flex-1 pr-4">{selectedEmail.subject || '(No Subject)'}</h2>
                <div className="flex gap-2">
                  <button onClick={() => handleReply(selectedEmail)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
                  <button onClick={() => handleForward(selectedEmail)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
                    Forward
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span><strong className="text-slate-300">{selectedEmail.from_name || selectedEmail.from_address}</strong></span>
                <span>{selectedEmail.from_address}</span>
                <span className="ml-auto">{selectedEmail.date ? new Date(selectedEmail.date).toLocaleString() : ''}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {selectedEmail.body_html ? (
                <div className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
              ) : (
                <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedEmail.body_text || '(Empty email)'}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p>Select an email to read</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddAccount && (
        <AddAccountModal
          onClose={() => setShowAddAccount(false)}
          onSave={() => { setShowAddAccount(false); loadAccounts() }}
        />
      )}

      {showCompose && (
        <EmailCompose
          accounts={accounts}
          defaults={composeDefaults}
          onClose={() => { setShowCompose(false); setComposeDefaults(null) }}
          onSent={() => { setShowCompose(false); setComposeDefaults(null); loadEmails() }}
        />
      )}
    </div>
  )
}
