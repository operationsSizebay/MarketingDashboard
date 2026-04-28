export default function AccessDenied({ email, onSignOut }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="access-denied-icon">🔒</div>
        <h1 className="login-title">Acesso Negado</h1>
        <p className="login-subtitle">
          Acesso restrito a emails <strong>@sizebay.com.br</strong> e <strong>@audaces.com</strong>
        </p>
        {email && (
          <p className="access-denied-email">
            Email utilizado: <strong>{email}</strong>
          </p>
        )}
        <button className="btn-signout-centered" onClick={onSignOut}>
          Sair e tentar com outro email
        </button>
      </div>
    </div>
  )
}
