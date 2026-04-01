import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { getPasswordStrength } from '../../utils/encryption'

export default function MasterPasswordScreen() {
  const { dbExists, unlock, addNotification } = useApp()
  const [mode, setMode] = useState('login') // 'login' | 'create'
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [strength, setStrength] = useState(null)

  useEffect(() => {
    if (dbExists === false) setMode('create')
    else if (dbExists === true) setMode('login')
  }, [dbExists])

  useEffect(() => {
    if (mode === 'create' && password) {
      setStrength(getPasswordStrength(password))
    } else {
      setStrength(null)
    }
  }, [password, mode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'create') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return }
        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return }

        const result = await window.electronAPI.dbInit({ password, name: name.trim() })
        if (result.success) {
          const profileResult = await window.electronAPI.dbQuery('SELECT * FROM profile LIMIT 1', [])
          unlock(profileResult.rows?.[0] || { name })
        } else {
          setError(result.error || 'Failed to create profile.')
        }
      } else {
        const result = await window.electronAPI.dbVerify({ password })
        if (result.success) {
          const profileResult = await window.electronAPI.dbQuery('SELECT * FROM profile LIMIT 1', [])
          unlock(profileResult.rows?.[0] || { name: 'User' })
        } else {
          setError(result.error || 'Incorrect password.')
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #3b82f6 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full opacity-5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">NEXUS COMMAND</h1>
          <p className="text-slate-400 mt-1 text-sm">Your private career command centre</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-100 mb-1">
            {mode === 'create' ? 'Create Your Profile' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {mode === 'create'
              ? 'Set up your secure local profile. Your data never leaves this device.'
              : 'Enter your master password to unlock your data.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Master Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'create' ? 'Choose a strong password' : 'Enter your password'}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                  autoFocus={mode === 'login'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {strength && mode === 'create' && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5,6].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= Math.ceil(strength.score) ? strength.color : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">{strength.label}</p>
                </div>
              )}
            </div>

            {mode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {mode === 'create' ? 'Creating Profile...' : 'Unlocking...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Profile
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Unlock
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {mode === 'create' && (
            <p className="text-center text-xs text-slate-500 mt-4">
              All data is stored locally and encrypted. No cloud, no subscriptions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
