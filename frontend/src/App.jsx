import { useState } from 'react'
import DashboardBr from './components/DashboardBr'
import DashboardInt from './components/DashboardInt'

export default function App() {
  const [tab, setTab] = useState('br')

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
        </div>
      </header>
      <main>
        {tab === 'br' ? <DashboardBr /> : <DashboardInt />}
      </main>
    </div>
  )
}
