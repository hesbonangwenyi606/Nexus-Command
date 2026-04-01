import React, { useState } from 'react'

const COLUMNS = ['Saved', 'Applied', 'Interview Scheduled', 'Offer', 'Rejected']
const COLUMN_COLORS = {
  Saved: 'border-slate-600',
  Applied: 'border-blue-600',
  'Interview Scheduled': 'border-yellow-600',
  Offer: 'border-green-600',
  Rejected: 'border-red-700'
}
const COLUMN_HEADER_COLORS = {
  Saved: 'text-slate-300',
  Applied: 'text-blue-400',
  'Interview Scheduled': 'text-yellow-400',
  Offer: 'text-green-400',
  Rejected: 'text-red-400'
}

export default function KanbanBoard({ jobs, onStatusChange, onEdit, onDelete, onSelect }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  function getJobsByStatus(status) {
    return jobs.filter(j => j.status === status)
  }

  function handleDragStart(e, job) {
    setDragging(job)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, status) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(status)
  }

  function handleDrop(e, status) {
    e.preventDefault()
    if (dragging && dragging.status !== status) {
      onStatusChange(dragging.id, status)
    }
    setDragging(null)
    setDragOver(null)
  }

  function handleDragEnd() {
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {COLUMNS.map(status => {
        const columnJobs = getJobsByStatus(status)
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-56 flex flex-col rounded-xl border ${COLUMN_COLORS[status]}
              ${dragOver === status ? 'bg-slate-700/30' : 'bg-slate-800/50'} transition-colors`}
            onDragOver={e => handleDragOver(e, status)}
            onDrop={e => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${COLUMN_HEADER_COLORS[status]}`}>
                {status}
              </span>
              <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                {columnJobs.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 kanban-column">
              {columnJobs.map(job => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={e => handleDragStart(e, job)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect(job)}
                  className={`bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-500 cursor-pointer card-drag transition-all shadow-sm
                    ${dragging?.id === job.id ? 'opacity-50 scale-95' : 'hover:shadow-md'}`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-100 leading-tight">{job.title}</p>
                    <div className="flex gap-0.5 ml-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onEdit(job)} className="p-1 text-slate-500 hover:text-blue-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => onDelete(job.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{job.company}</p>
                  <div className="flex items-center justify-between">
                    {job.deadline && (
                      <span className="text-xs text-slate-500">
                        {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {job.match_score && (
                      <span className={`text-xs font-bold ml-auto ${job.match_score >= 70 ? 'text-green-400' : job.match_score >= 50 ? 'text-blue-400' : 'text-yellow-400'}`}>
                        {job.match_score}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-xs text-slate-600">Drag to move</span>
                  </div>
                </div>
              ))}

              {columnJobs.length === 0 && (
                <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-slate-700 rounded-lg">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
