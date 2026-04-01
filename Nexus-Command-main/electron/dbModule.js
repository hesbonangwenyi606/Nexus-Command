const Database = require('better-sqlite3')
const crypto = require('crypto')

function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyHash(password, storedHash) {
  const [salt, hash] = storedHash.split(':')
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash === testHash
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar_path TEXT,
      background_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS email_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      provider TEXT,
      imap_host TEXT,
      imap_port INTEGER DEFAULT 993,
      smtp_host TEXT,
      smtp_port INTEGER DEFAULT 587,
      username TEXT,
      password_enc TEXT,
      oauth_token_enc TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      message_id TEXT UNIQUE,
      subject TEXT,
      from_address TEXT,
      from_name TEXT,
      to_address TEXT,
      body_text TEXT,
      body_html TEXT,
      date TEXT,
      is_read INTEGER DEFAULT 0,
      is_replied INTEGER DEFAULT 0,
      folder TEXT DEFAULT 'INBOX',
      tags TEXT DEFAULT '[]',
      contact_id INTEGER,
      FOREIGN KEY (account_id) REFERENCES email_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Other',
      file_path TEXT,
      description TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cover_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      company TEXT,
      job_title TEXT,
      job_description TEXT,
      skills TEXT,
      content TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      status TEXT DEFAULT 'Saved',
      deadline TEXT,
      submitted_date TEXT,
      notes TEXT,
      match_score INTEGER,
      contact_ids TEXT DEFAULT '[]',
      asset_ids TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interview_prep (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      research_notes TEXT,
      star_stories TEXT DEFAULT '[]',
      interview_log TEXT DEFAULT '[]',
      questions TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      email TEXT,
      phone TEXT,
      linkedin TEXT,
      how_met TEXT,
      where_met TEXT,
      relationship TEXT DEFAULT 'Cold',
      tags TEXT DEFAULT '[]',
      notes TEXT,
      job_ids TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER,
      type TEXT,
      date TEXT,
      notes TEXT,
      email_id INTEGER,
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      condition_field TEXT,
      condition_operator TEXT,
      condition_value TEXT,
      action_type TEXT,
      action_value TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT,
      started_at TEXT,
      ended_at TEXT,
      duration_seconds INTEGER
    );

    CREATE TABLE IF NOT EXISTS analytics_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT,
      window_title TEXT,
      category TEXT,
      is_productive INTEGER DEFAULT 0,
      detected_at TEXT,
      duration_seconds INTEGER
    );

    CREATE TABLE IF NOT EXISTS analytics_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)
}

async function initDatabase(dbPath, password, userName) {
  const db = new Database(dbPath)
  createTables(db)

  // Store password hash
  const passwordHash = hashPassword(password)
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('password_hash', ?)").run(passwordHash)

  // Store salt for key derivation
  const salt = crypto.randomBytes(16).toString('hex')
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('key_salt', ?)").run(salt)

  // Store profile
  const existingProfile = db.prepare('SELECT id FROM profile LIMIT 1').get()
  if (!existingProfile) {
    db.prepare('INSERT INTO profile (name) VALUES (?)').run(userName || 'User')
  }

  // Insert default analytics settings
  db.prepare("INSERT OR IGNORE INTO analytics_settings (key, value) VALUES ('tracking_enabled', '1')").run()
  db.prepare("INSERT OR IGNORE INTO analytics_settings (key, value) VALUES ('idle_timeout', '5')").run()

  return db
}

async function verifyAndOpen(dbPath, password) {
  try {
    const db = new Database(dbPath)

    // Check if tables exist
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'").get()
    if (!tableCheck) {
      db.close()
      return { success: false, error: 'Invalid database format' }
    }

    const hashRow = db.prepare("SELECT value FROM settings WHERE key = 'password_hash'").get()
    if (!hashRow) {
      db.close()
      return { success: false, error: 'No password set' }
    }

    if (!verifyHash(password, hashRow.value)) {
      db.close()
      return { success: false, error: 'Incorrect password' }
    }

    return { success: true, db }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function changePassword(db, currentPassword, newPassword) {
  const hashRow = db.prepare("SELECT value FROM settings WHERE key = 'password_hash'").get()
  if (!hashRow || !verifyHash(currentPassword, hashRow.value)) {
    return { success: false, error: 'Current password is incorrect' }
  }

  const newHash = hashPassword(newPassword)
  db.prepare("UPDATE settings SET value = ? WHERE key = 'password_hash'").run(newHash)
  return { success: true }
}

module.exports = { initDatabase, verifyAndOpen, changePassword }
