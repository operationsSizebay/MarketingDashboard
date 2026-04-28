import { useState } from 'react'
import {
  SignedIn,
  SignedOut,
  useUser,
  useClerk,
  AuthenticateWithRedirectCallback,
} from '@clerk/clerk-react'
import DashboardBr from './components/DashboardBr'
import DashboardInt from './components/DashboardInt'
import LoginPage from './components/LoginPage'
import AccessDenied from './components/AccessDenied'

const ALLOWED = ['@sizebay.com.br', '@audaces.com']

function isAllowed(email) {
  return ALLOWED.some(d => email.endsWith(d))
}

function AuthenticatedApp() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [tab, setTab] = useState('br')

  const email = user?.primaryEmailAddress?.emailAddress || ''

  if (!isAllowed(email)) {
    return <AccessDenied email={email} onSignOut={() => signOut()} />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <span className="header-logo">Sizebay</span>
          <nav className="main-tabs">
            <button
              className={`tab-btn ${tab === 'br' ? 'active' : ''}`}
              onClick={() => setTab('br')}
            >
              <span className="badge badge-br">BR</span>
              Brasil
            </button>
            <button
              className={`tab-btn ${tab === 'int' ? 'active' : ''}`}
              onClick={() => setTab('int')}
            >
              <span className="badge badge-int">INT</span>
              Internacional
            </button>
          </nav>
          <div className="header-user">
            <span className="header-email">{email}</span>
            <button className="btn-signout" onClick={() => signOut()}>Sair</button>
          </div>
        </div>
      </header>
      <main>
        {tab === 'br' ? <DashboardBr /> : <DashboardInt />}
      </main>
    </div>
  )
}

export default function App() {
  if (window.location.pathname === '/sso-callback') {
    return <AuthenticateWithRedirectCallback />
  }

  return (
    <>
      <SignedOut>
        <LoginPage />
      </SignedOut>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </>
  )
}
