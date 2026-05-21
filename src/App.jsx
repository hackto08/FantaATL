import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
import { SquadProvider } from './context/SquadContext'
import Login from './pages/Login'
import GameHome from './pages/GameHome'
import Team from './pages/Team'
import Players from './pages/Players'
import Ranking from './pages/Ranking'
import Rules from './pages/Rules'
import Formation from './pages/Formation'
import Admin from './pages/Admin'

function ProtectedRoute({ children }) {
  const user = localStorage.getItem('fantaatl_current_user')
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const currentUser = JSON.parse(localStorage.getItem('fantaatl_current_user') || 'null')
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/home" replace />
  return children
}

function Landing() {
  const navigate = useNavigate()

  return (
    <main className="home">
      <div className="home-content">
        <h1 className="title">FantaATL</h1>
        <p className="subtitle">Fantasy game ufficiale ATL</p>
        <button
          type="button"
          className="enter-button"
          onClick={() => navigate('/login')}
        >
          ENTRA NEL GIOCO
        </button>
      </div>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SquadProvider>
        <Routes>
          <Route path="/"        element={<Landing />}  />
          <Route path="/login"   element={<Login />}    />
          <Route path="/home"      element={<ProtectedRoute><GameHome /></ProtectedRoute>}  />
          <Route path="/team"      element={<ProtectedRoute><Team /></ProtectedRoute>}      />
          <Route path="/players"   element={<ProtectedRoute><Players /></ProtectedRoute>}   />
          <Route path="/ranking"   element={<ProtectedRoute><Ranking /></ProtectedRoute>}   />
          <Route path="/rules"     element={<ProtectedRoute><Rules /></ProtectedRoute>}     />
          <Route path="/formation" element={<ProtectedRoute><Formation /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </SquadProvider>
    </BrowserRouter>
  )
}

export default App
