import { useState } from 'react'
import { useSquad } from '../context/SquadContext'
import './Formation.css'

// Calcio a 5: 1 POR + 4 GIO + 2 RIS
const SLOT_META = {
  p1:     { label: 'GIO', row: 'top'   },
  p2:     { label: 'GIO', row: 'top'   },
  p3:     { label: 'GIO', row: 'mid'   },
  p4:     { label: 'GIO', row: 'mid'   },
  gk:     { label: 'POR', row: 'gk'    },
  bench1: { label: 'RIS', row: 'bench' },
  bench2: { label: 'RIS', row: 'bench' },
}

function shortenName(name) {
  if (!name) return ''
  const parts = name.split(' ')
  if (parts.length === 1) return name
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

function PlayerCircle({ slot, player, isActive, onClick, isLocked }) {
  const meta    = SLOT_META[slot]
  const isBench = meta.row === 'bench'
  const isGk    = meta.row === 'gk'

  return (
    <button
      type="button"
      className={[
        'player-circle',
        isBench  ? 'player-circle--bench'  : '',
        isGk     ? 'player-circle--gk'     : '',
        player   ? 'player-circle--filled' : 'player-circle--empty',
        isActive ? 'player-circle--active' : '',
        isLocked ? 'player-circle--locked' : '',
      ].join(' ').trim()}
      onClick={onClick}
      disabled={isLocked && !player}
    >
      <span className="circle-role">{meta.label}</span>
      <span className="circle-name">
        {player ? shortenName(player.name) : '+'}
      </span>
    </button>
  )
}

function PlayerPicker({ squad, assignedIds, activeSlot, formation, onSelect, onClose }) {
  const isGkSlot = activeSlot === 'gk'

  const available = squad.filter((p) => {
    const inOtherSlot = assignedIds.includes(p.id) && formation[activeSlot]?.id !== p.id
    if (inOtherSlot) return false
    if (isGkSlot) return p.role === 'Portiere'
    return p.role !== 'Portiere'
  })

  const emptyMessage = isGkSlot
    ? 'Nessun portiere disponibile nella rosa.'
    : 'Nessun giocatore disponibile da schierare.'

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <span className="picker-title">
            {isGkSlot ? 'Scegli il portiere' : 'Scegli un giocatore'}
          </span>
          <button type="button" className="picker-close" onClick={onClose}>✕</button>
        </div>

        {available.length === 0 ? (
          <p className="picker-empty">{emptyMessage}</p>
        ) : (
          <ul className="picker-list">
            {available.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  className="picker-player-btn"
                  onClick={() => onSelect(player)}
                >
                  <span className="picker-player-name">{player.name}</span>
                  <div className="picker-player-badges">
                    <span className={`picker-role-badge picker-role-badge--${player.role.toLowerCase()}`}>
                      {player.role}
                    </span>
                    <span className={`picker-tier-badge picker-tier-badge--${player.tier}`}>
                      {player.tier === 1 ? '1ª' : player.tier === 2 ? '2ª' : '3ª'}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function Formation() {
  const {
    squad,
    formation,
    assignedIds,
    setFormationSlot,
    clearFormationSlot,
    isLocked,
  } = useSquad()

  const [activeSlot, setActiveSlot] = useState(null)

  function handleCircleClick(slot) {
    if (isLocked) return
    if (formation[slot]) {
      if (activeSlot === slot) {
        clearFormationSlot(slot)
        setActiveSlot(null)
      } else {
        setActiveSlot(slot)
      }
    } else {
      setActiveSlot(activeSlot === slot ? null : slot)
    }
  }

  function handleSelect(player) {
    if (!activeSlot) return
    setFormationSlot(activeSlot, player)
    setActiveSlot(null)
  }

  const fieldSlots  = ['p1', 'p2', 'p3', 'p4', 'gk']
  const benchSlots  = ['bench1', 'bench2']
  const filledCount = fieldSlots.filter((s) => formation[s]).length
  const benchCount  = benchSlots.filter((s) => formation[s]).length

  return (
    <main className="formation-page">
      {isLocked ? (
        <div className="formation-banner formation-banner--locked">🔒 Formazioni bloccate</div>
      ) : (
        <div className="formation-banner">
          ⏰ Formazioni bloccate il <strong>21 giugno alle 09:29</strong>
        </div>
      )}

      <header className="formation-header">
        <h1 className="formation-title">La tua formazione</h1>
        <p className="formation-subtitle">1 portiere + 4 giocatori + 2 riserve</p>
      </header>

      <div className="formation-pills">
        <span className="formation-pill">Titolari <strong>{filledCount}/5</strong></span>
        <span className="formation-pill">Riserve <strong>{benchCount}/2</strong></span>
        {squad.length === 0 && (
          <span className="formation-pill formation-pill--warn">⚠ Rosa vuota</span>
        )}
      </div>

      {/* Field */}
      <div className="football-field">
        <div className="field-center-line" />
        <div className="field-center-circle" />
        <div className="field-penalty-top" />
        <div className="field-penalty-bottom" />

        {/* Row top: 2 giocatori */}
        <div className="field-row field-row--top">
          {['p1', 'p2'].map((slot) => (
            <PlayerCircle
              key={slot} slot={slot}
              player={formation[slot]}
              isActive={activeSlot === slot}
              onClick={() => handleCircleClick(slot)}
              isLocked={isLocked}
            />
          ))}
        </div>

        {/* Row mid: 2 giocatori */}
        <div className="field-row field-row--mid">
          {['p3', 'p4'].map((slot) => (
            <PlayerCircle
              key={slot} slot={slot}
              player={formation[slot]}
              isActive={activeSlot === slot}
              onClick={() => handleCircleClick(slot)}
              isLocked={isLocked}
            />
          ))}
        </div>

        {/* Goalkeeper */}
        <div className="field-row field-row--gk">
          <PlayerCircle
            slot="gk"
            player={formation.gk}
            isActive={activeSlot === 'gk'}
            onClick={() => handleCircleClick('gk')}
            isLocked={isLocked}
          />
        </div>
      </div>

      {/* Bench */}
      <div className="bench-area">
        <span className="bench-label">PANCHINA</span>
        <div className="bench-slots">
          {benchSlots.map((slot) => (
            <PlayerCircle
              key={slot} slot={slot}
              player={formation[slot]}
              isActive={activeSlot === slot}
              onClick={() => handleCircleClick(slot)}
              isLocked={isLocked}
            />
          ))}
        </div>
      </div>

      {!isLocked && squad.length > 0 && (
        <p className="formation-hint">Tocca una posizione per assegnare un giocatore</p>
      )}

      {activeSlot && (
        <PlayerPicker
          squad={squad}
          assignedIds={assignedIds}
          activeSlot={activeSlot}
          formation={formation}
          onSelect={handleSelect}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </main>
  )
}
