import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'
import { scoreMatch } from '../../utils/matchScorer'

const STEPS = ['Job Details', 'Skill Matching', 'Paragraph Builder', 'Review & Save']

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
              ${i < currentStep ? 'bg-green-600 text-white' :
                i === currentStep ? 'bg-blue-600 text-white' :
                'bg-slate-700 text-slate-500'}`}>
              {i < currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === currentStep ? 'text-blue-400' : i < currentStep ? 'text-green-400' : 'text-slate-500'}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < currentStep ? 'bg-green-600' : 'bg-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function CoverLetterBuilder() {
  const { addNotification } = useApp()
  const [step, setStep] = useState(0)
  const [jobDetails, setJobDetails] = useState({ company: '', title: '', description: '' })
  const [assets, setAssets] = useState([])
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [cvText, setCvText] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [paragraphs, setParagraphs] = useState({
    interest: '',
    experience: '',
    achievement: '',
    fit: '',
    contribution: ''
  })
  const [assembledLetter, setAssembledLetter] = useState('')
  const [matchScore, setMatchScore] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [])

  async function loadAssets() {
    const rows = await dbGetAll('assets')
    setAssets(rows.filter(a => ['CV', 'Portfolio'].includes(a.type)))
  }

  function assembleLetter() {
    const { company, title } = jobDetails
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const letter = `${today}

Hiring Manager
${company}

Dear Hiring Manager,

I am writing to express my strong interest in the ${title} position at ${company}. ${paragraphs.interest}

${paragraphs.experience}

${paragraphs.achievement}

${paragraphs.fit}

${paragraphs.contribution}

I am enthusiastic about the opportunity to contribute to ${company} and would welcome the chance to discuss how my skills and experience align with your needs. Thank you for considering my application.

