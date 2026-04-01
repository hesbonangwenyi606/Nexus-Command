import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'

const PLACEHOLDERS = [
  { label: '{{contact_name}}', desc: 'Contact full name' },
  { label: '{{company_name}}', desc: 'Company name' },
  { label: '{{job_title}}', desc: 'Job title' },
  { label: '{{date}}', desc: 'Today\'s date' },
  { label: '{{sender_name}}', desc: 'Your name' }
]

function renderTemplate(body, sampleData) {
  return body
    .replace(/\{\{contact_name\}\}/g, sampleData.contact_name || 'Jane Smith')
    .replace(/\{\{company_name\}\}/g, sampleData.company_name || 'Acme Corp')
    .replace(/\{\{job_title\}\}/g, sampleData.job_title || 'Software Engineer')
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
    .replace(/\{\{sender_name\}\}/g, sampleData.sender_name || 'Your Name')
}

function TemplateModal({ template, onClose, onSave }) {
  const [form, setForm] = useState(template || { name: '', subject: '', body: '', tags: '[]' })
  const [tags, setTags] = useState(template?.tags ? JSON.parse(template.tags) : [])
  const [tagInput, setTagInput] = useState('')
  const [preview, setPreview] = useState(false)

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      setForm(f => ({ ...f, tags: JSON.stringify(newTags) }))
      setTagInput('')
    }
  }

  function removeTag(tag) {
    const newTags = tags.filter(t => t !== tag)
    setTags(newTags)
    setForm(f => ({ ...f, tags: JSON.stringify(newTags) }))
  }

  function insertPlaceholder(ph) {
    setForm(f => ({ ...f, body: f.body + ph }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 w-[700px] max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-100">{template ? 'Edit Template' : 'New Template'}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(!preview)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${preview ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {preview ? (
          <div className="space-y-3">
            <div className="bg-slate-900 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">Subject</p>
              <p className="text-slate-200">{renderTemplate(form.subject, {})}</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-2">Body</p>
              <pre className="text-slate-200 text-sm whitespace-pre-wrap font-sans">{renderTemplate(form.body, {})}</pre>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Template Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="e.g. Job Application Follow-up"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Subject Line</label>
              <input type="text" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))}
                placeholder="e.g. Following up on my application for {{job_title}}"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Body</label>
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({...f, body: e.target.value}))}
                rows={10}
                placeholder="Dear {{contact_name}},&#10;&#10;I hope this email finds you well..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-2">Insert Placeholder</label>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map(p => (
                  <button key={p.label} onClick={() => insertPlaceholder(p.label)}
                    title={p.desc}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-mono transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Add tag..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-100" />
                <button onClick={addTag} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm">Add</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded text-xs">
                    {t}
                    <button onClick={() => removeTag(t)} className="text-blue-400 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">Save Template</button>
        </div>
      </div>
    </div>
  )
}

export default function Templates() {
  const { addNotification } = useApp()
  const [templates, setTemplates] = useState([])
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [allTags, setAllTags] = useState([])

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    const rows = await dbGetAll('templates')
    setTemplates(rows)
    const tags = new Set()
    rows.forEach(r => {
      try { JSON.parse(r.tags || '[]').forEach(t => tags.add(t)) } catch(e) {}
    })
    setAllTags([...tags])
  }

  async function saveTemplate(form) {
    if (!form.name) { addNotification('Template name is required', 'error'); return }
    if (form.id) {
      await dbRun('UPDATE templates SET name=?, subject=?, body=?, tags=?, updated_at=datetime("now") WHERE id=?',
        [form.name, form.subject, form.body, form.tags, form.id])
    } else {
      await dbRun('INSERT INTO templates (name, subject, body, tags) VALUES (?,?,?,?)',
        [form.name, form.subject || '', form.body || '', form.tags || '[]'])
    }
    setShowModal(false)
    setEditingTemplate(null)
    loadTemplates()
    addNotification('Template saved!', 'success')
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return
    await dbRun('DELETE FROM templates WHERE id = ?', [id])
    loadTemplates()
    addNotification('Template deleted', 'info')
  }

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    const matchTag = !filterTag || (JSON.parse(t.tags || '[]')).includes(filterTag)
    return matchSearch && matchTag
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Templates</h1>
          <p className="text-slate-400 text-sm mt-0.5">Reusable email and message templates</p>
        </div>
        <button onClick={() => { setEditingTemplate(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Search templates..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500" />
        <div className="flex gap-2">
          <button onClick={() => setFilterTag(null)}
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${!filterTag ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            All
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag === filterTag ? null : tag)}
              className={`px-3 py-2 rounded-lg text-xs transition-colors ${filterTag === tag ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm">No templates yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(tmpl => {
            const tags = JSON.parse(tmpl.tags || '[]')
            return (
              <div key={tmpl.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-100">{tmpl.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingTemplate(tmpl); setShowModal(true) }}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteTemplate(tmpl.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {tmpl.subject && (
                  <p className="text-sm text-slate-400 mb-2 italic">{tmpl.subject}</p>
                )}
                <p className="text-sm text-slate-500 line-clamp-3 mb-3">
                  {tmpl.body?.slice(0, 150)}{tmpl.body?.length > 150 ? '...' : ''}
                </p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
                  Updated {new Date(tmpl.updated_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setShowModal(false); setEditingTemplate(null) }}
          onSave={saveTemplate}
        />
      )}
    </div>
  )
}
