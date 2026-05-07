export default function HorizontalBar({ data = [], total = 0, variant = 'default' }) {
  if (!data.length) return <p className="hbar-empty">Sem dados</p>

  const fillClass =
    variant === 'blue'      ? 'blue' :
    variant === 'blue-dark' ? 'blue-dark' :
    variant === 'linen'     ? 'linen' : ''

  return (
    <div className="hbar-list">
      {data.map(item => {
        const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'
        return (
          <div key={item.name} className="hbar-item">
            <div className="hbar-label" title={item.name}>{item.name || '—'}</div>
            <div className="hbar-track">
              <div
                className={`hbar-fill ${fillClass}`}
                style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
              />
            </div>
            <div className="hbar-value">
              {item.count} <span className="hbar-pct">({pct}%)</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
