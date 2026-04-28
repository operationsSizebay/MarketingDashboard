export default function HorizontalBar({ data = [], total = 0, variant = 'default' }) {
  if (!data.length) return <p className="hbar-empty">Sem dados</p>

  const fillClass =
    variant === 'blue'      ? 'blue' :
    variant === 'blue-dark' ? 'blue-dark' :
    variant === 'linen'     ? 'linen' : ''

  return (
    <div className="hbar-list">
      {data.map(item => (
        <div key={item.name} className="hbar-item">
          <div className="hbar-label" title={item.name}>{item.name || '—'}</div>
          <div className="hbar-track">
            <div
              className={`hbar-fill ${fillClass}`}
              style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
            />
          </div>
          <div className="hbar-value">{item.count}</div>
        </div>
      ))}
    </div>
  )
}
