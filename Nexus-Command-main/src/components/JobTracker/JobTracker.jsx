import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'
import KanbanBoard from './KanbanBoard'
import JobForm from './JobForm'

const STATUS_COLORS = {
  Saved: 'bg-slate-600 text-slate-200',
  Applied: 'bg-blue-700 text-blue-100',
  'Interview Scheduled': 'bg-yellow-700 text-yellow-100',
  Offer: 'bg-green-700 text-green-100',
  Rejected: 'bg-red-800 text-red-100'
}

const STATUSES = ['Saved', 'Applied', 'Interview Scheduled', 'Offer', 'Rejected']

export default function JobTracker() {
  const { addNotification } = useApp()
  const [jobs, setJobs] = useState([])
  const [view, setView] = useState('kanban')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    const rows = await dbGetAll('jobs')
    setJobs(rows)
  }

  async function saveJob(data) {
    if (data.id) {
      await dbRun(
        'UPDATE jobs SET company=?, title=?, url=?, status=?, deadline=?, notes=?, match_score=?, updated_at=datetime("now") WHERE id=?',
        [data.company, data.title, data.url, data.status, data.deadline, data.notes, data.match_score, data.id]
      )
      addNotification('Job updated!', 'success')
    } else {
      await dbRun(
        'INSERT INTO jobs (company, title, url, status, deadline, notes, match_score) VALUES (?,?,?,?,?,?,?)',
        [data.company, data.title, data.url, data.status || 'Saved', data.deadline, data.notes, data.match_score]
      )
      addNotification('Job added!', 'success')
    }
    setShowForm(false)
    setEditingJob(null)
    loadJobs()
  }

  async function deleteJob(id) {
    if (!confirm('Delete this job application?')) return
    await dbRun('DELETE FROM jobs WHERE id = ?', [id])
    setSelectedJob(null)
    loadJobs()
    addNotification('Job deleted', 'info')
  }

  async function updateStatus(id, status) {
    await dbRun('UPDATE jobs SET status=?, updated_at=datetime("now") WHERE id=?', [status, id])
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  const filtered = jobs.filter(j =>
    !search || j.company.toLowerCase().includes(search.toLowerCase()) || j.title.toLowerCase().includes(search.toLowerCase())
  )

  function sortedJobs() {
    return [...filtered].sort((a, b) => {
      let va = a[sortBy] || ''
      let vb = b[sortBy] || ''
      if (sortDir === 'desc') [va, vb] = [vb, va]
      return va < vb ? -1 : va > vb ? 1 : 0
    })
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  // Calendar helpers
  const now = new Date()
  const calYear = now.getFullYear()
  const calMonth = now.getMonth()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay()
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const jobsByDeadlineDay = {}
  jobs.forEach(j => {
    if (j.deadline) {
      const d = new Date(j.deadline)
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate()
        if (!jobsByDeadlineDay[day]) jobsByDeadlineDay[day] = []
        jobsByDeadlineDay[day].push(j)
      }
    }
  })

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Job Tracker</h1>
            <p className="text-slate-400 text-sm">{jobs.length} applications total</p>
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1 gap-0.5">
            {[['kanban','Kanban'],['list','List'],['calendar','Calendar']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Search jobs..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-sm bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500" />
          <button onClick={() => { setEditingJob(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Job
          </button>
        </div>

        {/* Views */}
        <div className="flex-1 overflow-auto p-5">
          {view === 'kanban' && (
            <KanbanBoard jobs={filtered} onStatusChange={updateStatus} onEdit={j => { setEditingJob(j); setShowForm(true) }} onDelete={deleteJob} onSelect={setSelectedJob} />
          )}

          {view === 'list' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    {[['company','Company'],['title','Title'],['status','Status'],['deadline','Deadline'],['match_score','Score'],['created_at','Added']].map(([col,label]) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-200 transition-colors"
                        onClick={() => toggleSort(col)}>
                        {label}
                        {sortBy === col && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {sortedJobs().map(job => (
                    <tr key={job.id} className="hover:bg-slate-700/30 cursor-pointer transition-colors" onClick={() => setSelectedJob(job)}>
                      <td className="px-4 py-3 font-medium text-slate-100">{job.company}</td>
                      <td className="px-4 py-3 text-slate-300">{job.title}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[job.status] || STATUS_COLORS.Saved}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {job.deadline ? new Date(job.deadline).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {job.match_score ? (
                          <span className={`text-sm font-bold ${job.match_score >= 70 ? 'text-green-400' : job.match_score >= 50 ? 'text-blue-400' : 'text-yellow-400'}`}>
                            {job.match_score}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(job.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setEditingJob(job); setShowForm(true) }} className="p-1 text-slate-400 hover:text-blue-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => deleteJob(job.id)} className="p-1 text-slate-400 hover:text-red-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedJobs().length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">No jobs found</div>
              )}
            </div>
          )}

          {view === 'calendar' && (
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">
                {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Deadlines
              </h3>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                {calDays.map(day => {
                  const dayJobs = jobsByDeadlineDay[day] || []
                  const isToday = day === now.getDate()
                  return (
                    <div key={day}
                      className={`min-h-16 p-1 rounded-lg border transition-colors ${isToday ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:border-slate-600'}`}>
                      <div className={`text-xs mb-1 font-medium ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{day}</div>
                      {dayJobs.map(j => (
                        <div key={j.id}
                          className="text-xs bg-red-900/50 text-red-300 rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:bg-red-900/70"
                          onClick={() => setSelectedJob(j)}>
                          {j.company}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedJob && (
        <div className="w-80 border-l border-slate-800 p-5 overflow-y-auto bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Job Details</h3>
            <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold text-slate-100">{selectedJob.title}</p>
              <p className="text-slate-400">{selectedJob.company}</p>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedJob.status] || STATUS_COLORS.Saved}`}>
              {selectedJob.status}
            </span>
            {selectedJob.match_score && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Match Score:</span>
                <span className={`text-sm font-bold ${selectedJob.match_score >= 70 ? 'text-green-400' : selectedJob.match_score >= 50 ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {selectedJob.match_score}%
                </span>
              </div>
            )}
            {selectedJob.deadline && (
              <div>
                <p className="text-xs text-slate-500">Deadline</p>
                <p className="text-sm text-slate-300">{new Date(selectedJob.deadline).toLocaleDateString()}</p>
              </div>
            )}
            {selectedJob.url && (
              <div>
                <p className="text-xs text-slate-500">URL</p>
                <a href={selectedJob.url} target="_blank" rel="noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 truncate block">{selectedJob.url}</a>
              </div>
            )}
            {selectedJob.notes && (
              <div>
                <p className="text-xs text-slate-500">Notes</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedJob.notes}</p>
              </div>
            )}
            <div className="border-t border-slate-700 pt-3 flex gap-2">
              <button onClick={() => { setEditingJob(selectedJob); setShowForm(true) }}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                Edit
              </button>
              <button onClick={() => deleteJob(selectedJob.id)}
                className="px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">
                Delete
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Change Status</p>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => { updateStatus(selectedJob.id, s); setSelectedJob(j => ({...j, status: s})) }}
                    className={`px-2 py-1 rounded text-xs transition-colors ${selectedJob.status === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <JobForm
          job={editingJob}
          onClose={() => { setShowForm(false); setEditingJob(null) }}
          onSave={saveJob}
        />
      )}
    </div>
  )
}
