import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'
import { generateInterviewQuestions } from '../../utils/matchScorer'

const TABS = ['Research Notes', 'STAR Stories', 'Question Predictor', 'Interview Log', 'Quick Review']

function STARCard({ story, index, onChange, onDelete }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-400">STAR Story #{index + 1}</span>
        <button onClick={onDelete} className="text-slate-500 hover:text-red-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {[['situation','Situation','What was the context?'],['task','Task','What was your responsibility?'],['action','Action','What steps did you take?'],['result','Result','What was the outcome?']].map(([key, label, hint]) => (
        <div key={key}>
          <label className="block text-xs font-semibold text-slate-400 mb-1">{label} <span className="text-slate-600 font-normal">{hint}</span></label>
          <textarea value={story[key] || ''} onChange={e => onChange({ ...story, [key]: e.target.value })}
            rows={2} placeholder={label + '...'}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100" />
        </div>
      ))}
    </div>
  )
}

function QuestionCard({ question, index, onAnswerChange }) {
  const [showWhy, setShowWhy] = useState(false)
  const confidencePct = Math.round(question.confidence * 100)
  const catColors = {
    Technical: 'bg-blue-900/40 text-blue-300',
    Behavioural: 'bg-purple-900/40 text-purple-300',
    'Portfolio Deep-Dives': 'bg-cyan-900/40 text-cyan-300',
    'Culture Fit': 'bg-green-900/40 text-green-300',
    'Gap-Probing': 'bg-red-900/40 text-red-300'
  }

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${catColors[question.category] || 'bg-slate-700 text-slate-400'}`}>
          {question.category}
        </span>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">Confidence: {confidencePct}%</div>
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${confidencePct}%` }} />
          </div>
          <button onClick={() => setShowWhy(!showWhy)} className="text-xs text-slate-500 hover:text-slate-300">
            Why?
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-200 font-medium mb-3">{question.question}</p>
      {showWhy && (
        <div className="mb-3 p-2 bg-slate-800 rounded-lg text-xs text-slate-400 italic">{question.why}</div>
      )}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Your Answer</label>
        <textarea value={question.answer || ''} onChange={e => onAnswerChange(index, e.target.value)}
          rows={3} placeholder="Type your prepared answer here..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100" />
      </div>
    </div>
  )
}

