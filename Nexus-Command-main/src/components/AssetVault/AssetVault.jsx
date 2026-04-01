import React, { useState, useEffect } from 'react'
import { useApp } from '../../App'
import { dbQuery, dbRun, dbGetAll } from '../../database/db'

const TYPES = ['CV', 'Portfolio', 'Cover Letter', 'Certificate', 'Reference', 'Other']
const TYPE_COLORS = {
  CV: 'bg-blue-900/40 text-blue-300',
  Portfolio: 'bg-purple-900/40 text-purple-300',
  'Cover Letter': 'bg-green-900/40 text-green-300',
  Certificate: 'bg-yellow-900/40 text-yellow-300',
  Reference: 'bg-cyan-900/40 text-cyan-300',
  Other: 'bg-slate-700 text-slate-400'
}

function PDFProtectModal({ asset, onClose, onProtected }) {
  const { addNotification } = useApp()
  const [password, setPassword] = useState('')
  const [protecting, setProtecting] = useState(false)
  const [result, setResult] = useState(null)

  async function protect() {
    if (!password) { addNotification('Please enter a password', 'error'); return }
    setProtecting(true)
    try {
      const res = await window.electronAPI.protectPDF({ filePath: asset.file_path, password })
      if (res.success) {
        setResult(res)
        onProtected(res.outputPath, password)
      } else {
        addNotification(`PDF protection failed: ${res.error}`, 'error')
      }
    } catch (err) {
      addNotification(err.message, 'error')
    }
    setProtecting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 w-96 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-100 mb-3">Protect PDF</h3>
        <p className="text-sm text-slate-400 mb-4">Add a password to <strong>{asset.name}</strong> before attaching.</p>
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1">PDF Password</label>
          <input type="text" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Enter protection password"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100" />
          <p className="text-xs text-slate-500 mt-1">This password will be included in your email body automatically.</p>
        </div>
        {result && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
            <p className="text-xs text-green-300">PDF protected successfully! Temp file created.</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={protect} disabled={protecting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg text-sm transition-colors">
            {protecting ? 'Protecting...' : 'Protect & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AssetVault() {
  const { addNotification } = useApp()
  const [assets, setAssets] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState(null)
  const [editingAsset, setEditingAsset] = useState(null)
  const [showProtect, setShowProtect] = useState(null)

  useEffect(() => { loadAssets() }, [])

  async function loadAssets() {
    const rows = await dbGetAll('assets')
    setAssets(rows)
  }

  async function linkFile() {
    const result = await window.electronAPI.openDialog({
      filters: [
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const name = filePath.split(/[\\/]/).pop()
      const ext = name.split('.').pop().toLowerCase()
      let type = 'Other'
      if (name.toLowerCase().includes('cv') || name.toLowerCase().includes('resume')) type = 'CV'
      else if (name.toLowerCase().includes('cover')) type = 'Cover Letter'
      else if (name.toLowerCase().includes('portfolio')) type = 'Portfolio'

      await dbRun('INSERT INTO assets (name, type, file_path) VALUES (?,?,?)', [name, type, filePath])
      loadAssets()
      addNotification('File linked to vault!', 'success')
    }
  }

  async function openFile(filePath) {
    const result = await window.electronAPI.openFile(filePath)
    if (!result.success) addNotification(`Cannot open file: ${result.error}`, 'error')
  }

  async function deleteAsset(id) {
    if (!confirm('Remove this file from the vault? (The actual file will not be deleted)')) return
    await dbRun('DELETE FROM assets WHERE id = ?', [id])
    loadAssets()
    addNotification('Asset removed from vault', 'info')
  }

  async function saveEdit(asset) {
    await dbRun('UPDATE assets SET name=?, type=?, description=?, tags=? WHERE id=?',
      [asset.name, asset.type, asset.description, asset.tags, asset.id])
    setEditingAsset(null)
    loadAssets()
    addNotification('Asset updated', 'success')
  }

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || a.type === filterType
    return matchSearch && matchType
  })

  const getFileIcon = (filePath) => {
    const ext = (filePath || '').split('.').pop().toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['doc', 'docx'].includes(ext)) return '📝'
    if (['png', 'jpg', 'jpeg'].includes(ext)) return '🖼️'
    return '📁'
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Asset Vault</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your CVs, portfolios, and documents</p>
        </div>
        <button onClick={linkFile}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Link File
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Search assets..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500" />
        <div className="flex gap-2">
          <button onClick={() => setFilterType(null)}
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${!filterType ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            All
          </button>
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t === filterType ? null : t)}
              className={`px-3 py-2 rounded-lg text-xs transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-sm">No files in vault. Click "Link File" to add documents.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(asset => (
            <div key={asset.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
              {editingAsset?.id === asset.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Name</label>
                      <input type="text" value={editingAsset.name}
                        onChange={e => setEditingAsset(a => ({...a, name: e.target.value}))}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Type</label>
                      <select value={editingAsset.type}
                        onChange={e => setEditingAsset(a => ({...a, type: e.target.value}))}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100">
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <input type="text" value={editingAsset.description || ''}
                    onChange={e => setEditingAsset(a => ({...a, description: e.target.value}))}
                    placeholder="Description..."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-100" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingAsset(null)} className="px-3 py-1.5 bg-slate-700 text-slate-200 rounded text-sm">Cancel</button>
                    <button onClick={() => saveEdit(editingAsset)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{getFileIcon(asset.file_path)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-slate-100">{asset.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[asset.type] || TYPE_COLORS.Other}`}>
                        {asset.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{asset.file_path}</p>
                    {asset.description && <p className="text-xs text-slate-400 mt-0.5">{asset.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openFile(asset.file_path)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </button>
                    {(asset.file_path || '').toLowerCase().endsWith('.pdf') && (
                      <button onClick={() => setShowProtect(asset)}
                        className="px-3 py-1.5 bg-yellow-700/50 hover:bg-yellow-700/70 text-yellow-300 rounded-lg text-xs transition-colors flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Protect
                      </button>
                    )}
                    <button onClick={() => setEditingAsset(asset)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteAsset(asset.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showProtect && (
        <PDFProtectModal
          asset={showProtect}
          onClose={() => setShowProtect(null)}
          onProtected={(outputPath, password) => {
            addNotification(`PDF protected! Password: ${password}`, 'success', 8000)
            setShowProtect(null)
          }}
        />
      )}
    </div>
  )
}
