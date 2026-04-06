import React, { useState, useEffect } from 'react'
import { dbQuery, dbRun } from '../../database/db'
import { useApp } from '../../App'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Filler)

const PERIODS = ['Day', 'Week', 'Month', 'Year']

const SECTION_COLORS = {
  dashboard: '#3b82f6',
  inbox: '#14b8a6',
  jobs: '#8b5cf6',
  interview: '#f59e0b',
  coverletter: '#ec4899',
  matchscorer: '#06b6d4',
  contacts: '#10b981',
  assets: '#64748b',
  templates: '#6366f1',
  ai: '#22d3ee',
  automation: '#f97316',
  analytics: '#84cc16',
  settings: '#94a3b8'
}

const SECTION_LABELS = {
  dashboard: 'Dashboard',
  inbox: 'Inbox',
  jobs: 'Job Tracker',
  interview: 'Interview Prep',
  coverletter: 'Cover Letter',
  matchscorer: 'Match Scorer',
  contacts: 'Contacts',
  assets: 'Asset Vault',
  templates: 'Templates',
  ai: 'AI Assistant',
  automation: 'Automation',
  analytics: 'Analytics',
  settings: 'Settings'
}

function MetricCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${color.includes('green') ? 'text-green-400' : color.includes('blue') ? 'text-blue-400' : color.includes('purple') ? 'text-purple-400' : 'text-slate-100'}`}>
        {value}
      </div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function formatDuration(seconds) {
  if (!seconds || seconds < 60) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function getDateRange(period) {
  const now = new Date()
  const start = new Date()
  switch (period) {
    case 'Day': start.setHours(0, 0, 0, 0); break
    case 'Week': start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); break
    case 'Month': start.setDate(1); start.setHours(0, 0, 0, 0); break
    case 'Year': start.setMonth(0, 1); start.setHours(0, 0, 0, 0); break
  }
  return { start, end: now }
}

function getChartLabels(period) {
  const now = new Date()
  switch (period) {
    case 'Day':
      return Array.from({ length: 24 }, (_, i) => `${i}:00`)
    case 'Week': {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        days.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
      }
      return days
    }
    case 'Month': {
      const weeks = []
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let w = 1; w <= daysInMonth; w += 7) {
        weeks.push(`${now.toLocaleDateString('en-US', { month: 'short' })} ${w}`)
      }
      return weeks
    }
    case 'Year':
      return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  }
}

export default function Analytics() {
  const { addNotification } = useApp()
  const [period, setPeriod] = useState('Week')
  const [metrics, setMetrics] = useState({ total: 0, productive: 0, focusScore: 0, apps: 0, streak: 0 })
  const [sectionData, setSectionData] = useState([])
  const [appsData, setAppsData] = useState([])
  const [appFilter, setAppFilter] = useState('All')
  const [trackingEnabled, setTrackingEnabled] = useState(true)
  const [activityGrid, setActivityGrid] = useState([])
  const [mostUsedSection, setMostUsedSection] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  useEffect(() => {
    loadTrackingSettings()
  }, [])

  async function loadTrackingSettings() {
    try {
      const rows = await dbQuery("SELECT value FROM analytics_settings WHERE key = 'tracking_enabled'", [])
      setTrackingEnabled(rows[0]?.value !== '0')
    } catch { }
  }

  async function toggleTracking() {
    const newVal = trackingEnabled ? '0' : '1'
    await dbRun('INSERT OR REPLACE INTO analytics_settings (key, value) VALUES (?, ?)', ['tracking_enabled', newVal])
    setTrackingEnabled(!trackingEnabled)
    addNotification(`Tracking ${!trackingEnabled ? 'enabled' : 'disabled'}`, 'info')
  }

  async function clearHistory() {
    if (!confirm('Clear all usage history? This cannot be undone.')) return
    await dbRun('DELETE FROM analytics_sections', [])
    await dbRun('DELETE FROM analytics_apps', [])
    addNotification('Usage history cleared', 'success')
    loadData()
  }

  async function loadData() {
    setLoading(true)
    try {
      const { start } = getDateRange(period)
      const startStr = start.toISOString()

      // Metrics
      const appStats = await dbQuery(
        'SELECT SUM(duration_seconds) as total, SUM(CASE WHEN is_productive=1 THEN duration_seconds ELSE 0 END) as productive, COUNT(DISTINCT app_name) as apps FROM analytics_apps WHERE detected_at >= ?',
        [startStr]
      )
      const stat = appStats[0] || {}
      const total = stat.total || 0
      const productive = stat.productive || 0
      const focusScore = total > 0 ? Math.round((productive / total) * 100) : 0

      // Streak: count consecutive days with >5 min usage
      const streakRows = await dbQuery(
        "SELECT date(detected_at) as day, SUM(duration_seconds) as secs FROM analytics_apps GROUP BY date(detected_at) ORDER BY day DESC",
        []
      )
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      let checkDate = today
      for (const row of streakRows) {
        if (row.day === checkDate && row.secs >= 300) {
          streak++
          const d = new Date(checkDate)
          d.setDate(d.getDate() - 1)
          checkDate = d.toISOString().split('T')[0]
        } else {
          break
        }
      }

      setMetrics({ total, productive, focusScore, apps: stat.apps || 0, streak })

      // Section data
      const sectionRows = await dbQuery(
        'SELECT section, SUM(duration_seconds) as total FROM analytics_sections WHERE started_at >= ? GROUP BY section ORDER BY total DESC',
        [startStr]
      )
      setSectionData(sectionRows)

      if (sectionRows.length > 0) setMostUsedSection(sectionRows[0])

      // Apps data
      const appRows = await dbQuery(
        'SELECT app_name, category, is_productive, SUM(duration_seconds) as total FROM analytics_apps WHERE detected_at >= ? GROUP BY app_name ORDER BY total DESC LIMIT 20',
        [startStr]
      )
      setAppsData(appRows)

      // Activity grid (heatmap data)
      const gridRows = await dbQuery(
        'SELECT detected_at, duration_seconds FROM analytics_apps WHERE detected_at >= ? ORDER BY detected_at',
        [startStr]
      )
      setActivityGrid(gridRows)

    } catch (err) {
      console.error('Analytics load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Bar chart for section time
  const sectionBarData = {
    labels: sectionData.slice(0, 8).map(s => SECTION_LABELS[s.section] || s.section),
    datasets: [{
      label: 'Time (minutes)',
      data: sectionData.slice(0, 8).map(s => Math.round((s.total || 0) / 60)),
      backgroundColor: sectionData.slice(0, 8).map(s => SECTION_COLORS[s.section] || '#64748b'),
      borderRadius: 4
    }]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' }, beginAtZero: true }
    }
  }

  // Donut chart for category breakdown
  const categoryTotals = { Work: 0, Professional: 0, Social: 0, Other: 0 }
  appsData.forEach(a => {
    const cat = a.category || 'Other'
    if (cat === 'Development' || cat === 'Office' || a.is_productive) categoryTotals.Work += a.total
    else if (cat === 'Professional') categoryTotals.Professional += a.total
    else if (cat === 'Social' || cat === 'Communication') categoryTotals.Social += a.total
    else categoryTotals.Other += a.total
  })

  const donutData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals).map(v => Math.round(v / 60)),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#64748b'],
      borderWidth: 0
    }]
  }
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 10 } } },
    cutout: '65%'
  }

  const filteredApps = appsData.filter(a => {
    if (appFilter === 'All') return true
    if (appFilter === 'Work') return a.is_productive
    if (appFilter === 'Social') return a.category === 'Social' || a.category === 'Communication'
    return !a.is_productive && a.category !== 'Social' && a.category !== 'Communication'
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Usage Analytics</h1>
          <p className="text-slate-400 text-sm">All tracking runs locally — nothing leaves your device</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex bg-slate-800 rounded-lg p-1 gap-0.5">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tracking toggle */}
      {!trackingEnabled && (
        <div className="bg-yellow-900/30 border border-yellow-800 rounded-xl p-3 flex items-center justify-between">
          <p className="text-yellow-300 text-sm">Tracking is disabled. Enable it to collect usage data.</p>
          <button onClick={toggleTracking} className="text-xs text-yellow-400 hover:text-yellow-300 font-medium">Enable</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          label="Active Time"
          value={formatDuration(metrics.total)}
          color="bg-blue-600/20"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          label="Productive"
          value={formatDuration(metrics.productive)}
          color="bg-green-600/20"
          icon={<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          label="Focus Score"
          value={`${metrics.focusScore}%`}
          color="bg-purple-600/20"
          icon={<svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <MetricCard
          label="Apps Detected"
          value={metrics.apps}
          color="bg-slate-600/40"
          icon={<svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" /></svg>}
        />
        <MetricCard
          label="Day Streak"
          value={`${metrics.streak}`}
          sub="consecutive days"
          color="bg-orange-600/20"
          icon={<svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>}
        />
      </div>

      {/* Most used section banner */}
      {mostUsedSection && (
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-700/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Most used section this {period.toLowerCase()}: <span className="text-blue-400">{SECTION_LABELS[mostUsedSection.section] || mostUsedSection.section}</span>
            </p>
            <p className="text-xs text-slate-500">{formatDuration(mostUsedSection.total)} total time</p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Section time bar chart */}
        <div className="col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Time by Section (minutes)</h3>
          {sectionData.length > 0 ? (
            <div style={{ height: 200 }}>
              <Bar data={sectionBarData} options={barOptions} />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              No section data for this period
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Category Breakdown</h3>
          {appsData.length > 0 ? (
            <div style={{ height: 200 }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              No app data
            </div>
          )}
        </div>
      </div>

      {/* Focus score ring + apps panel */}
      <div className="grid grid-cols-2 gap-4">
        {/* Focus score ring */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Focus Score</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none"
                  stroke={metrics.focusScore >= 70 ? '#22c55e' : metrics.focusScore >= 50 ? '#3b82f6' : '#f59e0b'}
                  strokeWidth="10"
                  strokeDasharray={`${(metrics.focusScore / 100) * 264} 264`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${metrics.focusScore >= 70 ? 'text-green-400' : metrics.focusScore >= 50 ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {metrics.focusScore}%
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-slate-400">Productive</span>
                </div>
                <p className="text-sm font-medium text-slate-200">{formatDuration(metrics.productive)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span className="text-xs text-slate-400">Other</span>
                </div>
                <p className="text-sm font-medium text-slate-200">{formatDuration(metrics.total - metrics.productive)}</p>
              </div>
              <p className="text-xs text-slate-500">
                {metrics.focusScore >= 70 ? 'Great focus!' : metrics.focusScore >= 50 ? 'Decent focus' : 'Room to improve'}
              </p>
            </div>
          </div>
        </div>

        {/* Apps & sites panel */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Apps & Sites</h3>
            <div className="flex bg-slate-700 rounded-lg p-0.5 gap-0.5">
              {['All', 'Work', 'Social', 'Other'].map(f => (
                <button key={f} onClick={() => setAppFilter(f)}
                  className={`px-2 py-1 rounded-md text-xs transition-colors ${appFilter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredApps.length === 0 ? (
              <p className="text-xs text-slate-600 py-6 text-center">No data for this period</p>
            ) : (
              filteredApps.map((app, i) => {
                const maxTime = filteredApps[0]?.total || 1
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-slate-300 truncate flex-1">{app.app_name}</span>
                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{formatDuration(app.total)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${app.is_productive ? 'bg-green-500' : 'bg-slate-500'}`}
                          style={{ width: `${(app.total / maxTime) * 100}%` }}
                        />
                      </div>
                    </div>
                    {app.is_productive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" title="Productive" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Section time table */}
      {sectionData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Section Time Breakdown</h3>
          <div className="space-y-2">
            {sectionData.map((s, i) => {
              const maxTime = sectionData[0]?.total || 1
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-400 flex-shrink-0 truncate">
                    {SECTION_LABELS[s.section] || s.section}
                  </div>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.total / maxTime) * 100}%`,
                        backgroundColor: SECTION_COLORS[s.section] || '#64748b'
                      }}
                    />
                  </div>
                  <div className="w-16 text-xs text-slate-400 text-right flex-shrink-0">
                    {formatDuration(s.total)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings row */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTracking}
            className={`relative w-10 h-5 rounded-full transition-colors ${trackingEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${trackingEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-slate-300">
            {trackingEnabled ? 'Tracking enabled' : 'Tracking disabled'}
          </span>
          <span className="text-xs text-slate-500">All data stored locally, never transmitted</span>
        </div>
        <button onClick={clearHistory}
          className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Clear all history
        </button>
      </div>
    </div>
  )
}
