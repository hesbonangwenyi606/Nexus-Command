import React, { useState } from 'react'

const STATUSES = ['Saved', 'Applied', 'Interview Scheduled', 'Offer', 'Rejected']

export default function JobForm({ job, onClose, onSave }) {
  const [form, setForm] = useState(job || {
    company: '', title: '', url: '', status: 'Saved',
    deadline: '', notes: '', match_score: ''
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.company || !form.title) return
    onSave({ ...form, match_score: form.match_score ? parseInt(form.match_score) : null })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 w-[520px] border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-100 mb-5">{job ? 'Edit Job' : 'Add Job Application'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company *</label>
              <input type="text" value={form.company}
                onChange={e => setForm(f => ({...f, company: e.target.value}))}
                placeholder="Company name"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Job Title *</label>
              <input type="text" value={form.title}
                onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder="e.g. Senior Developer"
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Job URL</label>
            <input type="url" value={form.url}
              onChange={e => setForm(f => ({...f, url: e.target.value}))}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Deadline</label>
              <input type="date" value={form.deadline}
                onChange={e => setForm(f => ({...f, deadline: e.target.value}))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Match Score (%)</label>
              <input type="number" value={form.match_score}
                onChange={e => setForm(f => ({...f, match_score: e.target.value}))}
                min="0" max="100" placeholder="0-100"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({...f, notes: e.target.value}))}
              rows={4}
              placeholder="Application notes, recruiter contacts, next steps..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
              {job ? 'Update Job' : 'Add Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
