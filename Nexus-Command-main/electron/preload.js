const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // Convenience wrappers
  dbInit: (data) => ipcRenderer.invoke('db:init', data),
  dbVerify: (data) => ipcRenderer.invoke('db:verify', data),
  dbExists: () => ipcRenderer.invoke('db:exists'),
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
  dbRun: (sql, params) => ipcRenderer.invoke('db:run', { sql, params }),
  dbGetAll: (table, where, params) => ipcRenderer.invoke('db:getAll', { table, where, params }),

  // Email
  fetchIMAP: (config) => ipcRenderer.invoke('email:fetchIMAP', config),
  sendEmail: (data) => ipcRenderer.invoke('email:send', data),

  // Files
  openDialog: (options) => ipcRenderer.invoke('file:openDialog', options),
  openFile: (filePath) => ipcRenderer.invoke('file:open', filePath),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  // PDF
  protectPDF: (data) => ipcRenderer.invoke('pdf:protect', data),

  // AI
  aiQuery: (data) => ipcRenderer.invoke('ai:query', data),
  aiGetModels: () => ipcRenderer.invoke('ai:getModels'),
  aiPing: () => ipcRenderer.invoke('ai:ping'),

  // Analytics
  trackSection: (section) => ipcRenderer.invoke('analytics:trackSection', { section }),
  endSection: () => ipcRenderer.invoke('analytics:endSection'),
  getWindowTitle: () => ipcRenderer.invoke('analytics:getWindowTitle'),

  // Notifications
  scheduleNotification: (data) => ipcRenderer.invoke('notification:schedule', data),

  // App
  getAppData: () => ipcRenderer.invoke('app:getData'),
  changePassword: (data) => ipcRenderer.invoke('app:changePassword', data),

  // Event listeners
  onWindowFocus: (callback) => {
    ipcRenderer.on('window:focus', callback)
    return () => ipcRenderer.removeListener('window:focus', callback)
  },
  onWindowBlur: (callback) => {
    ipcRenderer.on('window:blur', callback)
    return () => ipcRenderer.removeListener('window:blur', callback)
  },
  onWindowTitle: (callback) => {
    ipcRenderer.on('analytics:windowTitle', (event, title) => callback(title))
    return () => ipcRenderer.removeAllListeners('analytics:windowTitle')
  }
})
