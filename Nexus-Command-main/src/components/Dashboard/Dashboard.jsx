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

const SOCIAL_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', bg: 'bg-green-600/20', border: 'border-green-700/40', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', bg: 'bg-blue-600/20', border: 'border-blue-700/40', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bg: 'bg-blue-700/20', border: 'border-blue-800/40', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { id: 'twitter', label: 'X / Twitter', color: '#ffffff', bg: 'bg-slate-700/30', border: 'border-slate-600/40', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> },
  { id: 'instagram', label: 'Instagram', color: '#E1306C', bg: 'bg-pink-600/20', border: 'border-pink-700/40', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { id: 'tiktok', label: 'TikTok', color: '#ff0050', bg: 'bg-red-600/20', border: 'border-red-700/40', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg> },
]

function SocialCard({ platform, data, onUpdate, onOpen }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ total: data.total || 0, replied: data.replied || 0 })

  function save() {
    const unreplied = Math.max(0, form.total - form.replied)
    onUpdate(platform.id, { ...form, unreplied })
    setEditing(false)
  }

  const replied = data.replied || 0
  const unreplied = data.unreplied || 0
  const total = data.total || 0
  const pct = total > 0 ? Math.round((replied / total) * 100) : 0

  return (
    <div className={`rounded-xl p-4 border ${platform.bg} ${platform.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.color + '22', color: platform.color }}>
            {platform.icon}
          </div>
          <span className="text-sm font-semibold text-slate-200">{platform.label}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditing(e => !e)} className="p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Update counts">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button onClick={onOpen} className="p-1 text-slate-500 hover:text-blue-400 transition-colors" title="Open platform">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-0.5">Total</label>
              <input type="number" min="0" value={form.total} onChange={e => setForm(f => ({ ...f, total: +e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-0.5">Replied</label>
              <input type="number" min="0" value={form.replied} onChange={e => setForm(f => ({ ...f, replied: +e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button onClick={save} className="w-full py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors">Save</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-green-400 font-medium">{replied} replied</span>
            <span className="text-red-400 font-medium">{unreplied} unreplied</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1.5 text-right">{total} total · {pct}% replied</p>
        </>
      )}
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
  const [socialData, setSocialData] = useState({})
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

      // Social message stats
      const socialRows = await dbQuery('SELECT * FROM social_messages', [])
      const socialMap = {}
      socialRows.forEach(r => { socialMap[r.platform] = r })
      setSocialData(socialMap)

    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateSocialData(platformId, counts) {
    try {
      await dbQuery(
        'INSERT INTO social_messages (platform, total, replied, unreplied, updated_at) VALUES (?, ?, ?, ?, datetime("now")) ON CONFLICT(platform) DO UPDATE SET total=excluded.total, replied=excluded.replied, unreplied=excluded.unreplied, updated_at=excluded.updated_at',
        [platformId, counts.total, counts.replied, counts.unreplied]
      )
      setSocialData(prev => ({ ...prev, [platformId]: { platform: platformId, ...counts } }))
    } catch (err) {
      console.error('social update error', err)
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

  const bgSrc = profile?.background_path
    ? `file:///${profile.background_path.replace(/\\/g, '/')}`
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Hero header with background image */}
      <div className="relative rounded-2xl overflow-hidden">
        {bgSrc && (
          <img
            src={bgSrc}
            alt="background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className={`relative flex items-center justify-between px-6 py-7 ${bgSrc ? 'bg-black/50 backdrop-blur-sm' : ''}`}>
          <div className="flex items-center gap-4">
            {profile?.avatar_path ? (
              <img
                src={`file:///${profile.avatar_path.replace(/\\/g, '/')}`}
                alt="avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center text-2xl font-bold text-white border-2 border-white/20">
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow">
                {greeting()}, {profile?.name || 'there'}
              </h1>
              <p className={`text-sm mt-0.5 ${bgSrc ? 'text-white/70' : 'text-slate-400'}`}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
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

      {/* Social Media Messages */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Social Media Messages</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click the pencil icon on any card to update your counts</p>
          </div>
          <button onClick={() => navigate('/social')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Open Social Hub →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {SOCIAL_PLATFORMS.map(platform => (
            <SocialCard
              key={platform.id}
              platform={platform}
              data={socialData[platform.id] || {}}
              onUpdate={updateSocialData}
              onOpen={() => navigate('/social')}
            />
          ))}
        </div>

        {/* Email replied/unreplied row */}
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Email</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-700/40 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-100">{stats.emailsThisWeek}</p>
              <p className="text-xs text-slate-400 mt-0.5">Received this week</p>
            </div>
            <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-400">{stats.repliesSent}</p>
              <p className="text-xs text-slate-400 mt-0.5">Replied</p>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-400">{stats.unanswered}</p>
              <p className="text-xs text-slate-400 mt-0.5">Unreplied / Unread</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-400">
                {stats.emailsThisWeek > 0 ? Math.round((stats.repliesSent / stats.emailsThisWeek) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Reply rate</p>
            </div>
          </div>
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
            { label: 'Social Hub', path: '/social', color: 'bg-pink-700 hover:bg-pink-600' }
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
