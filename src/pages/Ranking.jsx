import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getCurrentUser } from '../utils/auth'
import './Ranking.css'

const MEDALS     = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_CLASS = { 1: 'rank--gold', 2: 'rank--silver', 3: 'rank--bronze' }

function Ranking() {
  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buildRanking() {
      // Debug: who is currently logged in (does NOT affect the query)
      const currentUser = getCurrentUser()
      console.log('currentUser (logged in):', currentUser)

      // 1. ALL non-admin users — identical for every visitor
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, nickname, role')
        .neq('role', 'admin')

      console.log('users letti:', users, usersErr)

      if (!users || users.length === 0) {
        setTeams([])
        setLoading(false)
        return
      }

      // 2. Teams for those users
      const userIds = users.map(u => u.id)
      const { data: teamsData, error: teamsErr } = await supabase
        .from('teams')
        .select('id, user_id')
        .in('user_id', userIds)

      console.log('teams letti:', teamsData, teamsErr)

      // 3. team_players joined with player points
      const teamIds = (teamsData || []).map(t => t.id)
      let teamPlayers = []

      if (teamIds.length > 0) {
        const { data: tpData, error: tpErr } = await supabase
          .from('team_players')
          .select('team_id, players(id, points)')
          .in('team_id', teamIds)

        console.log('team_players letti:', tpData, tpErr)
        teamPlayers = tpData || []
      }

      // 4. Build ranked list
      const ranked = users.map(user => {
        const team      = (teamsData || []).find(t => t.user_id === user.id)
        const myPlayers = team
          ? teamPlayers.filter(tp => tp.team_id === team.id)
          : []
        const points = myPlayers.reduce((sum, tp) => sum + (tp.players?.points || 0), 0)

        return { nickname: user.nickname, points, count: myPlayers.length }
      })
        .sort((a, b) => b.points - a.points)

      console.log('classifica finale:', ranked)
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
            Gli utenti devono fare login e selezionare i giocatori
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
