const FILL_COLORS = {
  'blue-dark': '#1e3a5f',
  'blue':      '#60a5fa',
  'gray':      '#6b7280',
  'default':   '#2563eb',
}

export default function HorizontalBar({ data = [], total = 0, variant = 'default' }) {
  if (!data.length) return <p className="ranked-empty">Sem dados</p>

  const fill = FILL_COLORS[variant] ?? FILL_COLORS.default

  return (
    <div className="ranked-list">
      {data.map((item, i) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0
        return (
          <div key={item.name} className="ranked-item">
            <span className="ranked-pos">#{i + 1}</span>
            <div className="ranked-content">
              <div className="ranked-header">
                <span className="ranked-name" title={item.name}>{item.name || '—'}</span>
                <span className="ranked-count">{item.count}</span>
                <span className="ranked-pct">{pct.toFixed(1)}%</span>
              </div>
              <div className="ranked-track">
                <div className="ranked-fill" style={{ width: `${pct}%`, background: fill }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
