import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'

const CONDITION_FIELDS = [
  { value: 'subject', label: 'Subject' },
  { value: 'from_address', label: 'Sender email' },
  { value: 'from_domain', label: 'Sender domain' },
  { value: 'body', label: 'Email body' },
  { value: 'to_address', label: 'Recipient' }
]

const CONDITION_OPERATORS = [
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'equals', label: 'equals' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'matches_domain', label: 'matches domain' }
]

const ACTION_TYPES = [
  { value: 'tag', label: 'Tag email', placeholder: 'e.g. Interview' },
  { value: 'add_to_jobs', label: 'Add to Job Tracker', placeholder: 'Company name (optional)' },
  { value: 'auto_reply', label: 'Auto-reply with template', placeholder: 'Template name' },
  { value: 'mark_read', label: 'Mark as read', placeholder: '' },
  { value: 'add_contact', label: 'Add sender to Contacts', placeholder: '' }
]

const ACTION_COLORS = {
  tag: 'bg-blue-800/40 text-blue-300',
  add_to_jobs: 'bg-green-800/40 text-green-300',
  auto_reply: 'bg-yellow-800/40 text-yellow-300',
  mark_read: 'bg-slate-700 text-slate-400',
  add_contact: 'bg-purple-800/40 text-purple-300'
}

const EXAMPLE_RULES = [
  { name: 'Tag interview emails', condition_field: 'subject', condition_operator: 'contains', condition_value: 'interview', action_type: 'tag', action_value: 'Interview' },
  { name: 'Tag job application replies', condition_field: 'subject', condition_operator: 'contains', condition_value: 'application', action_type: 'tag', action_value: 'Application' },
  { name: 'Mark recruiter emails as priority', condition_field: 'from_domain', condition_operator: 'contains', condition_value: 'recruiting', action_type: 'tag', action_value: 'Priority' }
]

