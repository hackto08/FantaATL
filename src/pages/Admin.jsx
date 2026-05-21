import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import './Admin.css'

// ── localStorage (solo per ranking teams, non rimosso) ───────
const LS_TEAMS = 'fantaatl_teams'

function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

function calcTeamPoints(teamPlayers, adminPlayers) {
  return (teamPlayers || []).reduce((sum, tp) => {
    const ap = adminPlayers.find(p => p.id === tp.id)
    return sum + (ap?.points || 0)
  }, 0)
}

// ── Constants ────────────────────────────────────────────────
const POINT_ACTIONS = [
  { label: '+10 Vittoria',     delta: +10, positive: true  },
  { label: '+15 Pass. turno',  delta: +15, positive: true  },
  { label: '+5 Goal',          delta: +5,  positive: true  },
  { label: '+3 Assist',        delta: +3,  positive: true  },
  { label: '+5 Esultanza',     delta: +5,  positive: true  },
  { label: '-5 Ammonizione',   delta: -5,  positive: false },
  { label: '-10 Eliminazione', delta: -10, positive: false },
]

const TIER_LABELS = { 1: 'Prima fascia', 2: 'Seconda fascia', 3: 'Terza fascia' }

const TABS = [
  { id: 'players',  label: '📋 Giocatori' },
  { id: 'points',   label: '⚡ Punti'      },
  { id: 'ranking',  label: '🏆 Classifica' },
  { id: 'accounts', label: '👤 Account'    },
]

// ── Badge components ─────────────────────────────────────────
function TierBadge({ tier }) {
  return <span className={`admin-tier-badge admin-tier-badge--${tier}`}>{TIER_LABELS[tier]}</span>
}
function RoleBadge({ role }) {
  return <span className={`admin-role-badge admin-role-badge--${role.toLowerCase()}`}>{role}</span>
}