Sincerely,
[Your Name]`
    setAssembledLetter(letter)
    return letter
  }

  function goToStep(s) {
    if (s === 3) assembleLetter()
    setStep(s)
  }

  async function runMatchScore() {
    if (!jobDetails.description || !cvText) return
    const score = scoreMatch(jobDetails.description, { skills: cvText, experience: cvText })
    setMatchScore(score)
  }

  async function enhanceWithAI() {
    setAiLoading(true)
    try {
      const prompt = `You are a professional cover letter editor. Please improve the following cover letter to make it more compelling, professional, and tailored for a ${jobDetails.title} position at ${jobDetails.company}. Return only the improved letter text.\n\n${assembledLetter}`
      const result = await window.electronAPI.aiQuery({ model: 'llama3', prompt })
      if (result.success) {
        setAssembledLetter(result.response)
        addNotification('Cover letter enhanced with AI!', 'success')
      } else {
        addNotification('AI not available. Make sure Ollama is running.', 'warning')
      }
    } catch (err) {
      addNotification('AI enhancement failed', 'error')
    }
    setAiLoading(false)
  }

  async function saveToDB(status = 'draft') {
    setSaving(true)
    try {
      await dbRun(
        'INSERT INTO cover_letters (company, job_title, job_description, skills, content, status) VALUES (?,?,?,?,?,?)',
        [jobDetails.company, jobDetails.title, jobDetails.description, selectedSkills.join(', '), assembledLetter, status]
      )
      addNotification(`Cover letter saved as ${status}!`, 'success')
    } catch (err) {
      addNotification('Failed to save: ' + err.message, 'error')
    }
    setSaving(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Cover Letter Builder</h1>
        <p className="text-slate-400 text-sm mt-0.5">Build a tailored cover letter in 4 steps</p>
      </div>

      <div className="max-w-3xl">
        <StepIndicator currentStep={step} />

        {/* Step 0: Job Details */}
        {step === 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Step 1: Job Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                <input type="text" value={jobDetails.company}
                  onChange={e => setJobDetails(j => ({...j, company: e.target.value}))}
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Job Title</label>
                <input type="text" value={jobDetails.title}
                  onChange={e => setJobDetails(j => ({...j, title: e.target.value}))}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Job Description</label>
              <textarea value={jobDetails.description}
                onChange={e => setJobDetails(j => ({...j, description: e.target.value}))}
                placeholder="Paste the full job description here..."
                rows={10}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
            <div className="flex justify-end">
              <button onClick={() => goToStep(1)}
                disabled={!jobDetails.company || !jobDetails.title}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                Next: Skill Matching
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Skill Matching */}
        {step === 1 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Step 2: Skill Matching</h2>
            <p className="text-sm text-slate-400">Select your most relevant skills for this role. You can load from a CV asset or enter manually.</p>

            {assets.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-2">Load from CV Asset</label>
                <div className="flex gap-2">
                  <select value={selectedAsset?.id || ''} onChange={e => {
                    const asset = assets.find(a => a.id == e.target.value)
                    setSelectedAsset(asset || null)
                  }} className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100">
                    <option value="">Select a CV/Portfolio...</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button onClick={runMatchScore} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
                    Score Match
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Skills (one per line or comma-separated)</label>
              <textarea value={cvText} onChange={e => setCvText(e.target.value)}
                placeholder="React, Node.js, TypeScript&#10;5 years backend development&#10;AWS, Docker..."
                rows={6}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>

            {matchScore && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-3xl font-bold text-blue-400">{matchScore.overall}%</div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Match Score</p>
                    <p className="text-xs text-slate-500">{matchScore.summary}</p>
                  </div>
                </div>
                {matchScore.matched.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {matchScore.matched.slice(0, 10).map(k => (
                      <span key={k} className="px-2 py-0.5 bg-green-900/40 text-green-300 rounded text-xs">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-2">Select 3-5 key skills to highlight</label>
              <div className="flex flex-wrap gap-2">
                {cvText.split(/[\n,]+/).filter(s => s.trim().length > 0).slice(0, 20).map(skill => {
                  const s = skill.trim()
                  const selected = selectedSkills.includes(s)
                  return (
                    <button key={s} onClick={() => {
                      if (selected) setSelectedSkills(prev => prev.filter(sk => sk !== s))
                      else if (selectedSkills.length < 5) setSelectedSkills(prev => [...prev, s])
                    }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selected ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-500'}`}>
                      {s}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">{selectedSkills.length}/5 skills selected</p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">Back</button>
              <button onClick={() => goToStep(2)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                Next: Build Paragraphs
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Paragraph Builder */}
        {step === 2 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-5">
            <h2 className="text-lg font-semibold text-slate-100">Step 3: Paragraph Builder</h2>
            <p className="text-sm text-slate-400">Answer each prompt to build your cover letter paragraphs.</p>

            {[
              { key: 'interest', label: 'Why are you interested in this company?', hint: '1-2 sentences' },
              { key: 'experience', label: 'What relevant experience do you have?', hint: '2-3 sentences' },
              { key: 'achievement', label: 'Describe a relevant achievement', hint: '2-3 sentences' },
              { key: 'fit', label: 'Why are you the right person for this role?', hint: '1-2 sentences' },
              { key: 'contribution', label: 'How would you contribute to the team?', hint: '1-2 sentences' }
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {label} <span className="text-xs text-slate-500 font-normal">({hint})</span>
                </label>
                <textarea value={paragraphs[key]}
                  onChange={e => setParagraphs(p => ({...p, [key]: e.target.value}))}
                  rows={3}
                  placeholder={`${label}...`}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
              </div>
            ))}

            {selectedSkills.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-400 mb-1">Remember to mention your selected skills:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSkills.map(s => <span key={s} className="px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded text-xs">{s}</span>)}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">Back</button>
              <button onClick={() => goToStep(3)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                Next: Review Letter
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Assembly & Review */}
        {step === 3 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Step 4: Review & Save</h2>
              <button onClick={enhanceWithAI} disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white rounded-lg text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                </svg>
                {aiLoading ? 'Enhancing...' : 'AI Enhance'}
              </button>
            </div>

            <textarea
              value={assembledLetter}
              onChange={e => setAssembledLetter(e.target.value)}
              rows={20}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-100 font-mono"
            />

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">Back</button>
              <div className="flex gap-2">
                <button onClick={() => saveToDB('draft')} disabled={saving}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">
                  Save Draft
                </button>
                <button onClick={() => saveToDB('final')} disabled={saving}
                  className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                  Save Final
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
