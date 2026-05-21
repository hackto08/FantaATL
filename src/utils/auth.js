const KEY = 'fantaatl_current_user'

/**
 * Returns the full current user object { nickname, role } or null.
 * Handles both legacy string format and new JSON object format.
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Legacy: was stored as plain string
    if (typeof parsed === 'string') return { nickname: parsed, role: 'user' }
    return parsed
  } catch {
    return null
  }
}

export function isAdmin() {
  return getCurrentUser()?.role === 'admin'
}

export function saveCurrentUser(userObj) {
  localStorage.setItem(KEY, JSON.stringify(userObj))
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY)
}
