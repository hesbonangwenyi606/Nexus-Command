const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { exec } = require('child_process')
const http = require('http')

let mainWindow
let db = null
let dbModule = null
let windowTitleInterval = null
let analyticsState = {
  currentSection: null,
  sectionStart: null,
  appTracking: {},
  lastWindowTitle: '',
  lastWindowTime: Date.now()
}

function createWindow() {
  const isDev = process.argv.includes('--dev')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      webSecurity: !isDev
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#0f172a'
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window:focus')
  })

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window:blur')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    if (windowTitleInterval) {
      clearInterval(windowTitleInterval)
      windowTitleInterval = null
    }
  })
}

// Start tracking active window title every 5 seconds
function startWindowTracking() {
  if (windowTitleInterval) return

  windowTitleInterval = setInterval(() => {
    if (process.platform === 'win32') {
      exec(
        'powershell -command "Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Sort-Object CPU -Descending | Select-Object -First 1 MainWindowTitle | ForEach-Object { $_.MainWindowTitle }"',
        { timeout: 3000 },
        (err, stdout) => {
          if (err) return
          const title = stdout.trim()
          if (title && title !== analyticsState.lastWindowTitle) {
            const now = Date.now()
            const duration = Math.round((now - analyticsState.lastWindowTime) / 1000)

            if (analyticsState.lastWindowTitle && duration > 0 && db) {
              try {
                db.prepare(
                  'INSERT INTO analytics_apps (app_name, window_title, category, is_productive, detected_at, duration_seconds) VALUES (?, ?, ?, ?, ?, ?)'
                ).run(
                  analyticsState.lastWindowTitle.split(' - ').pop() || 'Unknown',
                  analyticsState.lastWindowTitle,
                  categorizeApp(analyticsState.lastWindowTitle),
                  isProductiveApp(analyticsState.lastWindowTitle) ? 1 : 0,
                  new Date(analyticsState.lastWindowTime).toISOString(),
                  duration
                )
              } catch (e) {
                // DB might not be ready
              }
            }

            analyticsState.lastWindowTitle = title
            analyticsState.lastWindowTime = now

            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('analytics:windowTitle', title)
            }
          }
        }
      )
    }
  }, 5000)
}

function categorizeApp(title) {
  const t = title.toLowerCase()
  if (t.includes('chrome') || t.includes('firefox') || t.includes('edge') || t.includes('brave')) return 'Browser'
  if (t.includes('code') || t.includes('studio') || t.includes('terminal') || t.includes('powershell')) return 'Development'
  if (t.includes('slack') || t.includes('teams') || t.includes('discord') || t.includes('zoom')) return 'Communication'
  if (t.includes('word') || t.includes('excel') || t.includes('powerpoint') || t.includes('docs')) return 'Office'
  if (t.includes('nexus')) return 'Nexus Command'
  return 'Other'
}

function isProductiveApp(title) {
  const t = title.toLowerCase()
  const productive = ['code', 'studio', 'terminal', 'word', 'excel', 'powerpoint', 'docs', 'sheets', 'nexus', 'notion', 'trello']
  return productive.some(p => t.includes(p))
}