export default function InterviewPrep() {
  const { addNotification } = useApp()
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [prep, setPrep] = useState(null)
  const [tab, setTab] = useState(0)
  const [researchNotes, setResearchNotes] = useState('')
  const [starStories, setStarStories] = useState([])
  const [interviewLog, setInterviewLog] = useState([])
  const [questions, setQuestions] = useState([])
  const [generating, setGenerating] = useState(false)
  const [quickReview, setQuickReview] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadJobs() }, [])
  useEffect(() => { if (selectedJobId) loadPrep(selectedJobId) }, [selectedJobId])

  useEffect(() => {
    const handler = (e) => {
      if (!quickReview) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setReviewIndex(i => Math.min(i + 1, questions.length - 1))
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setReviewIndex(i => Math.max(i - 1, 0))
      if (e.key === 'Escape') setQuickReview(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [quickReview, questions.length])

  async function loadJobs() {
    const rows = await dbGetAll('jobs')
    setJobs(rows)
    if (rows.length > 0) setSelectedJobId(String(rows[0].id))
  }

  async function loadPrep(jobId) {
    const rows = await dbQuery('SELECT * FROM interview_prep WHERE job_id = ?', [jobId])
    if (rows.length > 0) {
      const p = rows[0]
      setPrep(p)
      setResearchNotes(p.research_notes || '')
      setStarStories(JSON.parse(p.star_stories || '[]'))
      setInterviewLog(JSON.parse(p.interview_log || '[]'))
      setQuestions(JSON.parse(p.questions || '[]'))
    } else {
      setPrep(null)
      setResearchNotes('')
      setStarStories([])
      setInterviewLog([])
      setQuestions([])
    }
  }

  async function savePrep() {
    if (!selectedJobId) return
    setSaving(true)
    try {
      const data = {
        research_notes: researchNotes,
        star_stories: JSON.stringify(starStories),
        interview_log: JSON.stringify(interviewLog),
        questions: JSON.stringify(questions)
      }
      if (prep) {
        await dbRun(
          'UPDATE interview_prep SET research_notes=?, star_stories=?, interview_log=?, questions=?, updated_at=datetime("now") WHERE id=?',
          [data.research_notes, data.star_stories, data.interview_log, data.questions, prep.id]
        )
      } else {
        await dbRun(
          'INSERT INTO interview_prep (job_id, research_notes, star_stories, interview_log, questions) VALUES (?,?,?,?,?)',
          [selectedJobId, data.research_notes, data.star_stories, data.interview_log, data.questions]
        )
      }
      addNotification('Interview prep saved!', 'success')
      loadPrep(selectedJobId)
    } catch (err) {
      addNotification('Save failed: ' + err.message, 'error')
    }
    setSaving(false)
  }

  async function generateQuestions() {
    const job = jobs.find(j => j.id == selectedJobId)
    if (!job) return
    setGenerating(true)
    try {
      const cvData = { skills: job.notes || '', experience: job.notes || '', portfolio: '', education: '' }
      const qs = generateInterviewQuestions(job.notes || job.title, cvData)
      setQuestions(qs.map(q => ({ ...q, answer: '' })))
      addNotification(`Generated ${qs.length} questions!`, 'success')
    } catch (err) {
      addNotification('Generation failed', 'error')
    }
    setGenerating(false)
  }

  function updateQuestion(index, answer) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, answer } : q))
  }

  const selectedJob = jobs.find(j => j.id == selectedJobId)
  const categories = [...new Set(questions.map(q => q.category))]

  if (quickReview && questions.length > 0) {
    const q = questions[reviewIndex]
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 p-8">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <span className="text-slate-400 text-sm">{reviewIndex + 1} / {questions.length}</span>
            <button onClick={() => setQuickReview(false)} className="text-slate-400 hover:text-slate-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
            <span className="inline-block px-3 py-1 bg-blue-900/40 text-blue-300 rounded-full text-sm font-medium mb-6">
              {q.category}
            </span>
            <p className="text-2xl font-semibold text-slate-100 leading-relaxed mb-8">{q.question}</p>
            {q.answer && (
              <div className="text-left bg-slate-900 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">Your prepared answer:</p>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{q.answer}</p>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-8">
            <button onClick={() => setReviewIndex(i => Math.max(i - 1, 0))} disabled={reviewIndex === 0}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 rounded-xl transition-colors flex items-center gap-2">
              ← Previous
            </button>
            <p className="text-slate-500 text-sm self-center">Use arrow keys to navigate</p>
            <button onClick={() => setReviewIndex(i => Math.min(i + 1, questions.length - 1))} disabled={reviewIndex === questions.length - 1}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 rounded-xl transition-colors flex items-center gap-2">
              Next →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Interview Prep</h1>
          <p className="text-slate-400 text-sm">Prepare for your interviews</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100">
            <option value="">Select a job...</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
          </select>
          <button onClick={savePrep} disabled={saving || !selectedJobId}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-xl p-1 w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Research Notes */}
      {tab === 0 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Research Notes</h3>
          <p className="text-xs text-slate-500 mb-3">Research the company, role, industry, and key people. Note interesting facts to bring up in the interview.</p>
          <textarea value={researchNotes} onChange={e => setResearchNotes(e.target.value)}
            rows={20} placeholder="Company background...&#10;Industry trends...&#10;Key people to mention...&#10;Recent news...&#10;Culture and values..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-100" />
        </div>
      )}

      {/* STAR Stories */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Prepare STAR stories to answer behavioural questions.</p>
            <button onClick={() => setStarStories(prev => [...prev, { situation: '', task: '', action: '', result: '' }])}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add STAR Story
            </button>
          </div>
          {starStories.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No STAR stories yet. Add your first one!</div>
          ) : (
            starStories.map((story, i) => (
              <STARCard
                key={i}
                story={story}
                index={i}
                onChange={updated => setStarStories(prev => prev.map((s, j) => j === i ? updated : s))}
                onDelete={() => setStarStories(prev => prev.filter((_, j) => j !== i))}
              />
            ))
          )}
        </div>
      )}

      {/* Question Predictor */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Generate predicted interview questions based on the job description.</p>
              {selectedJob && <p className="text-xs text-slate-500 mt-0.5">{selectedJob.title} at {selectedJob.company}</p>}
            </div>
            <div className="flex gap-2">
              {questions.length > 0 && (
                <button onClick={() => { setQuickReview(true); setReviewIndex(0) }}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quick Review
                </button>
              )}
              <button onClick={generateQuestions} disabled={generating || !selectedJobId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                {generating ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Select a job and click "Generate Questions" to predict interview questions.
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded" />
                  {cat}
                </h3>
                <div className="space-y-3">
                  {questions.filter(q => q.category === cat).map((q, i) => {
                    const globalIdx = questions.indexOf(q)
                    return (
                      <QuestionCard key={i} question={q} index={globalIdx} onAnswerChange={updateQuestion} />
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Interview Log */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Log your interview sessions here.</p>
            <button onClick={() => setInterviewLog(prev => [...prev, { date: new Date().toISOString().split('T')[0], format: 'Video', interviewer: '', notes: '', outcome: '' }])}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
              Add Interview Log
            </button>
          </div>
          {interviewLog.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No interviews logged yet.</div>
          ) : (
            interviewLog.map((log, i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">Interview #{i + 1}</span>
                  <button onClick={() => setInterviewLog(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Date</label>
                    <input type="date" value={log.date}
                      onChange={e => setInterviewLog(prev => prev.map((l, j) => j === i ? {...l, date: e.target.value} : l))}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Format</label>
                    <select value={log.format}
                      onChange={e => setInterviewLog(prev => prev.map((l, j) => j === i ? {...l, format: e.target.value} : l))}
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100">
                      {['Phone', 'Video', 'In-Person', 'Technical', 'Panel'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Interviewer(s)</label>
                    <input type="text" value={log.interviewer}
                      onChange={e => setInterviewLog(prev => prev.map((l, j) => j === i ? {...l, interviewer: e.target.value} : l))}
                      placeholder="Names..."
                      className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Notes</label>
                  <textarea value={log.notes}
                    onChange={e => setInterviewLog(prev => prev.map((l, j) => j === i ? {...l, notes: e.target.value} : l))}
                    rows={3} placeholder="What happened, what was asked..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Outcome</label>
                  <input type="text" value={log.outcome}
                    onChange={e => setInterviewLog(prev => prev.map((l, j) => j === i ? {...l, outcome: e.target.value} : l))}
                    placeholder="Proceed / Rejected / Offer / Pending..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Review tab (shows button to enter full screen) */}
      {tab === 4 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          {questions.length === 0 ? (
            <p className="text-slate-400">Generate questions first (go to Question Predictor tab)</p>
          ) : (
            <>
              <p className="text-slate-300 text-lg">{questions.length} questions ready for review</p>
              <button onClick={() => { setQuickReview(true); setReviewIndex(0) }}
                className="px-8 py-4 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-lg font-semibold transition-colors flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Quick Review Mode
              </button>
              <p className="text-slate-500 text-sm">Use arrow keys to navigate between questions. Press Escape to exit.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
