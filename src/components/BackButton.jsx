import { useNavigate } from 'react-router-dom'
import './BackButton.css'

export default function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="back-btn"
      onClick={() => navigate(-1)}
      aria-label="Torna indietro"
    >
      ← Indietro
    </button>
  )
}
