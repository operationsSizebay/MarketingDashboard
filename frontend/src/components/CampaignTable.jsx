export default function CampaignTable({ data = [], total = 0, variant = 'int' }) {
  if (!data.length) return <p className="hbar-empty">Sem dados.</p>

  return (
    <table className="campaign-table">
      <thead>
        <tr>
          <th style={{ width: 36 }}>#</th>
          <th>Campanha</th>
          <th style={{ width: 64, textAlign: 'right' }}>Total</th>
          <th style={{ width: 140 }}>Progresso</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={item.name} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
            <td className="ct-rank">{i + 1}</td>
            <td className="ct-name" title={item.name}>{item.name || '—'}</td>
            <td className={`ct-count ${variant === 'br' ? 'br' : ''}`}>{item.count}</td>
            <td>
              <div className="mini-bar-track">
                <div
                  className={`mini-bar-fill ${variant === 'br' ? 'br' : ''}`}
                  style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%' }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