// ── Main component ───────────────────────────────────────────
export default function Admin() {
  const [players,      setPlayers]      = useState([])
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [playerForm,   setPlayerForm]   = useState({ name: '', role: 'Giocatore', tier: 1 })
  const [playerError,  setPlayerError]  = useState('')
  const [accountForm,  setAccountForm]  = useState({ nickname: '', password: '' })
  const [accountError, setAccountError] = useState('')
  const [tab,          setTab]          = useState('players')
  const [expanded,     setExpanded]     = useState(null)
  const [search,       setSearch]       = useState('')
  const [saving,       setSaving]       = useState(false)

  // ── Fetch data from Supabase ──────────────────────────────
  const fetchPlayers = useCallback(async () => {
    const { data, error } = await supabase.from('players').select('*').order('name')
    if (!error && data) setPlayers(data)
  }, [])

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('users').select('*').order('nickname')
    if (!error && data) setUsers(data)
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchPlayers(), fetchUsers()])
      setLoading(false)
    }
    init()
  }, [fetchPlayers, fetchUsers])

  // ── Player management ────────────────────────────────────
  async function addPlayer() {
    const name = playerForm.name.trim()
    if (!name) { setPlayerError('Inserisci il nome del giocatore.'); return }
    setPlayerError('')
    setSaving(true)

    const { error } = await supabase.from('players').insert({
      name,
      role:   playerForm.role,
      tier:   Number(playerForm.tier),
      points: 0,
    })

    if (error) {
      setPlayerError(`Errore: ${error.message}`)
    } else {
      setPlayerForm({ name: '', role: 'Giocatore', tier: 1 })
      await fetchPlayers()
    }
    setSaving(false)
  }

  async function removePlayer(id) {
    await supabase.from('players').delete().eq('id', id)
    await fetchPlayers()
  }

  async function addPoints(player, delta) {
    const newPoints = Math.max(0, (player.points || 0) + delta)

    // Optimistic UI update
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, points: newPoints } : p))

    const { error } = await supabase
      .from('players')
      .update({ points: newPoints })
      .eq('id', player.id)

    if (error) {
      // Revert on error
      setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, points: player.points } : p))
    }
  }

  // ── Account management ───────────────────────────────────
  async function createAccount() {
    const nick = accountForm.nickname.trim()
    const pass = accountForm.password.trim()
    if (!nick || !pass) { setAccountError('Compila nickname e password.'); return }
    if (users.find(u => u.nickname === nick)) { setAccountError('Nickname già in uso.'); return }
    setAccountError('')
    setSaving(true)

    const { error } = await supabase.from('users').insert({ nickname: nick, password: pass })

    if (error) {
      setAccountError(`Errore: ${error.message}`)
    } else {
      setAccountForm({ nickname: '', password: '' })
      await fetchUsers()
    }
    setSaving(false)
  }

  async function deleteAccount(id, nickname) {
    await supabase.from('users').delete().eq('id', id)
    // Also clean up their localStorage team
    try {
      const teams = readLS(LS_TEAMS, {})
      delete teams[nickname]
      localStorage.setItem(LS_TEAMS, JSON.stringify(teams))
    } catch { /* ignore */ }
    await fetchUsers()
  }

  // ── Derived ──────────────────────────────────────────────
  const filteredPlayers = search.trim()
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : players

  const allTeams = readLS(LS_TEAMS, {})
  const sortedTeams = Object.values(allTeams)
    .map(t => ({
      nickname: t.nickname,
      players:  t.squad || [],
      points:   calcTeamPoints(t.squad || [], players),
    }))
    .sort((a, b) => b.points - a.points)

  const MEDALS = { 0: '🥇', 1: '🥈', 2: '🥉' }

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Pannello Admin ATL</h1>
        <p className="admin-subtitle">Gestisci giocatori, punti e account</p>
      </header>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.id} type="button"
            className={`admin-tab${tab === t.id ? ' admin-tab--active' : ''}`}
            onClick={() => { setTab(t.id); setSearch('') }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="admin-loading">
          <span className="admin-spinner" />
          Caricamento dati…
        </div>
      )}

      {/* ══ GIOCATORI ══════════════════════════════════════ */}
      {!loading && tab === 'players' && (
        <div className="admin-section">
          <div className="admin-card">
            <h2 className="admin-card-title">Aggiungi giocatore</h2>
            <div className="admin-form">
              <input type="text" className="admin-input" placeholder="Nome e cognome"
                value={playerForm.name}
                onChange={e => setPlayerForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addPlayer()}
              />
              <div className="admin-form-row">
                <select className="admin-select" value={playerForm.role}
                  onChange={e => setPlayerForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="Giocatore">Giocatore</option>
                  <option value="Portiere">Portiere</option>
                </select>
                <select className="admin-select" value={playerForm.tier}
                  onChange={e => setPlayerForm(f => ({ ...f, tier: e.target.value }))}>
                  <option value={1}>Prima fascia</option>
                  <option value={2}>Seconda fascia</option>
                  <option value={3}>Terza fascia</option>
                </select>
              </div>
              {playerError && <p className="admin-form-error">{playerError}</p>}
              <button type="button" className="admin-btn-primary"
                onClick={addPlayer} disabled={saving}>
                {saving ? 'SALVATAGGIO…' : 'AGGIUNGI GIOCATORE'}
              </button>
            </div>
          </div>

          <div className="admin-list-header">
            <span className="admin-list-count">{players.length} giocatori nel listone</span>
            <input type="text" className="admin-input admin-search" placeholder="Cerca…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <ul className="admin-player-list">
            {filteredPlayers.map(player => (
              <li key={player.id} className="admin-player-card">
                <div className="admin-player-info">
                  <span className="admin-player-name">{player.name}</span>
                  <div className="admin-player-badges">
                    <RoleBadge role={player.role} />
                    <TierBadge tier={player.tier} />
                  </div>
                </div>
                <div className="admin-player-right">
                  <span className="admin-player-points">{player.points ?? 0} pt</span>
                  <button type="button" className="admin-remove-btn"
                    onClick={() => removePlayer(player.id)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══ PUNTI ═══════════════════════════════════════════ */}
      {!loading && tab === 'points' && (
        <div className="admin-section">
          <p className="admin-section-hint">Tocca un giocatore per assegnare punti</p>
          <input type="text" className="admin-input admin-search" placeholder="Cerca giocatore…"
            value={search} onChange={e => setSearch(e.target.value)} />

          <ul className="admin-player-list">
            {filteredPlayers.map(player => (
              <li key={player.id} className="admin-points-card">
                <button type="button" className="admin-points-header"
                  onClick={() => setExpanded(expanded === player.id ? null : player.id)}>
                  <div className="admin-player-info">
                    <span className="admin-player-name">{player.name}</span>
                    <div className="admin-player-badges">
                      <RoleBadge role={player.role} />
                      <TierBadge tier={player.tier} />
                    </div>
                  </div>
                  <div className="admin-player-right">
                    <span className="admin-player-points">{player.points ?? 0} pt</span>
                    <span className="admin-expand-icon">{expanded === player.id ? '▲' : '▼'}</span>
                  </div>
                </button>
                {expanded === player.id && (
                  <div className="admin-action-grid">
                    {POINT_ACTIONS.map(action => (
                      <button key={action.label} type="button"
                        className={`admin-action-btn${action.positive ? ' admin-action-btn--pos' : ' admin-action-btn--neg'}`}
                        onClick={() => addPoints(player, action.delta)}>
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══ CLASSIFICA ══════════════════════════════════════ */}
      {!loading && tab === 'ranking' && (
        <div className="admin-section">
          <div className="admin-card">
            <h2 className="admin-card-title">Classifica live</h2>
            {sortedTeams.length === 0 ? (
              <p className="admin-section-hint">Nessuna squadra registrata ancora.</p>
            ) : (
              <ul className="admin-ranking-list">
                {sortedTeams.map((team, i) => (
                  <li key={team.nickname}
                    className={`admin-rank-card${i < 3 ? ` admin-rank-card--${['gold','silver','bronze'][i]}` : ''}`}>
                    <span className="admin-rank-pos">{MEDALS[i] ?? `#${i + 1}`}</span>
                    <span className="admin-rank-name">{team.nickname}</span>
                    <span className="admin-rank-points">{team.points} pt</span>
                    <span className="admin-rank-squad">{team.players.length}/7 gio.</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ══ ACCOUNT ═════════════════════════════════════════ */}
      {!loading && tab === 'accounts' && (
        <div className="admin-section">
          <div className="admin-card">
            <h2 className="admin-card-title">Crea account</h2>
            <div className="admin-form">
              <input type="text" className="admin-input" placeholder="Nickname"
                value={accountForm.nickname}
                onChange={e => setAccountForm(f => ({ ...f, nickname: e.target.value }))}
              />
              <input type="text" className="admin-input" placeholder="Password"
                value={accountForm.password}
                onChange={e => setAccountForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && createAccount()}
              />
              {accountError && <p className="admin-form-error">{accountError}</p>}
              <button type="button" className="admin-btn-primary"
                onClick={createAccount} disabled={saving}>
                {saving ? 'SALVATAGGIO…' : 'CREA ACCOUNT'}
              </button>
            </div>
          </div>

          <div className="admin-list-header">
            <span className="admin-list-count">{users.length} account creati</span>
          </div>

          {users.length === 0 ? (
            <p className="admin-section-hint">Nessun account ancora. Creane uno sopra.</p>
          ) : (
            <ul className="admin-player-list">
              {users.map(user => (
                <li key={user.id} className="admin-player-card">
                  <div className="admin-player-info">
                    <span className="admin-player-name">{user.nickname}</span>
                    <span className="admin-account-password">●●●●●●</span>
                  </div>
                  <button type="button" className="admin-remove-btn"
                    onClick={() => deleteAccount(user.id, user.nickname)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  )
}