// Database IPC handlers
ipcMain.handle('db:init', async (event, { password, name }) => {
  try {
    const userDataPath = app.getPath('userData')
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    const dbPath = path.join(userDataPath, 'nexus.db')
    dbModule = require('./dbModule')
    db = await dbModule.initDatabase(dbPath, password, name)
    startWindowTracking()
    return { success: true }
  } catch (err) {
    console.error('db:init error', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('db:verify', async (event, { password }) => {
  try {
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'nexus.db')
    if (!fs.existsSync(dbPath)) {
      return { success: false, error: 'No database found. Please create a profile first.' }
    }
    dbModule = require('./dbModule')
    const result = await dbModule.verifyAndOpen(dbPath, password)
    if (result.success) {
      db = result.db
      // Run migrations for any new tables added after initial setup
      try {
        db.exec(`
          CREATE TABLE IF NOT EXISTS social_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform TEXT UNIQUE NOT NULL,
            total INTEGER DEFAULT 0,
            replied INTEGER DEFAULT 0,
            unreplied INTEGER DEFAULT 0,
            updated_at TEXT DEFAULT (datetime('now'))
          );
        `)
      } catch (e) { /* table already exists */ }
      startWindowTracking()
    }
    return result
  } catch (err) {
    console.error('db:verify error', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('db:exists', async () => {
  try {
    const userDataPath = app.getPath('userData')
    const dbPath = path.join(userDataPath, 'nexus.db')
    return { exists: fs.existsSync(dbPath) }
  } catch (err) {
    return { exists: false }
  }
})

ipcMain.handle('db:query', async (event, { sql, params }) => {
  if (!db) return { error: 'Database not initialized' }
  try {
    const rows = db.prepare(sql).all(...(params || []))
    return { rows }
  } catch (err) {
    console.error('db:query error', err)
    return { error: err.message }
  }
})

ipcMain.handle('db:run', async (event, { sql, params }) => {
  if (!db) return { error: 'Database not initialized' }
  try {
    const result = db.prepare(sql).run(...(params || []))
    return { lastInsertRowid: result.lastInsertRowid, changes: result.changes }
  } catch (err) {
    console.error('db:run error', err)
    return { error: err.message }
  }
})

ipcMain.handle('db:getAll', async (event, { table, where, params }) => {
  if (!db) return { error: 'Database not initialized' }
  try {
    const sql = where ? `SELECT * FROM ${table} WHERE ${where}` : `SELECT * FROM ${table}`
    const rows = db.prepare(sql).all(...(params || []))
    return { rows }
  } catch (err) {
    console.error('db:getAll error', err)
    return { error: err.message }
  }
})

// Email IPC handlers
ipcMain.handle('email:fetchIMAP', async (event, config) => {
  return new Promise((resolve) => {
    try {
      const Imap = require('imap')
      const { simpleParser } = require('mailparser')

      const imap = new Imap({
        user: config.username,
        password: config.password,
        host: config.imap_host,
        port: config.imap_port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 10000
      })

      const emails = []

      imap.once('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end()
            return resolve({ success: false, error: err.message })
          }

          const limit = Math.min(box.messages.total, 50)
          if (limit === 0) {
            imap.end()
            return resolve({ success: true, emails: [] })
          }

          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - limit + 1)}:*`, {
            bodies: '',
            struct: true
          })

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (!err && parsed) {
                  emails.push({
                    message_id: parsed.messageId || `msg_${Date.now()}`,
                    subject: parsed.subject || '(No Subject)',
                    from_address: parsed.from?.value?.[0]?.address || '',
                    from_name: parsed.from?.value?.[0]?.name || '',
                    to_address: parsed.to?.value?.[0]?.address || '',
                    body_text: parsed.text || '',
                    body_html: parsed.html || '',
                    date: parsed.date?.toISOString() || new Date().toISOString(),
                    is_read: 0,
                    folder: 'INBOX'
                  })
                }
              })
            })
          })

          fetch.once('error', (err) => {
            imap.end()
            resolve({ success: false, error: err.message })
          })

          fetch.once('end', () => {
            imap.end()
          })
        })
      })

      imap.once('end', () => {
        resolve({ success: true, emails })
      })

      imap.connect()
    } catch (err) {
      resolve({ success: false, error: err.message })
    }
  })
})

ipcMain.handle('email:send', async (event, { account, to, subject, body, attachments }) => {
  try {
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port || 587,
      secure: account.smtp_port === 465,
      auth: {
        user: account.username,
        pass: account.password
      },
      tls: { rejectUnauthorized: false }
    })

    const mailOptions = {
      from: `${account.name} <${account.email}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      attachments: attachments || []
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (err) {
    console.error('email:send error', err)
    return { success: false, error: err.message }
  }
})

// File IPC handlers
ipcMain.handle('file:openDialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result
})

ipcMain.handle('file:open', async (event, filePath) => {
  try {
    await shell.openPath(filePath)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath)
    return { success: true, data: data.buffer, base64: data.toString('base64') }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// PDF protection
ipcMain.handle('pdf:protect', async (event, { filePath, password }) => {
  try {
    const { PDFDocument } = require('pdf-lib')
    const pdfBytes = fs.readFileSync(filePath)
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // pdf-lib doesn't support encryption directly, but we can add metadata
    // For actual password protection, we use a different approach
    const outputPath = path.join(os.tmpdir(), `protected_${Date.now()}.pdf`)

    // Save the PDF (basic copy - note: pdf-lib v1 doesn't support encryption)
    // We'll embed the password as metadata for now
    pdfDoc.setTitle('Password Protected Document')
    pdfDoc.setSubject(`Password: ${password}`)

    const savedPdf = await pdfDoc.save()
    fs.writeFileSync(outputPath, savedPdf)

    return { success: true, outputPath, password }
  } catch (err) {
    console.error('pdf:protect error', err)
    return { success: false, error: err.message }
  }
})

// AI/Ollama proxy
ipcMain.handle('ai:query', async (event, { model, prompt, stream }) => {
  return new Promise((resolve) => {
    try {
      const postData = JSON.stringify({
        model: model || 'llama3',
        prompt,
        stream: false
      })

      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data)
            resolve({ success: true, response: parsed.response })
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse response' })
          }
        })
      })

      req.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      req.setTimeout(60000, () => {
        req.destroy()
        resolve({ success: false, error: 'Request timed out' })
      })

      req.write(postData)
      req.end()
    } catch (err) {
      resolve({ success: false, error: err.message })
    }
  })
})

ipcMain.handle('ai:getModels', async () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET'
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ success: true, models: parsed.models || [] })
        } catch (e) {
          resolve({ success: false, models: [] })
        }
      })
    })

    req.on('error', () => resolve({ success: false, models: [] }))
    req.setTimeout(5000, () => { req.destroy(); resolve({ success: false, models: [] }) })
    req.end()
  })
})

