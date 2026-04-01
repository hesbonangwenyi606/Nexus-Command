import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../App'
import { dbQuery } from '../../database/db'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useApp()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    emailsThisWeek: 0,
    repliesSent: 0,
    unanswered: 0,
    activeJobs: 0
  })
  const [jobsByStatus, setJobsByStatus] = useState({})
  const [emailActivity, setEmailActivity] = useState([])
  const [analyticsStats, setAnalyticsStats] = useState({
    totalTime: 0,
    productiveTime: 0,
    focusScore: 0,
    appsDetected: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const emailsThisWeek = await dbQuery('SELECT COUNT(*) as cnt FROM emails WHERE date >= ?', [weekAgo])
      const repliesSent = await dbQuery("SELECT COUNT(*) as cnt FROM emails WHERE is_replied = 1 AND date >= ?", [weekAgo])
      const unanswered = await dbQuery('SELECT COUNT(*) as cnt FROM emails WHERE is_read = 0', [])
      const activeJobs = await dbQuery("SELECT COUNT(*) as cnt FROM jobs WHERE status NOT IN ('Rejected')", [])

      setStats({
        emailsThisWeek: emailsThisWeek[0]?.cnt || 0,
        repliesSent: repliesSent[0]?.cnt || 0,
        unanswered: unanswered[0]?.cnt || 0,
        activeJobs: activeJobs[0]?.cnt || 0
      })

      // Jobs by status
      const statusRows = await dbQuery('SELECT status, COUNT(*) as cnt FROM jobs GROUP BY status', [])
      const byStatus = {}
      statusRows.forEach(r => { byStatus[r.status] = r.cnt })
      setJobsByStatus(byStatus)

      // Email activity last 7 days
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dateStr = d.toISOString().split('T')[0]
        const rows = await dbQuery(
          "SELECT COUNT(*) as cnt FROM emails WHERE date LIKE ?",
          [dateStr + '%']
        )
        days.push({ date: dateStr, count: rows[0]?.cnt || 0 })
      }
      setEmailActivity(days)

      // Analytics stats (today)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const appRows = await dbQuery(
        'SELECT SUM(duration_seconds) as total, SUM(CASE WHEN is_productive = 1 THEN duration_seconds ELSE 0 END) as productive, COUNT(DISTINCT app_name) as apps FROM analytics_apps WHERE detected_at >= ?',
        [todayStart.toISOString()]
      )
      const appData = appRows[0] || {}
      const total = appData.total || 0
      const productive = appData.productive || 0
      const focusScore = total > 0 ? Math.round((productive / total) * 100) : 0
      setAnalyticsStats({
        totalTime: total,
        productiveTime: productive,
        focusScore,
        appsDetected: appData.apps || 0
      })

      // Recent activity
      const activity = []
      const recentJobs = await dbQuery('SELECT company, title, status, created_at FROM jobs ORDER BY created_at DESC LIMIT 3', [])
      recentJobs.forEach(j => activity.push({ type: 'job', text: `Added job: ${j.title} at ${j.company}`, time: j.created_at, color: 'text-blue-400' }))
      const recentEmails = await dbQuery('SELECT subject, from_name, date FROM emails ORDER BY date DESC LIMIT 3', [])
      recentEmails.forEach(e => activity.push({ type: 'email', text: `Email from ${e.from_name || 'Unknown'}: ${e.subject}`, time: e.date, color: 'text-green-400' }))
      const recentContacts = await dbQuery('SELECT name, company, created_at FROM contacts ORDER BY created_at DESC LIMIT 2', [])
      recentContacts.forEach(c => activity.push({ type: 'contact', text: `New contact: ${c.name}${c.company ? ' at ' + c.company : ''}`, time: c.created_at, color: 'text-purple-400' }))

      activity.sort((a, b) => new Date(b.time) - new Date(a.time))
      setRecentActivity(activity.slice(0, 5))

    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const chartLabels = emailActivity.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  })

  const lineData = {
    labels: chartLabels,
    datasets: [{
      label: 'Emails',
      data: emailActivity.map(d => d.count),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3b82f6',
      pointRadius: 4
    }]
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', stepSize: 1 }, beginAtZero: true }
    }
  }

  const statusColors = {
    Saved: '#64748b', Applied: '#3b82f6', 'Interview Scheduled': '#eab308',
    Offer: '#22c55e', Rejected: '#ef4444'
  }
  const statusLabels = Object.keys(jobsByStatus)
  const donutData = {
    labels: statusLabels,
    datasets: [{
      data: statusLabels.map(s => jobsByStatus[s]),
      backgroundColor: statusLabels.map(s => statusColors[s] || '#64748b'),
      borderWidth: 0
    }]
  }
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 12, font: { size: 11 } }
      }
    },
    cutout: '70%'
  }

  function formatDuration(seconds) {
    if (!seconds) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  function formatRelative(dateStr) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting()}, {profile?.name || 'there'} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Emails This Week"
          value={stats.emailsThisWeek}
          color="bg-blue-600/20"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
        <KpiCard
          label="Replies Sent"
          value={stats.repliesSent}
          color="bg-green-600/20"
          icon={<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>}
        />
        <KpiCard
          label="Unanswered"
          value={stats.unanswered}
          color="bg-yellow-600/20"
          icon={<svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard
          label="Active Applications"
          value={stats.activeJobs}
          color="bg-purple-600/20"
          icon={<svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Email Activity */}
        <div className="col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Email Activity (Last 7 Days)</h3>
          <div style={{ height: 180 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Jobs by Status */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Applications by Status</h3>
          {statusLabels.length > 0 ? (
            <div style={{ height: 180 }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-500 text-sm">
              No applications yet
            </div>
          )}
        </div>
      </div>

      {/* Analytics mini + Activity feed */}
      <div className="grid grid-cols-2 gap-4">
        {/* Analytics mini */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Usage Today</h3>
            <button onClick={() => navigate('/analytics')} className="text-xs text-blue-400 hover:text-blue-300">View all</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xl font-bold text-slate-100">{formatDuration(analyticsStats.totalTime)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Active Time</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-400">{formatDuration(analyticsStats.productiveTime)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Productive</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-400">{analyticsStats.focusScore}%</div>
              <div className="text-xs text-slate-400 mt-0.5">Focus Score</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="text-xl font-bold text-slate-100">{analyticsStats.appsDetected}</div>
              <div className="text-xs text-slate-400 mt-0.5">Apps Detected</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              No recent activity. Start by adding a job or email account.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.color} truncate`}>{item.text}</p>
                    <p className="text-xs text-slate-500">{formatRelative(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Add Job', path: '/jobs', color: 'bg-blue-600 hover:bg-blue-500' },
            { label: 'Compose Email', path: '/inbox', color: 'bg-green-700 hover:bg-green-600' },
            { label: 'New Cover Letter', path: '/coverletter', color: 'bg-purple-700 hover:bg-purple-600' },
            { label: 'Score Match', path: '/matchscorer', color: 'bg-yellow-700 hover:bg-yellow-600' },
            { label: 'AI Assistant', path: '/ai', color: 'bg-cyan-700 hover:bg-cyan-600' }
          ].map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
