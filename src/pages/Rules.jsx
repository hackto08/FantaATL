import './Rules.css'

const RULES = [
  { id: 1, points: '+10', label: 'Vittoria match',    description: 'Il tuo giocatore vince un incontro' },
  { id: 2, points: '+15', label: 'Passaggio turno',   description: 'Il tuo giocatore supera il proprio girone' },
  { id: 3, points: '+5',  label: 'Esultanza folle',   description: 'Esultanza votata dalla community' },
  { id: 4, points: '+20', label: 'MVP torneo',        description: 'Giocatore eletto MVP della giornata' },
  { id: 5, points: '+8',  label: 'Gol segnato',       description: 'Il tuo giocatore segna nel torneo' },
  { id: 6, points: '+3',  label: 'Assist decisivo',   description: 'Assist che porta alla vittoria' },
  { id: 7, points: '-10', label: 'Eliminazione',      description: 'Il tuo giocatore viene eliminato' },
  { id: 8, points: '-5',  label: 'Cartellino rosso',  description: 'Espulsione durante il match' },
]

function Rules() {
  return (
    <main className="rules-page">
      <header className="rules-header">
        <h1 className="rules-title">Regolamento FantaATL</h1>
        <p className="rules-subtitle">Tutti i punti del fantasy game ufficiale</p>
      </header>

      <ul className="rules-list">
        {RULES.map((rule) => {
          const isPositive = rule.points.startsWith('+')
          return (
            <li key={rule.id} className="rule-card">
              <span className={`rule-points${isPositive ? ' rule-points--pos' : ' rule-points--neg'}`}>
                {rule.points}
              </span>
              <div className="rule-info">
                <span className="rule-label">{rule.label}</span>
                <span className="rule-description">{rule.description}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

export default Rules
