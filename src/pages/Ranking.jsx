import { useState, useEffect } from 'react'
import './Ranking.css'

const LS_TEAMS   = 'fantaatl_teams'
const LS_PLAYERS = 'fantaatl_players'

function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

function calcPoints(teamPlayers, adminPlayers) {
  return (teamPlayers || []).reduce((sum, tp) => {
    const ap = adminPlayers.find(p => p.id === tp.id)
    return sum + (ap?.points || 0)
  }, 0)
}

const MEDALS     = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_CLASS = { 1: 'rank--gold', 2: 'rank--silver', 3: 'rank--bronze' }

function Ranking() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    const rawTeams   = readLS(LS_TEAMS,   {})
    const adminPlayers = readLS(LS_PLAYERS, [])

    const ranked = Object.values(rawTeams)
      .filter(t => t.role !== 'admin')         // exclude admin accounts
      .map(t => ({
        nickname: t.nickname,
        points:   calcPoints(t.squad || [], adminPlayers),
        count:    (t.squad || []).length,
      }))
      .sort((a, b) => b.points - a.points)

    setTeams(ranked)
  }, [])

  return (
    <main className="ranking-page">
      <header className="ranking-header">
        <h1 className="ranking-title">Classifica</h1>
        <p className="ranking-subtitle">Ranking ufficiale FantaATL</p>
      </header>

      {teams.length === 0 ? (
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
