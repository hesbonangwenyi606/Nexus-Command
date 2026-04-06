import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'

const RELATIONSHIP_COLORS = {
  Warm: 'bg-orange-700/40 text-orange-300',
  Cold: 'bg-slate-700 text-slate-400',
  Mentor: 'bg-purple-700/40 text-purple-300'
}

const TAG_COLORS = {
  Recruiter: 'bg-blue-800/50 text-blue-300',
  'Hiring Manager': 'bg-green-800/50 text-green-300',
  Referral: 'bg-yellow-800/50 text-yellow-300',
  Colleague: 'bg-teal-800/50 text-teal-300',
  Other: 'bg-slate-700 text-slate-400'
}

function ContactForm({ contact, onClose, onSave }) {
  const [form, setForm] = useState({
    name: contact?.name || '',
    company: contact?.company || '',
    role: contact?.role || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    linkedin: contact?.linkedin || '',
    how_met: contact?.how_met || '',
    where_met: contact?.where_met || '',
    relationship: contact?.relationship || 'Cold',
    notes: contact?.notes || '',
    tags: contact?.tags ? (typeof contact.tags === 'string' ? JSON.parse(contact.tags) : contact.tags) : []
  })

  const ALL_TAGS = ['Recruiter', 'Hiring Manager', 'Referral', 'Colleague', 'Other']

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({ ...form, id: contact?.id })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">{contact ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Company</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Role / Title</label>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">LinkedIn URL</label>
              <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">How you met</label>
              <input value={form.how_met} onChange={e => setForm(f => ({ ...f, how_met: e.target.value }))}
                placeholder="e.g. LinkedIn, conference"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Where you met</label>
              <input value={form.where_met} onChange={e => setForm(f => ({ ...f, where_met: e.target.value }))}
                placeholder="e.g. London Tech Meetup"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Relationship Strength</label>
            <div className="flex gap-2">
              {['Cold', 'Warm', 'Mentor'].map(rel => (
                <button key={rel} type="button" onClick={() => setForm(f => ({ ...f, relationship: rel }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.relationship === rel ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {rel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.tags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Any notes about this contact..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
              {contact ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContactDetail({ contact, interactions, onEdit, onDelete, onAddNote, onClose }) {
  const [noteText, setNoteText] = useState('')
  const tags = contact.tags ? (typeof contact.tags === 'string' ? JSON.parse(contact.tags) : contact.tags) : []

  async function addNote() {
    if (!noteText.trim()) return
    await onAddNote(contact.id, noteText.trim())
    setNoteText('')
  }

  return (
    <div className="w-80 border-l border-slate-800 flex flex-col bg-slate-950 flex-shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">Contact Detail</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar & name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
            {contact.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-100">{contact.name}</p>
            {contact.role && <p className="text-xs text-slate-400">{contact.role}</p>}
            {contact.company && <p className="text-xs text-slate-500">{contact.company}</p>}
          </div>
        </div>

        {/* Relationship & tags */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RELATIONSHIP_COLORS[contact.relationship] || RELATIONSHIP_COLORS.Cold}`}>
            {contact.relationship}
          </span>
          {tags.map(tag => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-xs ${TAG_COLORS[tag] || TAG_COLORS.Other}`}>{tag}</span>
          ))}
        </div>

        {/* Contact details */}
        <div className="space-y-2">
          {contact.email && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-slate-300 truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-xs text-slate-300">{contact.phone}</span>
            </div>
          )}
          {contact.linkedin && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 truncate">LinkedIn</a>
            </div>
          )}
          {(contact.how_met || contact.where_met) && (
            <div className="text-xs text-slate-500">
              Met {contact.how_met && `via ${contact.how_met}`}{contact.where_met && ` at ${contact.where_met}`}
            </div>
          )}
        </div>

        {contact.notes && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-xs text-slate-400 whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}

        {/* Interaction timeline */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Timeline</p>
          {interactions.length === 0 ? (
            <p className="text-xs text-slate-600">No interactions yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {interactions.map(i => (
                <div key={i.id} className="flex gap-2">
                  <div className="w-1 bg-slate-700 rounded-full flex-shrink-0 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="pb-2">
                    <p className="text-xs text-slate-300">{i.notes}</p>
                    <p className="text-xs text-slate-600">{new Date(i.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add note */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Add note</p>
          <div className="flex gap-2">
            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
              placeholder="Log an interaction..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500" />
            <button onClick={addNote}
              className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs transition-colors">
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <button onClick={() => onEdit(contact)}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
          Edit
        </button>
        <button onClick={() => onDelete(contact.id)}
          className="px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs transition-colors">
          Delete
        </button>
      </div>
    </div>
  )
}

export default function Contacts() {
  const { addNotification } = useApp()
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRelationship, setFilterRelationship] = useState('All')

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    const rows = await dbGetAll('contacts')
    setContacts(rows)
  }

  async function loadInteractions(contactId) {
    const rows = await dbQuery(
      'SELECT * FROM contact_interactions WHERE contact_id = ? ORDER BY date DESC',
      [contactId]
    )
    setInteractions(rows)
  }

  async function selectContact(contact) {
    setSelected(contact)
    await loadInteractions(contact.id)
  }

  async function saveContact(data) {
    const tagsJson = JSON.stringify(data.tags || [])
    if (data.id) {
      await dbRun(
        'UPDATE contacts SET name=?, company=?, role=?, email=?, phone=?, linkedin=?, how_met=?, where_met=?, relationship=?, notes=?, tags=?, updated_at=datetime("now") WHERE id=?',
        [data.name, data.company, data.role, data.email, data.phone, data.linkedin, data.how_met, data.where_met, data.relationship, data.notes, tagsJson, data.id]
      )
      addNotification('Contact updated!', 'success')
    } else {
      await dbRun(
        'INSERT INTO contacts (name, company, role, email, phone, linkedin, how_met, where_met, relationship, notes, tags) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [data.name, data.company, data.role, data.email, data.phone, data.linkedin, data.how_met, data.where_met, data.relationship, data.notes, tagsJson]
      )
      addNotification('Contact added!', 'success')
    }
    setShowForm(false)
    setEditingContact(null)
    await loadContacts()
  }

  async function deleteContact(id) {
    if (!confirm('Delete this contact?')) return
    await dbRun('DELETE FROM contacts WHERE id = ?', [id])
    await dbRun('DELETE FROM contact_interactions WHERE contact_id = ?', [id])
    setSelected(null)
    addNotification('Contact deleted', 'info')
    await loadContacts()
  }

  async function addInteraction(contactId, note) {
    await dbRun(
      'INSERT INTO contact_interactions (contact_id, type, date, notes) VALUES (?, ?, datetime("now"), ?)',
      [contactId, 'note', note]
    )
    await loadInteractions(contactId)
    addNotification('Note added', 'success')
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    const matchRel = filterRelationship === 'All' || c.relationship === filterRelationship
    return matchSearch && matchRel
  })

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Contacts</h1>
            <p className="text-slate-400 text-sm">{contacts.length} contacts in your network</p>
          </div>
          <input type="text" placeholder="Search contacts..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-sm bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          <div className="flex bg-slate-800 rounded-lg p-1 gap-0.5">
            {['All', 'Warm', 'Cold', 'Mentor'].map(rel => (
              <button key={rel} onClick={() => setFilterRelationship(rel)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterRelationship === rel ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                {rel}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditingContact(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        </div>

        {/* Contacts grid */}
        <div className="flex-1 overflow-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-10 h-10 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-500">No contacts found</p>
              <button onClick={() => { setEditingContact(null); setShowForm(true) }}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                Add your first contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(contact => {
                const tags = contact.tags ? (typeof contact.tags === 'string' ? JSON.parse(contact.tags) : contact.tags) : []
                return (
                  <div key={contact.id}
                    onClick={() => selectContact(contact)}
                    className={`bg-slate-800 rounded-xl p-4 border cursor-pointer transition-all hover:border-slate-600 ${selected?.id === contact.id ? 'border-blue-500' : 'border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {contact.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-100 truncate">{contact.name}</p>
                        {contact.role && <p className="text-xs text-slate-400 truncate">{contact.role}</p>}
                        {contact.company && <p className="text-xs text-slate-500 truncate">{contact.company}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${RELATIONSHIP_COLORS[contact.relationship] || RELATIONSHIP_COLORS.Cold}`}>
                        {contact.relationship}
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {tags.map(tag => (
                          <span key={tag} className={`px-2 py-0.5 rounded-full text-xs ${TAG_COLORS[tag] || TAG_COLORS.Other}`}>{tag}</span>
                        ))}
                      </div>
                    )}
                    {contact.email && (
                      <p className="text-xs text-slate-500 mt-2 truncate">{contact.email}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <ContactDetail
          contact={selected}
          interactions={interactions}
          onEdit={c => { setEditingContact(c); setShowForm(true) }}
          onDelete={deleteContact}
          onAddNote={addInteraction}
          onClose={() => setSelected(null)}
        />
      )}

      {showForm && (
        <ContactForm
          contact={editingContact}
          onClose={() => { setShowForm(false); setEditingContact(null) }}
          onSave={saveContact}
        />
      )}
    </div>
  )
}
