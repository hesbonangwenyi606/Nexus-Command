import React, { useState, useEffect, createContext, useContext } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import MasterPasswordScreen from './components/Auth/MasterPasswordScreen'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import Inbox from './components/Inbox/Inbox'
import Templates from './components/Templates/Templates'
import AssetVault from './components/AssetVault/AssetVault'
import CoverLetterBuilder from './components/CoverLetter/CoverLetterBuilder'
import MatchScorer from './components/MatchScorer/MatchScorer'
import JobTracker from './components/JobTracker/JobTracker'
import InterviewPrep from './components/InterviewPrep/InterviewPrep'
import AIAssistant from './components/AIAssistant/AIAssistant'
import Contacts from './components/Contacts/Contacts'
import AutomationRules from './components/Automation/AutomationRules'
import Analytics from './components/Analytics/Analytics'
import Settings from './components/Settings/Settings'

export const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

function Toast({ notifications, removeNotification }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(n => (
        <div
          key={n.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
            ${n.type === 'error' ? 'bg-red-600 text-white' :
              n.type === 'success' ? 'bg-green-600 text-white' :
              n.type === 'warning' ? 'bg-yellow-600 text-white' :
              'bg-slate-700 text-slate-100'}`}
        >
          <span>{n.message}</span>
          <button onClick={() => removeNotification(n.id)} className="ml-2 opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function AppContent() {
  const { isAuthenticated, profile, notifications, removeNotification, lock } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) return
    const section = location.pathname.replace('/', '') || 'dashboard'
    if (window.electronAPI) {
      window.electronAPI.trackSection(section)
    }
  }, [location.pathname, isAuthenticated])

  if (!isAuthenticated) {
    return <MasterPasswordScreen />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/jobs" element={<JobTracker />} />
          <Route path="/interview" element={<InterviewPrep />} />
          <Route path="/coverletter" element={<CoverLetterBuilder />} />
          <Route path="/matchscorer" element={<MatchScorer />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/assets" element={<AssetVault />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/automation" element={<AutomationRules />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Toast notifications={notifications} removeNotification={removeNotification} />
    </div>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [dbExists, setDbExists] = useState(null)

  useEffect(() => {
    checkDbExists()
  }, [])

  async function checkDbExists() {
    if (window.electronAPI) {
      const result = await window.electronAPI.dbExists()
      setDbExists(result.exists)
    } else {
      setDbExists(false)
    }
  }

  function addNotification(message, type = 'info', duration = 4000) {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => removeNotification(id), duration)
  }

  function removeNotification(id) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function unlock(profileData) {
    setIsAuthenticated(true)
    setProfile(profileData)
  }

  function lock() {
    setIsAuthenticated(false)
    setProfile(null)
  }

  async function refreshProfile() {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.dbQuery('SELECT * FROM profile LIMIT 1', [])
      if (result.rows?.length) setProfile(result.rows[0])
    } catch (e) { /* ignore */ }
  }

  const ctx = {
    isAuthenticated,
    profile,
    dbExists,
    notifications,
    addNotification,
    removeNotification,
    unlock,
    lock,
    refreshProfile
  }

  return (
    <AppContext.Provider value={ctx}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppContext.Provider>
  )
}
