import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import './Ranking.css'

const LS_TEAMS = 'fantaatl_teams'

function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

function calcPoints(teamSquad, supabasePlayers) {
  return (teamSquad || []).reduce((sum, tp) => {
    const sp = supabasePlayers.find(p => p.id === tp.id)
    return sum + (sp?.points || 0)
  }, 0)
}

const MEDALS     = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_CLASS = { 1: 'rank--gold', 2: 'rank--silver', 3: 'rank--bronze' }

function Ranking() {
  const [teams,   setTeams]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function buildRanking() {
      // 1. Fetch player points from Supabase
      const { data: supabasePlayers, error: playersErr } = await supabase
        .from('players')
        .select('id, name, points')

      console.log('Supabase players:', supabasePlayers, playersErr)

      // 2. Fetch non-admin users from Supabase to know who to exclude
      const { data: supabaseUsers, error: usersErr } = await supabase
        .from('users')
        .select('nickname, role')

      console.log('Supabase users:', supabaseUsers, usersErr)

      const adminNicknames = new Set(
        (supabaseUsers || [])
          .filter(u => u.role === 'admin')
          .map(u => u.nickname)
      )

      // 3. Read team squads from localStorage (saved by SquadContext)
      const rawTeams = readLS(LS_TEAMS, {})
      console.log('localStorage teams:', rawTeams)

      const players = supabasePlayers || []

      const ranked = Object.values(rawTeams)
        .filter(t => !adminNicknames.has(t.nickname))   // exclude admins
        .filter(t => t.role !== 'admin')                 // also exclude by stored role
        .map(t => ({
          nickname: t.nickname,
          points:   calcPoints(t.squad || [], players),
          count:    (t.squad || []).length,
        }))
        .sort((a, b) => b.points - a.points)

      console.log('Ranked teams:', ranked)
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
