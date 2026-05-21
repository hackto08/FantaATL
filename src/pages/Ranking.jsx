import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getCurrentUser } from '../utils/auth'
import './Ranking.css'

const STARTER_COLS = ['goalkeeper', 'player1', 'player2', 'player3', 'player4']

const MEDALS     = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_CLASS = { 1: 'rank--gold', 2: 'rank--silver', 3: 'rank--bronze' }

function Ranking() {
  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buildRanking() {
      console.log('currentUser (logged in):', getCurrentUser())

      // 1. All non-admin users
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, nickname, role')
        .neq('role', 'admin')

      console.log('users:', users, usersErr)

      if (!users || users.length === 0) {
        setTeams([])
        setLoading(false)
        return
      }

      // 2. Formations for those users (starters only)
      const userIds = users.map(u => u.id)
      const { data: formations, error: formErr } = await supabase
        .from('formations')
        .select('user_id, goalkeeper, player1, player2, player3, player4')
        .in('user_id', userIds)

      console.log('formations:', formations, formErr)

      // 3. Collect unique starter player IDs across all formations
      const starterIds = [
        ...new Set(
          (formations || [])
            .flatMap(f => STARTER_COLS.map(col => f[col]))
            .filter(Boolean)
        ),
      ]

      // 4. Fetch points for those players
      let playersMap = {}
      if (starterIds.length > 0) {
        const { data: players, error: playersErr } = await supabase
          .from('players')
          .select('id, points')
          .in('id', starterIds)

        console.log('players:', players, playersErr)

        playersMap = Object.fromEntries((players || []).map(p => [p.id, p.points || 0]))
      }

      // 5. Build ranking
      const ranked = users.map(user => {
        const formation = (formations || []).find(f => f.user_id === user.id)
        const points = formation
          ? STARTER_COLS.reduce((sum, col) => {
              const pid = formation[col]
              return sum + (pid ? (playersMap[pid] || 0) : 0)
            }, 0)
          : 0

        return { nickname: user.nickname, points }
      })
        .sort((a, b) => b.points - a.points)

      console.log('ranking finale:', ranked)
      setTeams(ranked)
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
      ) : teams.length === 0 ? (
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
              <li key={team.nickname} className={`ranking-card ${medalClass}`}>
                <span className="rank-pos">{MEDALS[pos] ?? `#${pos}`}</span>
                <span className="rank-nickname">{team.nickname}</span>
                <span className="rank-points">{team.points} pt</span>
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}

export default Ranking