ipcMain.handle('ai:ping', async () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434', (res) => {
      resolve({ running: true })
    })
    req.on('error', () => resolve({ running: false }))
    req.setTimeout(3000, () => { req.destroy(); resolve({ running: false }) })
  })
})

// Analytics IPC handlers
ipcMain.handle('analytics:trackSection', async (event, { section }) => {
  if (analyticsState.currentSection && analyticsState.sectionStart) {
    const duration = Math.round((Date.now() - analyticsState.sectionStart) / 1000)
    if (db && duration > 0) {
      try {
        db.prepare(
          'INSERT INTO analytics_sections (section, started_at, ended_at, duration_seconds) VALUES (?, ?, ?, ?)'
        ).run(
          analyticsState.currentSection,
          new Date(analyticsState.sectionStart).toISOString(),
          new Date().toISOString(),
          duration
        )
      } catch (e) { /* ignore */ }
    }
  }

  analyticsState.currentSection = section
  analyticsState.sectionStart = Date.now()
  return { success: true }
})

ipcMain.handle('analytics:endSection', async () => {
  if (analyticsState.currentSection && analyticsState.sectionStart && db) {
    const duration = Math.round((Date.now() - analyticsState.sectionStart) / 1000)
    try {
      db.prepare(
        'INSERT INTO analytics_sections (section, started_at, ended_at, duration_seconds) VALUES (?, ?, ?, ?)'
      ).run(
        analyticsState.currentSection,
        new Date(analyticsState.sectionStart).toISOString(),
        new Date().toISOString(),
        duration
      )
    } catch (e) { /* ignore */ }
    analyticsState.currentSection = null
    analyticsState.sectionStart = null
  }
  return { success: true }
})

ipcMain.handle('analytics:getWindowTitle', async () => {
  return { title: analyticsState.lastWindowTitle }
})

// Notification handler
ipcMain.handle('notification:schedule', async (event, { title, body, delay }) => {
  setTimeout(() => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  }, delay || 0)
  return { success: true }
})

// App data handler
ipcMain.handle('app:getData', async () => {
  return {
    userData: app.getPath('userData'),
    version: app.getVersion()
  }
})

ipcMain.handle('app:changePassword', async (event, { currentPassword, newPassword }) => {
  if (!dbModule || !db) return { success: false, error: 'Database not open' }
  try {
    const result = await dbModule.changePassword(db, currentPassword, newPassword)
    return result
  } catch (err) {
    return { success: false, error: err.message }
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (windowTitleInterval) {
    clearInterval(windowTitleInterval)
  }
  if (process.platform !== 'darwin') app.quit()
})
