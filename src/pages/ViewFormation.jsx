import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import BackButton from '../components/BackButton'
import './ViewFormation.css'

const STARTER_COLS = ['player1', 'player2', 'player3', 'player4', 'gk']
const BENCH_COLS   = ['bench1', 'bench2']

// Supabase column → display label
const COL_LABEL = {
  goalkeeper: 'POR',
  player1:    'GIO',
  player2:    'GIO',
  player3:    'GIO',
  player4:    'GIO',
  bench1:     'RIS',
  bench2:     'RIS',
}

// Internal layout keys → Supabase column names
const LAYOUT = {
  field: [
    { key: 'player1',    label: 'GIO', row: 'top' },
    { key: 'player2',    label: 'GIO', row: 'top' },
    { key: 'player3',    label: 'GIO', row: 'mid' },
    { key: 'player4',    label: 'GIO', row: 'mid' },
    { key: 'goalkeeper', label: 'POR', row: 'gk'  },
  ],
  bench: [
    { key: 'bench1', label: 'RIS' },
    { key: 'bench2', label: 'RIS' },
  ],
}

function shortenName(name) {
  if (!name) return ''
  const parts = name.split(' ')
  if (parts.length === 1) return name
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

function tierLabel(tier) {
  if (!tier && tier !== 0) return ''
  const v = String(tier).toLowerCase().trim()
  if (v === '1' || v.startsWith('prima'))   return '1ª'
  if (v === '2' || v.startsWith('seconda')) return '2ª'
  if (v === '3' || v.startsWith('terza'))   return '3ª'
  return String(tier)
}

function PlayerCircle({ slotLabel, player, isBench, isGk }) {
  return (
    <div className={[
      'vf-circle',
      isBench ? 'vf-circle--bench' : '',
      isGk    ? 'vf-circle--gk'    : '',
      player  ? 'vf-circle--filled' : 'vf-circle--empty',
    ].join(' ').trim()}>
      <span className="vf-circle-role">{slotLabel}</span>
      {player ? (
        <>
          <span className="vf-circle-name">{shortenName(player.name)}</span>
          <span className="vf-circle-pts">{player.points ?? 0} pt</span>
        </>
      ) : (
        <span className="vf-circle-name vf-circle-name--empty">—</span>
      )}
    </div>
  )
}

export default function ViewFormation() {
  const { userId } = useParams()

  const [nickname,    setNickname]    = useState('')
  const [formation,   setFormation]   = useState(null)   // null = loading
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)

  useEffect(() => {
    async function load() {
      // 1. Load user nickname
      const { data: user } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', userId)
        .maybeSingle()

      if (!user) { setNotFound(true); setLoading(false); return }
      setNickname(user.nickname)

      // 2. Load formation row
      const { data: form } = await supabase
        .from('formations')
        .select('goalkeeper, player1, player2, player3, player4, bench1, bench2')
        .eq('user_id', userId)
        .maybeSingle()

      if (!form) { setFormation(null); setLoading(false); return }

      // 3. Collect all player IDs from formation slots
      const allCols   = [...LAYOUT.field.map(s => s.key), ...LAYOUT.bench.map(s => s.key)]
      const playerIds = [...new Set(allCols.map(col => form[col]).filter(Boolean))]

      let playersMap = {}
      if (playerIds.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('id, name, role, tier, points')
          .in('id', playerIds)

        playersMap = Object.fromEntries((players || []).map(p => [p.id, p]))
      }

      // 4. Build resolved formation { columnKey: playerObject | null }
      const resolved = {}
      allCols.forEach(col => {
        const pid = form[col]
        resolved[col] = pid ? (playersMap[pid] || null) : null
      })

      setFormation(resolved)
      setLoading(false)
    }

    load()
  }, [userId])

  const hasAnyPlayer = formation && Object.values(formation).some(Boolean)

  return (
    <main className="vf-page">
      <BackButton />

      <header className="vf-header">
        <h1 className="vf-title">
          {loading ? 'Caricamento…' : notFound ? 'Utente non trovato' : `Formazione di ${nickname}`}
        </h1>
        {!loading && !notFound && (
          <p className="vf-subtitle">Visualizzazione formazione — sola lettura</p>
        )}
      </header>

      {loading && (
        <div className="vf-empty"><p>Caricamento formazione…</p></div>
      )}

      {!loading && notFound && (
        <div className="vf-empty"><p>Utente non trovato.</p></div>
      )}

      {!loading && !notFound && !hasAnyPlayer && (
        <div className="vf-empty">
          <p>Questa squadra non ha ancora inserito la formazione</p>
        </div>
      )}

      {!loading && !notFound && hasAnyPlayer && (
        <>
          {/* ── Field ── */}
          <div className="vf-field">
            <div className="vf-field-center-line" />
            <div className="vf-field-center-circle" />
            <div className="vf-field-penalty-top" />
            <div className="vf-field-penalty-bottom" />

            <div className="vf-row vf-row--top">
              {['player1', 'player2'].map(col => (
                <PlayerCircle key={col} slotLabel="GIO" player={formation[col]} />
              ))}
            </div>
            <div className="vf-row vf-row--mid">
              {['player3', 'player4'].map(col => (
                <PlayerCircle key={col} slotLabel="GIO" player={formation[col]} />
              ))}
            </div>
            <div className="vf-row vf-row--gk">
              <PlayerCircle slotLabel="POR" player={formation['goalkeeper']} isGk />
            </div>
          </div>

          {/* ── Bench ── */}
          <div className="vf-bench">
            <span className="vf-bench-label">PANCHINA</span>
            <div className="vf-bench-slots">
              {['bench1', 'bench2'].map(col => (
                <PlayerCircle key={col} slotLabel="RIS" player={formation[col]} isBench />
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
