import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, getSetting, setSetting, getProfile, updateProfile } from '../../database/db'

function Section({ title, children }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm text-slate-200">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-700'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function Settings() {
  const { profile, addNotification, lock, refreshProfile } = useApp()

  // Profile
  const [profileForm, setProfileForm] = useState({ name: '', avatar_path: '', background_path: '' })
  const [profileSaving, setProfileSaving] = useState(false)

  // Password
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  // Email accounts
  const [emailAccounts, setEmailAccounts] = useState([])
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailForm, setEmailForm] = useState({ name: '', email: '', provider: 'gmail', imap_host: '', imap_port: '993', smtp_host: '', smtp_port: '587', username: '', password_enc: '' })

  // Analytics settings
  const [trackingEnabled, setTrackingEnabled] = useState(true)
  const [idleTimeout, setIdleTimeout] = useState('5')

  // App settings
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    // Profile
    const p = await getProfile()
    if (p) setProfileForm({ name: p.name || '', avatar_path: p.avatar_path || '', background_path: p.background_path || '' })

    // Email accounts
    const accounts = await dbQuery('SELECT * FROM email_accounts', [])
    setEmailAccounts(accounts)

    // Analytics settings
    const trackRow = await dbQuery("SELECT value FROM analytics_settings WHERE key = 'tracking_enabled'", [])
    setTrackingEnabled(trackRow[0]?.value !== '0')
    const idleRow = await dbQuery("SELECT value FROM analytics_settings WHERE key = 'idle_timeout'", [])
    setIdleTimeout(idleRow[0]?.value || '5')

    // App version
    if (window.electronAPI) {
      const data = await window.electronAPI.getAppData()
      setAppVersion(data?.version || '1.0.0')
    }
  }

  async function saveProfile() {
    setProfileSaving(true)
    try {
      await updateProfile(profileForm)
      await refreshProfile()
      addNotification('Profile updated!', 'success')
    } catch (err) {
      addNotification('Failed to update profile', 'error')
    } finally {
      setProfileSaving(false)
    }
  }

  async function pickAvatar() {
    if (!window.electronAPI) return
    const result = await window.electronAPI.openDialog({ filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','gif','webp'] }] })
    const filePath = result?.filePaths?.[0]
    if (filePath) setProfileForm(f => ({ ...f, avatar_path: filePath }))
  }

  async function pickBackground() {
    if (!window.electronAPI) return
    const result = await window.electronAPI.openDialog({ filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','gif','webp'] }] })
    const filePath = result?.filePaths?.[0]
    if (filePath) setProfileForm(f => ({ ...f, background_path: filePath }))
  }

  async function changePassword() {
    setPwError('')
    if (!pwForm.current || !pwForm.newPw) { setPwError('Fill in all fields'); return }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('New passwords do not match'); return }
    if (pwForm.newPw.length < 8) { setPwError('Password must be at least 8 characters'); return }

    setPwLoading(true)
    try {
      const result = await window.electronAPI.changePassword(pwForm.current, pwForm.newPw)
      if (result.success) {
        addNotification('Password changed! Please log in again.', 'success')
        setPwForm({ current: '', newPw: '', confirm: '' })
        setTimeout(() => lock(), 1500)
      } else {
        setPwError(result.error || 'Incorrect current password')
      }
    } catch (err) {
      setPwError('Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  async function saveEmailAccount() {
    const { name, email, provider, imap_host, imap_port, smtp_host, smtp_port, username, password_enc } = emailForm
    if (!email || !username || !password_enc) {
      addNotification('Email, username and password are required', 'error')
      return
    }
    await dbRun(
      'INSERT INTO email_accounts (name, email, provider, imap_host, imap_port, smtp_host, smtp_port, username, password_enc, active) VALUES (?,?,?,?,?,?,?,?,?,1)',
      [name || email, email, provider, imap_host, parseInt(imap_port), smtp_host, parseInt(smtp_port), username, password_enc]
    )
    addNotification('Email account added!', 'success')
    setShowEmailForm(false)
    setEmailForm({ name: '', email: '', provider: 'gmail', imap_host: '', imap_port: '993', smtp_host: '', smtp_port: '587', username: '', password_enc: '' })
    loadAll()
  }

  async function removeEmailAccount(id) {
    if (!confirm('Remove this email account?')) return
    await dbRun('DELETE FROM email_accounts WHERE id = ?', [id])
    addNotification('Account removed', 'info')
    loadAll()
  }

  async function toggleTracking(val) {
    await dbRun('INSERT OR REPLACE INTO analytics_settings (key, value) VALUES (?, ?)', ['tracking_enabled', val ? '1' : '0'])
    setTrackingEnabled(val)
  }

  async function saveIdleTimeout(val) {
    await dbRun('INSERT OR REPLACE INTO analytics_settings (key, value) VALUES (?, ?)', ['idle_timeout', String(val)])
    setIdleTimeout(val)
    addNotification('Idle timeout updated', 'success')
  }

  function getGmailPresets() {
    setEmailForm(f => ({ ...f, provider: 'gmail', imap_host: 'imap.gmail.com', imap_port: '993', smtp_host: 'smtp.gmail.com', smtp_port: '587' }))
  }

  function getOutlookPresets() {
    setEmailForm(f => ({ ...f, provider: 'outlook', imap_host: 'outlook.office365.com', imap_port: '993', smtp_host: 'smtp.office365.com', smtp_port: '587' }))
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your profile, email accounts and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <SettingRow label="Display Name" desc="Your name shown across the app">
          <input
            value={profileForm.name}
            onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100 w-48 focus:outline-none focus:border-blue-500"
          />
        </SettingRow>
        <SettingRow label="Profile Picture" desc="Local image file for your avatar">
          <div className="flex items-center gap-2">
            {profileForm.avatar_path && (
              <img src={`file:///${profileForm.avatar_path.replace(/\\/g, '/')}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
            )}
            <button onClick={pickAvatar}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors">
              Choose file
            </button>
          </div>
        </SettingRow>
        <SettingRow label="Background Image" desc="Dashboard background image">
          <div className="flex items-center gap-2">
            {profileForm.background_path && (
              <span className="text-xs text-slate-500 max-w-[100px] truncate">{profileForm.background_path.split(/[\\/]/).pop()}</span>
            )}
            <button onClick={pickBackground}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors">
              Choose file
            </button>
          </div>
        </SettingRow>
        <div className="flex justify-end pt-1">
          <button onClick={saveProfile} disabled={profileSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </Section>

      {/* Email Accounts */}
      <Section title="Email Accounts">
        {emailAccounts.length === 0 ? (
          <p className="text-sm text-slate-500">No email accounts connected.</p>
        ) : (
          <div className="space-y-2">
            {emailAccounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg">
                <div>
                  <p className="text-sm text-slate-200">{acc.name || acc.email}</p>
                  <p className="text-xs text-slate-500">{acc.email} · {acc.provider}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${acc.active ? 'bg-green-800/50 text-green-300' : 'bg-slate-700 text-slate-500'}`}>
                    {acc.active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => removeEmailAccount(acc.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showEmailForm ? (
          <button onClick={() => setShowEmailForm(true)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add email account
          </button>
        ) : (
          <div className="bg-slate-700/30 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex gap-2 mb-3">
              <button onClick={getGmailPresets}
                className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs transition-colors">
                Gmail presets
              </button>
              <button onClick={getOutlookPresets}
                className="px-3 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded-lg text-xs transition-colors">
                Outlook presets
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Display Name', key: 'name', placeholder: 'My Gmail' },
                { label: 'Email Address', key: 'email', placeholder: 'you@gmail.com' },
                { label: 'IMAP Host', key: 'imap_host', placeholder: 'imap.gmail.com' },
                { label: 'IMAP Port', key: 'imap_port', placeholder: '993' },
                { label: 'SMTP Host', key: 'smtp_host', placeholder: 'smtp.gmail.com' },
                { label: 'SMTP Port', key: 'smtp_port', placeholder: '587' },
                { label: 'Username / Email', key: 'username', placeholder: 'you@gmail.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
                  <input
                    value={emailForm[field.key]}
                    onChange={e => setEmailForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">App Password</label>
                <input
                  type="password"
                  value={emailForm.password_enc}
                  onChange={e => setEmailForm(f => ({ ...f, password_enc: e.target.value }))}
                  placeholder="App password (not your main password)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">For Gmail: use an App Password (not your account password). Enable 2FA in Google account settings first.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowEmailForm(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors">
                Cancel
              </button>
              <button onClick={saveEmailAccount}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
                Add Account
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Security */}
      <Section title="Security">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Current Password</label>
              <input type="password" value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">New Password</label>
              <input type="password" value={pwForm.newPw}
                onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Confirm New Password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {pwError && <p className="text-xs text-red-400">{pwError}</p>}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Changing your password will lock the app and require you to log in again.</p>
            <button onClick={changePassword} disabled={pwLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </Section>

      {/* Analytics & Tracking */}
      <Section title="Usage Analytics">
        <SettingRow label="Enable tracking" desc="Track time spent in each section and apps running alongside Nexus">
          <Toggle value={trackingEnabled} onChange={toggleTracking} />
        </SettingRow>
        <SettingRow label="Idle timeout" desc="Minutes of inactivity before a session is marked as idle">
          <select value={idleTimeout} onChange={e => saveIdleTimeout(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
            {['1','2','3','5','10','15','30'].map(v => (
              <option key={v} value={v}>{v} minutes</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Danger zone */}
      <Section title="Data & Privacy">
        <SettingRow label="Lock app" desc="Lock the app and require your master password to re-enter">
          <button onClick={lock}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors">
            Lock now
          </button>
        </SettingRow>
        <SettingRow label="Privacy" desc="All data stored on your device. Nothing is transmitted externally.">
          <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-1 rounded-full">100% local</span>
        </SettingRow>
      </Section>

      {/* About */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-300">Nexus Command</p>
          <p className="text-xs text-slate-500">Version {appVersion} · Private, offline career management</p>
        </div>
        <div className="text-xs text-slate-600">Build once, run forever.</div>
      </div>
    </div>
  )
}
