import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth'
import './GameHome.css'

const USER_CARDS = [
  {
    id: 'team',
    emoji: '⚽',
    title: 'La Tua Squadra',
    description: 'Gestisci la tua squadra',
    route: '/team',
  },
  {
    id: 'ranking',
    emoji: '🏆',
    title: 'Classifica',
    description: 'Vedi la classifica generale',
    route: '/ranking',
  },
  {
    id: 'live',
    emoji: '🔴',
    title: 'Torneo Live',
    description: 'Segui il torneo in diretta',
    route: null,
  },
  {
    id: 'formation',
    emoji: '🟩',
    title: 'Formazione',
    description: 'Schiera i tuoi titolari',
    route: '/formation',
  },
  {
    id: 'rules',
    emoji: '📋',
    title: 'Regolamento',
    description: 'Scopri tutte le regole del FantaATL',
    route: '/rules',
  },
]

const ADMIN_CARD = {
  id: 'admin',
  emoji: '⚙️',
  title: 'Pannello Admin',
  description: 'Gestisci torneo, giocatori e punti',
  route: '/admin',
}

function GameHome() {
  const navigate    = useNavigate()
  const currentUser = getCurrentUser()
  const isAdmin     = currentUser?.role === 'admin'

  const cards = isAdmin ? [ADMIN_CARD, ...USER_CARDS] : USER_CARDS

  return (
    <main className="gamehome-page">
      <header className="gamehome-header">
        <h1 className="gamehome-title">FantaATL</h1>
        <p className="gamehome-subtitle">
          {isAdmin
            ? `Benvenuto, ${currentUser.nickname} 👑`
            : 'Benvenuto nel fantasy game ATL'}
        </p>
      </header>

      <section className="gamehome-cards">
        {cards.map((card) => (
          <div
            key={card.id}
            className={[
              'gamehome-card',
              card.route        ? 'gamehome-card--link'  : '',
              card.id === 'admin' ? 'gamehome-card--admin' : '',
            ].join(' ').trim()}
            onClick={() => card.route && navigate(card.route)}
          >
            <span className="card-emoji">{card.emoji}</span>
            <h2 className="card-title">{card.title}</h2>
            <p className="card-description">{card.description}</p>
          </div>
        ))}
      </section>
    </main>
  )
}

export default GameHome
