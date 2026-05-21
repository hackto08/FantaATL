import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TIER_LIMITS, SQUAD_MAX, DEADLINE } from '../data/players'
import { getCurrentUser, saveCurrentUser, clearCurrentUser } from '../utils/auth'
import { supabase } from '../supabase'

// Normalise Supabase tier strings to numeric keys (1 | 2 | 3)
function normalizeTier(tier) {
  if (typeof tier === 'number') return tier
  const v = String(tier).toLowerCase().trim()
  if (v === '1' || v.startsWith('prima'))   return 1
  if (v === '2' || v.startsWith('seconda')) return 2
  if (v === '3' || v.startsWith('terza'))   return 3
  return tier
}

const SquadContext = createContext()

// ── Formation persisted in localStorage (UI state, no Supabase table) ──────
const FORMATION_KEY = 'fantaatl_formation'

const EMPTY_FORMATION = {
  p1: null, p2: null, p3: null, p4: null,
  gk: null, bench1: null, bench2: null,
}

function readFormation(nickname) {
  try {
    const all = JSON.parse(localStorage.getItem(FORMATION_KEY) || '{}')
    return { ...EMPTY_FORMATION, ...(all[nickname] || {}) }
  } catch { return { ...EMPTY_FORMATION } }
}

function writeFormation(nickname, formation) {
  if (!nickname) return
  try {
    const all = JSON.parse(localStorage.getItem(FORMATION_KEY) || '{}')
    all[nickname] = formation
    localStorage.setItem(FORMATION_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function SquadProvider({ children }) {
  const [currentUser,  setCurrentUser]  = useState(getCurrentUser)
  const [squad,        setSquad]        = useState([])
  const [teamId,       setTeamId]       = useState(null)
  const [formation,    setFormation]    = useState({ ...EMPTY_FORMATION })
  const [squadLoading, setSquadLoading] = useState(false)

  const isLocked = new Date() >= DEADLINE

  // ── Load squad from Supabase ────────────────────────────────────────────
  const loadSquad = useCallback(async (userObj) => {
    if (!userObj?.id || userObj.role === 'admin') return

    setSquadLoading(true)
    console.log('loadSquad: currentUser', userObj)

    // 1. Find or create team row for this user
    let { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id')
      .eq('user_id', userObj.id)
      .maybeSingle()

    console.log('team:', team, teamErr)

    if (!team && !teamErr) {
      const { data: newTeam, error: createErr } = await supabase
        .from('teams')
        .insert({ user_id: userObj.id })
        .select('id')
        .single()

      console.log('newTeam:', newTeam, createErr)
      team = newTeam
    }

    if (!team) { setSquadLoading(false); return }

    setTeamId(team.id)

    // 2. Load selected players via team_players join
    const { data: teamPlayers, error: tpErr } = await supabase
      .from('team_players')
      .select('player_id, players(*)')
      .eq('team_id', team.id)

    console.log('teamPlayers:', teamPlayers, tpErr)

    const loadedSquad = (teamPlayers || [])
      .map(tp => tp.players)
      .filter(Boolean)
      .map(p => ({ ...p, tier: normalizeTier(p.tier) }))
    setSquad(loadedSquad)

    // 3. Load formation from localStorage
    setFormation(readFormation(userObj.nickname))

    setSquadLoading(false)
  }, [])

  // Load squad on app boot if user is already in localStorage
  useEffect(() => {
    const user = getCurrentUser()
    if (user) loadSquad(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist formation to localStorage on every change
  useEffect(() => {
    if (currentUser?.nickname && currentUser.role !== 'admin') {
      writeFormation(currentUser.nickname, formation)
    }
  }, [currentUser, formation])

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function login(userObj) {
    const normalized = typeof userObj === 'string'
      ? { nickname: userObj, role: 'user' }
      : userObj
    saveCurrentUser(normalized)
    setCurrentUser(normalized)
    setSquad([])
    setTeamId(null)
    setFormation({ ...EMPTY_FORMATION })
    await loadSquad(normalized)
  }

  function logout() {
    clearCurrentUser()
    setCurrentUser(null)
    setSquad([])
    setTeamId(null)
    setFormation({ ...EMPTY_FORMATION })
  }

  // ── Squad helpers ─────────────────────────────────────────────────────────
  const tierCount = (tier) => squad.filter((p) => p.tier === tier).length
  const starters  = squad.slice(0, 5)
  const reserves  = squad.slice(5, 7)

  function canAdd(player) {
    if (isLocked)                                             return false
    if (!teamId)                                              return false
    if (squad.length >= SQUAD_MAX)                            return false
    if (squad.find((p) => p.id === player.id))                return false
    if (tierCount(player.tier) >= TIER_LIMITS[player.tier])   return false
    return true
  }

  async function addPlayer(player) {
    if (!canAdd(player)) return

    const { error } = await supabase
      .from('team_players')
      .insert({ team_id: teamId, player_id: player.id })

    console.log('addPlayer error:', error)

    if (!error) {
      setSquad((prev) => [...prev, player])
    }
  }

  async function removePlayer(id) {
    if (isLocked || !teamId) return

    // Remove from formation state immediately
    setFormation((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((slot) => { if (next[slot]?.id === id) next[slot] = null })
      return next
    })

    const { error } = await supabase
      .from('team_players')
      .delete()
      .eq('team_id', teamId)
      .eq('player_id', id)

    console.log('removePlayer error:', error)

    if (!error) {
      setSquad((prev) => prev.filter((p) => p.id !== id))
    }
  }

  function isAdded(id) {
    return !!squad.find((p) => p.id === id)
  }

  // ── Formation helpers ─────────────────────────────────────────────────────
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

  // Exposed so Formation.jsx can hydrate formation from Supabase
  function loadFormation(f) { setFormation({ ...EMPTY_FORMATION, ...f }) }

  return (
    <SquadContext.Provider value={{
      currentUser,
      login,
      logout,
      squadLoading,
      squad, starters, reserves, isLocked,
      addPlayer, removePlayer, isAdded, canAdd, tierCount,
      formation, assignedIds, isAssigned, setFormationSlot, clearFormationSlot, loadFormation,
    }}>
      {children}
    </SquadContext.Provider>
  )
}

export function useSquad() {
  return useContext(SquadContext)
}