function RuleForm({ rule, onClose, onSave }) {
  const [form, setForm] = useState({
    name: rule?.name || '',
    condition_field: rule?.condition_field || 'subject',
    condition_operator: rule?.condition_operator || 'contains',
    condition_value: rule?.condition_value || '',
    action_type: rule?.action_type || 'tag',
    action_value: rule?.action_value || '',
    active: rule?.active !== undefined ? rule.active : 1
  })

  const selectedAction = ACTION_TYPES.find(a => a.value === form.action_type)
  const needsValue = form.action_type !== 'mark_read' && form.action_type !== 'add_contact'

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.condition_value.trim()) return
    onSave({ ...form, id: rule?.id })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">{rule ? 'Edit Rule' : 'New Automation Rule'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Rule Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Tag interview emails"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">IF</label>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Field</label>
                  <select value={form.condition_field} onChange={e => setForm(f => ({ ...f, condition_field: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    {CONDITION_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Condition</label>
                  <select value={form.condition_operator} onChange={e => setForm(f => ({ ...f, condition_operator: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    {CONDITION_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Value *</label>
                <input required value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))}
                  placeholder="Enter match value..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">THEN</label>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Action</label>
                <select value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value, action_value: '' }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                  {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              {needsValue && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Value</label>
                  <input value={form.action_value} onChange={e => setForm(f => ({ ...f, action_value: e.target.value }))}
                    placeholder={selectedAction?.placeholder || ''}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-300 flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.active === 1} onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
              Rule is active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
              {rule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AutomationRules() {
  const { addNotification } = useApp()
  const [rules, setRules] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [runLog, setRunLog] = useState([])

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    const rows = await dbGetAll('automation_rules')
    setRules(rows)
  }

  async function saveRule(data) {
    if (data.id) {
      await dbRun(
        'UPDATE automation_rules SET name=?, condition_field=?, condition_operator=?, condition_value=?, action_type=?, action_value=?, active=? WHERE id=?',
        [data.name, data.condition_field, data.condition_operator, data.condition_value, data.action_type, data.action_value, data.active, data.id]
      )
      addNotification('Rule updated!', 'success')
    } else {
      await dbRun(
        'INSERT INTO automation_rules (name, condition_field, condition_operator, condition_value, action_type, action_value, active) VALUES (?,?,?,?,?,?,?)',
        [data.name, data.condition_field, data.condition_operator, data.condition_value, data.action_type, data.action_value, data.active]
      )
      addNotification('Rule created!', 'success')
    }
    setShowForm(false)
    setEditingRule(null)
    loadRules()
  }

  async function toggleRule(rule) {
    const newActive = rule.active ? 0 : 1
    await dbRun('UPDATE automation_rules SET active = ? WHERE id = ?', [newActive, rule.id])
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: newActive } : r))
  }

  async function deleteRule(id) {
    if (!confirm('Delete this rule?')) return
    await dbRun('DELETE FROM automation_rules WHERE id = ?', [id])
    loadRules()
    addNotification('Rule deleted', 'info')
  }

  async function runAllRules() {
    setLoading(true)
    const log = []
    try {
      const activeRules = rules.filter(r => r.active)
      if (activeRules.length === 0) {
        log.push('No active rules to run.')
      } else {
        const emails = await dbQuery('SELECT * FROM emails ORDER BY date DESC LIMIT 200', [])
        let processed = 0
        for (const email of emails) {
          for (const rule of activeRules) {
            const matched = evaluateCondition(email, rule)
            if (matched) {
              await applyAction(email, rule)
              log.push(`Rule "${rule.name}" matched email: "${email.subject}"`)
              processed++
            }
          }
        }
        log.push(`Done. Applied ${processed} rule action(s) across ${emails.length} emails.`)
      }
    } catch (err) {
      log.push(`Error: ${err.message}`)
    }
    setRunLog(log)
    setLoading(false)
  }

  function evaluateCondition(email, rule) {
    let fieldValue = ''
    switch (rule.condition_field) {
      case 'subject': fieldValue = email.subject || ''; break
      case 'from_address': fieldValue = email.from_address || ''; break
      case 'from_domain': fieldValue = (email.from_address || '').split('@')[1] || ''; break
      case 'body': fieldValue = email.body_text || ''; break
      case 'to_address': fieldValue = email.to_address || ''; break
      default: return false
    }
    fieldValue = fieldValue.toLowerCase()
    const val = (rule.condition_value || '').toLowerCase()
    switch (rule.condition_operator) {
      case 'contains': return fieldValue.includes(val)
      case 'not_contains': return !fieldValue.includes(val)
      case 'equals': return fieldValue === val
      case 'starts_with': return fieldValue.startsWith(val)
      case 'ends_with': return fieldValue.endsWith(val)
      case 'matches_domain': return fieldValue === val || fieldValue.endsWith('.' + val)
      default: return false
    }
  }

  async function applyAction(email, rule) {
    switch (rule.action_type) {
      case 'tag': {
        const existing = email.tags ? JSON.parse(email.tags) : []
        if (!existing.includes(rule.action_value)) {
          existing.push(rule.action_value)
          await dbRun('UPDATE emails SET tags = ? WHERE id = ?', [JSON.stringify(existing), email.id])
        }
        break
      }
      case 'mark_read':
        await dbRun('UPDATE emails SET is_read = 1 WHERE id = ?', [email.id])
        break
      case 'add_to_jobs': {
        const company = rule.action_value || email.from_name || 'Unknown'
        const existing = await dbQuery('SELECT id FROM jobs WHERE company = ? AND title = ?', [company, email.subject])
        if (!existing.length) {
          await dbRun('INSERT INTO jobs (company, title, status) VALUES (?, ?, ?)', [company, email.subject, 'Saved'])
        }
        break
      }
      case 'add_contact': {
        const existing = await dbQuery('SELECT id FROM contacts WHERE email = ?', [email.from_address])
        if (!existing.length) {
          await dbRun('INSERT INTO contacts (name, email, relationship) VALUES (?, ?, ?)', [email.from_name || email.from_address, email.from_address, 'Cold'])
        }
        break
      }
      default: break
    }
  }

  async function addExampleRule(example) {
    await dbRun(
      'INSERT INTO automation_rules (name, condition_field, condition_operator, condition_value, action_type, action_value, active) VALUES (?,?,?,?,?,?,?)',
      [example.name, example.condition_field, example.condition_operator, example.condition_value, example.action_type, example.action_value, 1]
    )
    addNotification('Example rule added!', 'success')
    loadRules()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Automation Rules</h1>
          <p className="text-slate-400 text-sm">IF-THEN rules that run when emails are synced</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAllRules}
            disabled={loading || rules.filter(r => r.active).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {loading ? 'Running...' : 'Run All Rules'}
          </button>
          <button onClick={() => { setEditingRule(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Rule
          </button>
        </div>
      </div>

      {/* Run log */}
      {runLog.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-300">Last Run Log</h3>
            <button onClick={() => setRunLog([])} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {runLog.map((line, i) => (
              <p key={i} className="text-xs text-slate-400 font-mono">{line}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Rules list */}
        <div className="col-span-2 space-y-3">
          {rules.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
              <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-slate-500 mb-2">No rules yet</p>
              <p className="text-xs text-slate-600 mb-4">Create rules to automate repetitive email tasks</p>
              <button onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                Create your first rule
              </button>
            </div>
          ) : (
            rules.map(rule => {
              const condField = CONDITION_FIELDS.find(f => f.value === rule.condition_field)
              const condOp = CONDITION_OPERATORS.find(o => o.value === rule.condition_operator)
              const action = ACTION_TYPES.find(a => a.value === rule.action_type)
              return (
                <div key={rule.id}
                  className={`bg-slate-800 rounded-xl p-4 border transition-colors ${rule.active ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                  <div className="flex items-start gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleRule(rule)}
                      className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors mt-0.5 ${rule.active ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-100">{rule.name}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">
                          IF {condField?.label} {condOp?.label} "{rule.condition_value}"
                        </span>
                        <svg className="w-3 h-3 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${ACTION_COLORS[rule.action_type] || 'bg-slate-700 text-slate-300'}`}>
                          THEN {action?.label}{rule.action_value ? `: "${rule.action_value}"` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setEditingRule(rule); setShowForm(true) }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteRule(rule.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Examples sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">How Rules Work</h3>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex gap-2">
                <span className="text-yellow-400">1.</span>
                <p>Rules run automatically when emails are synced from your inbox.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-yellow-400">2.</span>
                <p>Each rule checks a condition against incoming emails.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-yellow-400">3.</span>
                <p>If the condition matches, the action is applied instantly.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-yellow-400">4.</span>
                <p>Use "Run All Rules" to apply rules to existing emails.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Example Rules</h3>
            <div className="space-y-2">
              {EXAMPLE_RULES.map((ex, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2 bg-slate-700/40 rounded-lg">
                  <p className="text-xs text-slate-300 flex-1">{ex.name}</p>
                  <button onClick={() => addExampleRule(ex)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0 font-medium">
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total rules</span>
                <span className="text-slate-200">{rules.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Active rules</span>
                <span className="text-green-400">{rules.filter(r => r.active).length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Paused rules</span>
                <span className="text-slate-500">{rules.filter(r => !r.active).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <RuleForm
          rule={editingRule}
          onClose={() => { setShowForm(false); setEditingRule(null) }}
          onSave={saveRule}
        />
      )}
    </div>
  )
}
