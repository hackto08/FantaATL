import { useState, useEffect, useRef } from 'react'
import { useSquad } from '../context/SquadContext'
import { supabase } from '../supabase'
import { getCurrentUser } from '../utils/auth'
import BackButton from '../components/BackButton'
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

const SLOTS = ['gk', 'p1', 'p2', 'p3', 'p4', 'bench1', 'bench2']

// Maps internal slot keys → Supabase column names
const SLOT_TO_COL = {
  gk:     'goalkeeper',
  p1:     'player1',
  p2:     'player2',
  p3:     'player3',
  p4:     'player4',
  bench1: 'bench1',
  bench2: 'bench2',
}
// Inverse: Supabase column → internal slot key
const COL_TO_SLOT = Object.fromEntries(
  Object.entries(SLOT_TO_COL).map(([slot, col]) => [col, slot])
)

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
    loadFormation,
    isLocked,
  } = useSquad()

  const [activeSlot,  setActiveSlot]  = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [clearing,    setClearing]    = useState(false)
  const [cleared,     setCleared]     = useState(false)

  // Load formation from Supabase once squad is available
  const hasLoaded = useRef(false)
  useEffect(() => {
    if (squad.length === 0 || hasLoaded.current) return

    async function fetchFormation() {
      const user = getCurrentUser()
      if (!user?.id) return

      const { data, error } = await supabase
        .from('formations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('formation from Supabase:', data, error)

      if (data) {
        hasLoaded.current = true
        const loaded = {}
        SLOTS.forEach(slot => {
          const col = SLOT_TO_COL[slot]
          const pid = data[col]
          loaded[slot] = pid ? (squad.find(p => p.id === pid) || null) : null
        })
        loadFormation(loaded)
      } else {
        // No saved formation yet — mark as checked so we don't re-fetch
        hasLoaded.current = true
      }
    }

    fetchFormation()
  }, [squad, loadFormation])

  // Save formation to Supabase
  async function handleSave() {
    const user = getCurrentUser()
    if (!user?.id) return

    setSaving(true)
    setSaved(false)
    setSaveError('')

    const payload = { user_id: user.id }
    SLOTS.forEach(slot => {
      const col = SLOT_TO_COL[slot]
      payload[col] = formation[slot]?.id || null
    })

    console.log('saving formation:', payload)

    const { error } = await supabase
      .from('formations')
      .upsert(payload, { onConflict: 'user_id' })

    console.log('save formation error:', error)
    setSaving(false)

    if (error) {
      setSaveError(`Errore: ${error.message}`)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  // Clear formation — reset all slots to null locally and in Supabase
  async function handleClear() {
    const user = getCurrentUser()
    if (!user?.id) return

    setClearing(true)
    setSaved(false)
    setSaveError('')
    setCleared(false)

    const emptyPayload = { user_id: user.id }
    SLOTS.forEach(slot => { emptyPayload[SLOT_TO_COL[slot]] = null })

    console.log('clearing formation:', emptyPayload)

    const { error } = await supabase
      .from('formations')
      .upsert(emptyPayload, { onConflict: 'user_id' })

    console.log('clear formation error:', error)
    setClearing(false)

    if (!error) {
      loadFormation({})          // resets all slots to null in context
      setCleared(true)
      setTimeout(() => setCleared(false), 3000)
    } else {
      setSaveError(`Errore: ${error.message}`)
    }
  }

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
      <BackButton />
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

      {/* Save / Clear buttons */}
      {!isLocked && (
        <div className="formation-save-area">
          {saved && (
            <p className="formation-save-success">✓ Formazione salvata correttamente</p>
          )}
          {cleared && (
            <p className="formation-save-success">✓ Formazione svuotata correttamente</p>
          )}
          {saveError && (
            <p className="formation-save-error">{saveError}</p>
          )}
          <button
            type="button"
            className="formation-save-btn"
            onClick={handleSave}
            disabled={saving || clearing}
          >
            {saving ? 'Salvataggio...' : 'SALVA FORMAZIONE'}
          </button>
          <button
            type="button"
            className="formation-clear-btn"
            onClick={handleClear}
            disabled={saving || clearing}
          >
            {clearing ? 'Svuotamento...' : 'SVUOTA FORMAZIONE'}
          </button>
        </div>
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
