// Database access layer - all actual DB operations happen in the main process
// This module provides helper functions for React components to call via IPC

const api = () => window.electronAPI

export async function dbQuery(sql, params = []) {
  const result = await api().dbQuery(sql, params)
  if (result.error) throw new Error(result.error)
  return result.rows || []
}

export async function dbRun(sql, params = []) {
  const result = await api().dbRun(sql, params)
  if (result.error) throw new Error(result.error)
  return result
}

export async function dbGetAll(table, where = null, params = []) {
  const result = await api().dbGetAll(table, where, params)
  if (result.error) throw new Error(result.error)
  return result.rows || []
}

export async function getProfile() {
  const rows = await dbQuery('SELECT * FROM profile LIMIT 1')
  return rows[0] || null
}

export async function updateProfile(data) {
  const { name, avatar_path, background_path } = data
  const profile = await getProfile()
  if (profile) {
    await dbRun(
      'UPDATE profile SET name = ?, avatar_path = ?, background_path = ? WHERE id = ?',
      [name, avatar_path, background_path, profile.id]
    )
  }
}

export async function getSetting(key) {
  const rows = await dbQuery('SELECT value FROM settings WHERE key = ?', [key])
  return rows[0]?.value ?? null
}

export async function setSetting(key, value) {
  await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)])
}

export async function getAnalyticsSetting(key) {
  const rows = await dbQuery('SELECT value FROM analytics_settings WHERE key = ?', [key])
  return rows[0]?.value ?? null
}

export async function setAnalyticsSetting(key, value) {
  await dbRun('INSERT OR REPLACE INTO analytics_settings (key, value) VALUES (?, ?)', [key, String(value)])
}
