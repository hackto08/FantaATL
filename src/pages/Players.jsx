import { useState, useEffect } from 'react'
import { TIER_LABELS, TIER_LIMITS, SQUAD_MAX } from '../data/players'
import { useSquad } from '../context/SquadContext'
import { supabase } from '../supabase'
import './Players.css'

/**
 * Normalise Supabase tier values to the numeric keys (1 | 2 | 3)
 * used throughout the app.
 * Handles: 1, "1", "Prima fascia", "prima", "PRIMA FASCIA", etc.
 */
function normalizeTier(tier) {
  if (typeof tier === 'number') return tier
  const v = String(tier).toLowerCase().trim()
  if (v === '1' || v.startsWith('prima'))   return 1
  if (v === '2' || v.startsWith('seconda')) return 2
  if (v === '3' || v.startsWith('terza'))   return 3
  return tier // unknown — leave as-is
}

const TIER_FILTERS = [
  { value: 0,            label: 'Tutti'          },
  { value: 1,            label: 'Prima fascia'   },
  { value: 2,            label: 'Seconda fascia' },
  { value: 3,            label: 'Terza fascia'   },
  { value: 'Portiere',   label: 'Portieri'       },
]

function DeadlineBanner({ isLocked }) {
  if (isLocked) {
    return <div className="deadline-banner deadline-banner--locked">🔒 Mercato chiuso — formazioni bloccate</div>
  }
  return (
    <div className="deadline-banner">
      ⏰ Formazioni bloccate il <strong>21 giugno alle 09:29</strong>
    </div>
  )
}

function TierBadge({ tier }) {
  return <span className={`tier-badge tier-badge--${tier}`}>{TIER_LABELS[tier]}</span>
}

function RoleBadge({ role }) {
  return <span className={`role-badge role-badge--${role.toLowerCase()}`}>{role}</span>
}

export default function Players() {
  const { squad, addPlayer, removePlayer, isAdded, canAdd, tierCount, isLocked } = useSquad()
  const [filter,     setFilter]     = useState(0)
  const [allPlayers, setAllPlayers] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function fetchPlayers() {
      const { data, error } = await supabase.from('players').select('*').order('name')
      console.log('players raw from Supabase:', data, error)
      // Normalise tier to numeric keys so filters and limits work correctly
      const normalised = (data || []).map(p => ({ ...p, tier: normalizeTier(p.tier) }))
      console.log('players normalised:', normalised)
      setAllPlayers(normalised)
      setLoading(false)
    }
    fetchPlayers()
  }, [])

  const hasGoalkeeper = squad.some((p) => p.role === 'Portiere')
  const squadFull     = squad.length >= SQUAD_MAX

  const visible = filter === 0
    ? allPlayers
    : typeof filter === 'number'
      ? allPlayers.filter((p) => p.tier === filter)
      : allPlayers.filter((p) => p.role === filter)

  function blockReason(player) {
    if (isLocked)                                           return 'Mercato chiuso'
    if (isAdded(player.id))                                return null
    if (squadFull)                                          return 'Rosa completa'
    if (tierCount(player.tier) >= TIER_LIMITS[player.tier]) return 'Limite fascia'
    return null
  }

  return (
    <main className="players-page">
      <DeadlineBanner isLocked={isLocked} />

      <header className="players-header">
        <h1 className="players-title">Lista giocatori</h1>
        <p className="players-subtitle">Scegli i giocatori per la tua squadra</p>
      </header>

      {/* Goalkeeper warning */}
      {!isLocked && squadFull && !hasGoalkeeper && (
        <div className="gk-warning">
          ⚠ Devi selezionare almeno un portiere
        </div>
      )}
      {!isLocked && squad.length > 0 && !hasGoalkeeper && !squadFull && (
        <div className="gk-hint">
          💡 Ricorda: devi avere almeno 1 portiere nella rosa
        </div>
      )}

      {/* Stats */}
      <div className="players-stats">
        <div className="pstat">
          <span className="pstat-label">Rosa</span>
          <span className="pstat-value">{squad.length} / {SQUAD_MAX}</span>
        </div>
        <div className="pstat pstat--tier1">
          <span className="pstat-label">1ª fascia</span>
          <span className="pstat-value">{tierCount(1)} / {TIER_LIMITS[1]}</span>
        </div>
        <div className="pstat pstat--tier2">
          <span className="pstat-label">2ª fascia</span>
          <span className="pstat-value">{tierCount(2)} / {TIER_LIMITS[2]}</span>
        </div>
        <div className="pstat pstat--tier3">
          <span className="pstat-label">3ª fascia</span>
          <span className="pstat-value">{tierCount(3)} / {TIER_LIMITS[3]}</span>
        </div>
      </div>

      {/* Tier/role filter */}
      <div className="tier-filters">
        {TIER_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`tier-filter-btn${filter === f.value ? ' tier-filter-btn--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty / loading state */}
      {loading && (
        <div className="players-empty">
          <p>Caricamento giocatori...</p>
        </div>
      )}
      {!loading && allPlayers.length === 0 && (
        <div className="players-empty">
          <p>Nessun giocatore disponibile</p>
          <p className="players-empty-hint">L'admin deve prima creare il listone su /admin</p>
        </div>
      )}

      {/* Player list */}
      <ul className="players-list">
        {visible.map((player) => {
          const added    = isAdded(player.id)
          const reason   = blockReason(player)
          const disabled = !added && !!reason

          return (
            <li key={player.id} className={`player-card${added ? ' player-card--added' : ''}`}>
              <div className="player-info">
                <span className="player-name">{player.name}</span>
                <div className="player-badges">
                  <RoleBadge role={player.role} />
                  <TierBadge tier={player.tier} />
                </div>
              </div>
              <div className="player-actions">
                {added ? (
                  <button
                    type="button"
                    className="player-btn player-btn--remove"
                    onClick={() => removePlayer(player.id)}
                    disabled={isLocked}
                    title={isLocked ? 'Mercato chiuso' : 'Rimuovi'}
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    type="button"
                    className="player-btn player-btn--add"
                    onClick={() => addPlayer(player)}
                    disabled={disabled}
                    title={reason ?? ''}
                  >
                    {disabled ? reason : 'Aggiungi'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
