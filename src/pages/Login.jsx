import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useSquad } from '../context/SquadContext'
import { saveCurrentUser } from '../utils/auth'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login } = useSquad()

  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!nickname.trim() || !password.trim()) {
      setError('Compila tutti i campi.')
      return
    }

    setLoading(true)

    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', nickname.trim())
      .eq('password', password.trim())
      .maybeSingle()

    console.log(data, dbError)
    setLoading(false)

    if (dbError || !data) {
      setError('Credenziali non valide.')
      return
    }

    const userObj = { id: data.id, nickname: data.nickname, role: data.role || 'user' }
    saveCurrentUser(userObj)
    login(userObj)
    navigate('/home')
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <h1 className="login-title">Accedi a FantaATL</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Nickname"
              className="login-input"
              autoComplete="username"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'ACCESSO IN CORSO…' : 'ACCEDI'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default Login
