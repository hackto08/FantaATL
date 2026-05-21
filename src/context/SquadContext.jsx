import { createContext, useContext, useState, useEffect } from 'react'
import { TIER_LIMITS, SQUAD_MAX, DEADLINE } from '../data/players'
import { getCurrentUser, saveCurrentUser, clearCurrentUser } from '../utils/auth'

const SquadContext = createContext()

// ── localStorage key ─────────────────────────────────────────
const TEAMS_KEY = 'fantaatl_teams'

// ── Formation template ───────────────────────────────────────
const EMPTY_FORMATION = {
  p1: null, p2: null, p3: null, p4: null,
  gk: null, bench1: null, bench2: null,
}

// ── LS helpers ───────────────────────────────────────────────
function readTeam(nickname) {
  try {
    const all = JSON.parse(localStorage.getItem(TEAMS_KEY) || '{}')
    const t   = all[nickname]
    if (!t) return { squad: [], formation: { ...EMPTY_FORMATION } }
    return {
      squad:     t.squad     || [],
      formation: { ...EMPTY_FORMATION, ...t.formation },
    }
  } catch { return { squad: [], formation: { ...EMPTY_FORMATION } } }
}

function writeTeam(userObj, squad, formation) {
  if (!userObj?.nickname) return
  // Skip persisting teams for admin users
  if (userObj.role === 'admin') return
  try {
    const all = JSON.parse(localStorage.getItem(TEAMS_KEY) || '{}')
    all[userObj.nickname] = { nickname: userObj.nickname, role: userObj.role, squad, formation }
    localStorage.setItem(TEAMS_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

// ── Provider ─────────────────────────────────────────────────
export function SquadProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getCurrentUser)

  const nickname = currentUser?.nickname || null
  const initTeam = nickname ? readTeam(nickname) : { squad: [], formation: { ...EMPTY_FORMATION } }

  const [squad,     setSquad]     = useState(initTeam.squad)
  const [formation, setFormation] = useState(initTeam.formation)

  const isLocked = new Date() >= DEADLINE

  // Persist on every change (skipped for admins)
  useEffect(() => {
    writeTeam(currentUser, squad, formation)
  }, [currentUser, squad, formation])

  // ── Auth ──────────────────────────────────────────────────
  function login(userObj) {
    // Accept both { nickname, role } object and legacy plain string
    const normalized = typeof userObj === 'string'
      ? { nickname: userObj, role: 'user' }
      : userObj
    saveCurrentUser(normalized)
    setCurrentUser(normalized)
    const team = readTeam(normalized.nickname)
    setSquad(team.squad)
    setFormation(team.formation)
  }

  function logout() {
    clearCurrentUser()
    setCurrentUser(null)
    setSquad([])
    setFormation({ ...EMPTY_FORMATION })
  }

  // ── Squad helpers ─────────────────────────────────────────
  const tierCount = (tier) => squad.filter((p) => p.tier === tier).length
  const starters  = squad.slice(0, 5)
  const reserves  = squad.slice(5, 7)

  function canAdd(player) {
    if (isLocked) return false
    if (squad.length >= SQUAD_MAX) return false
    if (squad.find((p) => p.id === player.id)) return false
    if (tierCount(player.tier) >= TIER_LIMITS[player.tier]) return false
    return true
  }

  function addPlayer(player) {
    if (!canAdd(player)) return
    setSquad((prev) => [...prev, player])
  }

  function removePlayer(id) {
    if (isLocked) return
    setFormation((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((slot) => { if (next[slot]?.id === id) next[slot] = null })
      return next
    })
    setSquad((prev) => prev.filter((p) => p.id !== id))
  }

  function isAdded(id) {
    return !!squad.find((p) => p.id === id)
  }

  // ── Formation helpers ──────────────────────────────────────
  const assignedIds = Object.values(formation).filter(Boolean).map((p) => p.id)

  function isAssigned(id) { return assignedIds.includes(id) }

  function setFormationSlot(slot, player) {
    if (isLocked) return
    setFormation((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((s) => { if (next[s]?.id === player?.id) next[s] = null })
      next[slot] = player
      return next
    })
  }

  function clearFormationSlot(slot) {
    if (isLocked) return
    setFormation((prev) => ({ ...prev, [slot]: null }))
  }

  return (
    <SquadContext.Provider value={{
      currentUser,
      login,
      logout,
      squad, starters, reserves, isLocked,
      addPlayer, removePlayer, isAdded, canAdd, tierCount,
      formation, assignedIds, isAssigned, setFormationSlot, clearFormationSlot,
    }}>
      {children}
    </SquadContext.Provider>
  )
}

export function useSquad() {
  return useContext(SquadContext)
}
