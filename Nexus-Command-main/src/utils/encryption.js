// Encryption utilities - these run in the renderer but actual crypto
// operations for sensitive data happen in the main process.
// This file provides client-side helpers only.

export function hashPasswordClient(password) {
  // Simple client-side validation hash (not for storage)
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export function getPasswordStrength(password) {
  let score = 0
  const checks = {
    length: password.length >= 8,
    longLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }

  if (checks.length) score++
  if (checks.longLength) score++
  if (checks.uppercase) score++
  if (checks.lowercase) score++
  if (checks.numbers) score++
  if (checks.special) score++

  let label = 'Very Weak'
  let color = 'bg-red-600'
  if (score >= 2) { label = 'Weak'; color = 'bg-orange-500' }
  if (score >= 3) { label = 'Fair'; color = 'bg-yellow-500' }
  if (score >= 4) { label = 'Good'; color = 'bg-blue-500' }
  if (score >= 5) { label = 'Strong'; color = 'bg-green-500' }
  if (score >= 6) { label = 'Very Strong'; color = 'bg-emerald-400' }

  return { score, label, color, percentage: Math.round((score / 6) * 100) }
}
