import { useState } from 'react'

const SENHA = 'Sizebay@2026'

export default function LoginPage({ onLogin }) {
  const [senha, setSenha]   = useState('')
  const [erro, setErro]     = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (senha === SENHA) {
        localStorage.setItem('sz_auth', '1')
        onLogin()
      } else {
        setErro(true)
        setSenha('')
      }
      setLoading(false)
    }, 300)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Sizebay</div>
        <p className="login-subtitle">Marketing Dashboard</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErro(false) }}
            className={`login-input${erro ? ' error' : ''}`}
            autoFocus
          />
          {erro && <p className="login-error">Senha incorreta</p>}
          <button type="submit" className="login-btn" disabled={loading || !senha}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
