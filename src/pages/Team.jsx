import { useNavigate } from 'react-router-dom'
import { useSquad } from '../context/SquadContext'
import { TIER_LABELS, SQUAD_MAX, TIER_LIMITS } from '../data/players'
import BackButton from '../components/BackButton'
import './Team.css'

function TierBadge({ tier }) {
  return (
    <span className={`team-tier-badge team-tier-badge--${tier}`}>
      {TIER_LABELS[tier]}
    </span>
  )
}

function RoleBadge({ role }) {
  return (
    <span className={`team-role-badge team-role-badge--${role.toLowerCase()}`}>
      {role}
    </span>
  )
}

export default function Team() {
  const navigate = useNavigate()
  const { squad, removePlayer, isLocked, tierCount } = useSquad()

  return (
    <main className="team-page">
      <BackButton />
      {isLocked ? (
        <div className="team-deadline team-deadline--locked">
          Mercato bloccato dalle ore 11:00
        </div>
      ) : (
        <div className="team-deadline">
          ⏰ Mercato bloccato oggi alle <strong>11:00</strong>
        </div>
      )}

      <header className="team-header">
        <h1 className="team-title">La tua rosa</h1>
        <p className="team-subtitle">Gestisci i giocatori scelti per il torneo</p>
      </header>

      {/* Summary pills */}
      <div className="team-summary">
        <span className="team-summary-pill">
          Totale <strong>{squad.length} / {SQUAD_MAX}</strong>
        </span>
        <span className="team-summary-pill team-summary-pill--tier1">
          1ª fascia <strong>{tierCount(1)} / {TIER_LIMITS[1]}</strong>
        </span>
        <span className="team-summary-pill team-summary-pill--tier2">
          2ª fascia <strong>{tierCount(2)} / {TIER_LIMITS[2]}</strong>
        </span>
        <span className="team-summary-pill team-summary-pill--tier3">
          3ª fascia <strong>{tierCount(3)} / {TIER_LIMITS[3]}</strong>
        </span>
      </div>

      {/* Player list */}
      <section className="team-section">
        <ul className="slot-list">
          {squad.length === 0 && (
            <li>
              <div className="player-slot player-slot--empty">
                <span className="slot-empty-label">Nessun giocatore nella rosa</span>
              </div>
            </li>
          )}
          {squad.map((player) => (
            <li key={player.id}>
              <div className="player-slot player-slot--filled">
                <div className="slot-info">
                  <span className="slot-name">{player.name}</span>
                  <div className="slot-badges">
                    <RoleBadge role={player.role} />
                    <TierBadge tier={player.tier} />
                  </div>
                </div>
                {!isLocked && (
                  <button
                    type="button"
                    className="slot-remove-btn"
                    onClick={() => removePlayer(player.id)}
                    title="Rimuovi dalla rosa"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!isLocked && (
        <button
          type="button"
          className="team-cta-btn"
          onClick={() => navigate('/players')}
        >
          SCEGLI GIOCATORI
        </button>
      )}
    </main>
  )
}
