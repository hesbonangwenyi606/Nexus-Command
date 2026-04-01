import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbGetAll } from '../../database/db'
import { scoreMatch } from '../../utils/matchScorer'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

function ScoreRing({ score }) {
  const data = {
    datasets: [{
      data: [score, 100 - score],
      backgroundColor: [
        score >= 70 ? '#22c55e' : score >= 50 ? '#3b82f6' : score >= 30 ? '#eab308' : '#ef4444',
        '#1e293b'
      ],
      borderWidth: 0,
      cutout: '78%'
    }]
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  }
  const color = score >= 70 ? 'text-green-400' : score >= 50 ? 'text-blue-400' : score >= 30 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, weight, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{weight}% weight</span>
          <span className="text-sm font-semibold text-slate-200">{score}%</span>
        </div>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function MatchScorer() {
  const { addNotification } = useApp()
  const [jobDescription, setJobDescription] = useState('')
  const [assets, setAssets] = useState([])
  const [selectedAssets, setSelectedAssets] = useState([])
  const [cvText, setCvText] = useState('')
  const [result, setResult] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState('')

  useEffect(() => {
    loadAssets()
  }, [])

  async function loadAssets() {
    const rows = await dbGetAll('assets')
    setAssets(rows)
  }

  async function runScore() {
    if (!jobDescription.trim()) {
      addNotification('Please paste a job description', 'error')
      return
    }
    setScoring(true)
    try {
      const cvData = {
        skills: cvText,
        experience: cvText,
        portfolio: cvText,
        education: cvText
      }
      const score = scoreMatch(jobDescription, cvData)
      setResult(score)
    } catch (err) {
      addNotification('Scoring failed: ' + err.message, 'error')
    }
    setScoring(false)
  }

  async function getAISuggestions() {
    if (!result) return
    setAiLoading(true)
    try {
      const prompt = `I have a CV and am applying for a job. My CV match score is ${result.overall}%.
Matched keywords: ${result.matched.slice(0, 10).join(', ')}.
Missing keywords from job: ${result.gaps.slice(0, 10).join(', ')}.
Job description summary: ${jobDescription.slice(0, 500)}.

Please give me 5 specific, actionable recommendations to improve my application and close the gaps.`

      const res = await window.electronAPI.aiQuery({ model: 'llama3', prompt })
      if (res.success) {
        setAiSuggestions(res.response)
      } else {
        addNotification('AI not available. Make sure Ollama is running.', 'warning')
      }
    } catch (err) {
      addNotification('AI request failed', 'error')
    }
    setAiLoading(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Match Scorer</h1>
        <p className="text-slate-400 text-sm mt-0.5">Score how well your CV matches a job description</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              rows={12}
              placeholder="Paste the full job description here..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Your CV / Skills</label>
            {assets.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-2">Select assets to score against:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {assets.map(a => (
                    <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedAssets.includes(a.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedAssets(prev => [...prev, a.id])
                          else setSelectedAssets(prev => prev.filter(id => id !== a.id))
                        }}
                        className="accent-blue-500"
                      />
                      <span className="text-xs text-slate-300">{a.name}</span>
                      <span className="text-xs text-slate-500">({a.type})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              rows={8}
              placeholder="Paste your CV text, skills, and experience here..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <button
            onClick={runScore}
            disabled={scoring || !jobDescription.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {scoring ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scoring...</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Score Match
              </>
            )}
          </button>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {!result ? (
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Run a match score to see results</p>
            </div>
          ) : (
            <>
              {/* Overall score */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Overall Match Score</h3>
                <div className="flex items-center gap-6">
                  <ScoreRing score={result.overall} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Score Breakdown</h3>
                <ScoreBar label="Skills" score={result.breakdown.skills} weight={40} color="bg-blue-500" />
                <ScoreBar label="Experience" score={result.breakdown.experience} weight={30} color="bg-purple-500" />
                <ScoreBar label="Portfolio" score={result.breakdown.portfolio} weight={20} color="bg-cyan-500" />
                <ScoreBar label="Education" score={result.breakdown.education} weight={10} color="bg-green-500" />
              </div>

              {/* Matched keywords */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Matched Keywords <span className="text-slate-500 font-normal">({result.matched.length})</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched.slice(0, 30).map(k => (
                    <span key={k} className="px-2 py-0.5 bg-green-900/40 text-green-300 border border-green-800 rounded text-xs">{k}</span>
                  ))}
                </div>
              </div>

              {/* Gaps */}
              {result.gaps.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">
                    Gaps to Address <span className="text-slate-500 font-normal">({result.gaps.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.gaps.slice(0, 20).map((k, i) => (
                      <span key={k} className={`px-2 py-0.5 rounded text-xs ${i < 5 ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-slate-700 text-slate-400'}`}>
                        {i < 5 && <span className="text-red-500 mr-1">!</span>}
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300">AI Improvement Suggestions</h3>
                  <button onClick={getAISuggestions} disabled={aiLoading}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white rounded-lg text-xs transition-colors flex items-center gap-1.5">
                    {aiLoading ? 'Loading...' : 'Get AI Suggestions'}
                  </button>
                </div>
                {aiSuggestions ? (
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{aiSuggestions}</pre>
                ) : (
                  <p className="text-xs text-slate-500">Click to get AI-powered recommendations (requires Ollama)</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
