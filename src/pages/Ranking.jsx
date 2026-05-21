import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getCurrentUser } from '../utils/auth'
import './Ranking.css'

const STARTER_COLS = ['goalkeeper', 'player1', 'player2', 'player3', 'player4']

const MEDALS     = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_CLASS = { 1: 'rank--gold', 2: 'rank--silver', 3: 'rank--bronze' }

// ── Tier label helper ──────────────────────────────────────────────────────
function tierLabel(tier) {
  if (!tier && tier !== 0) return ''
  const v = String(tier).toLowerCase().trim()
  if (v === '1' || v.startsWith('prima'))   return '1ª fascia'
  if (v === '2' || v.startsWith('seconda')) return '2ª fascia'
  if (v === '3' || v.startsWith('terza'))   return '3ª fascia'
  return String(tier)
}

function Ranking() {
  const navigate   = useNavigate()
  const [teams,    setTeams]    = useState([])
  const [players,  setPlayers]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function buildRanking() {
      console.log('currentUser (logged in):', getCurrentUser())

      // ── Section 1: team ranking ──────────────────────────────
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, nickname, role')
        .neq('role', 'admin')

      console.log('users:', users, usersErr)

      let ranked = []
      if (users && users.length > 0) {
        const userIds = users.map(u => u.id)

        const { data: formations, error: formErr } = await supabase
          .from('formations')
          .select('user_id, goalkeeper, player1, player2, player3, player4')
          .in('user_id', userIds)

        console.log('formations:', formations, formErr)

        const starterIds = [
          ...new Set(
            (formations || [])
              .flatMap(f => STARTER_COLS.map(col => f[col]))
              .filter(Boolean)
          ),
        ]

        let pointsMap = {}
        if (starterIds.length > 0) {
          const { data: pts, error: ptsErr } = await supabase
            .from('players')
            .select('id, points')
            .in('id', starterIds)

          console.log('starter players (points):', pts, ptsErr)
          pointsMap = Object.fromEntries((pts || []).map(p => [p.id, p.points || 0]))
        }

        ranked = users.map(user => {
          const formation = (formations || []).find(f => f.user_id === user.id)
          const points = formation
            ? STARTER_COLS.reduce((sum, col) => {
                const pid = formation[col]
                return sum + (pid ? (pointsMap[pid] || 0) : 0)
              }, 0)
            : 0
          return { id: user.id, nickname: user.nickname, points }
        }).sort((a, b) => b.points - a.points)
      }

      console.log('ranking finale:', ranked)
      setTeams(ranked)

      // ── Section 2: player ranking ────────────────────────────
      const { data: allPlayers, error: allErr } = await supabase
        .from('players')
        .select('id, name, role, tier, points')
        .order('points', { ascending: false })

      console.log('players:', allPlayers, allErr)
      setPlayers(allPlayers || [])

      setLoading(false)
    }

    buildRanking()
  }, [])

  return (
    <main className="ranking-page">
      <header className="ranking-header">
        <h1 className="ranking-title">Classifica</h1>
        <p className="ranking-subtitle">Ranking ufficiale FantaATL</p>
      </header>

      {loading ? (
        <div className="ranking-empty">
          <p>Caricamento classifica...</p>
        </div>
      ) : (
        <>
          {/* ── SEZIONE 1: Classifica generale ── */}
          <section className="ranking-section">
            <h2 className="ranking-section-title">Classifica generale</h2>

            {teams.length === 0 ? (
              <div className="ranking-empty">
                <p>Nessuna squadra in classifica</p>
                <p className="ranking-empty-hint">
                  Gli utenti devono fare login e salvare la formazione
                </p>
              </div>
            ) : (
              <ol className="ranking-list">
                {teams.map((team, index) => {
                  const pos        = index + 1
                  const medalClass = RANK_CLASS[pos] ?? ''
                  return (
                    <li
                      key={team.nickname}
                      className={`ranking-card ranking-card--clickable ${medalClass}`}
                      onClick={() => navigate(`/view-formation/${team.id}`)}
                      title={`Vedi formazione di ${team.nickname}`}
                    >
                      <span className="rank-pos">{MEDALS[pos] ?? `#${pos}`}</span>
                      <span className="rank-nickname">{team.nickname}</span>
                      <span className="rank-points">{team.points} pt</span>
                      <span className="rank-arrow">›</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {/* ── SEZIONE 2: Classifica giocatori ── */}
          <section className="ranking-section">
            <h2 className="ranking-section-title">Classifica giocatori</h2>

            {players.length === 0 ? (
              <div className="ranking-empty">
                <p>Nessun giocatore nel listone</p>
                <p className="ranking-empty-hint">
                  L'admin deve prima aggiungere i giocatori
                </p>
              </div>
            ) : (
              <ol className="ranking-list">
                {players.map((player, index) => {
                  const pos        = index + 1
                  const medalClass = RANK_CLASS[pos] ?? ''
                  return (
                    <li key={player.id} className={`ranking-card ranking-card--player ${medalClass}`}>
                      <span className="rank-pos">{MEDALS[pos] ?? `#${pos}`}</span>
                      <div className="rank-player-info">
                        <span className="rank-nickname">{player.name}</span>
                        <div className="rank-player-badges">
                          <span className={`rank-role-badge rank-role-badge--${(player.role || '').toLowerCase()}`}>
                            {player.role}
                          </span>
                          <span className="rank-tier-badge">{tierLabel(player.tier)}</span>
                        </div>
                      </div>
                      <span className="rank-points">{player.points ?? 0} pt</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default Ranking
