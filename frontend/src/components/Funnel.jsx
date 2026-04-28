export default function Funnel({ mqls, sqls, perdidos, theme = 'br' }) {
  const isInt = theme === 'int'
  const taxaSql    = mqls > 0 ? ((sqls / mqls) * 100).toFixed(1) : '0.0'
  const taxaPerdido= mqls > 0 ? ((perdidos / mqls) * 100).toFixed(1) : '0.0'
  const pctSql     = Math.max(parseFloat(taxaSql), 3)
  const pctPerdido = Math.max(parseFloat(taxaPerdido), 3)

  return (
    <div className="funnel">
      <p className="funnel-title">Funil de Conversão</p>

      <div className="funnel-step">
        <div className={`funnel-bar${isInt ? ' int-mql' : ''}`} style={{ width: '100%' }}>
          <span className="funnel-label">MQL</span>
          <span className="funnel-value">{mqls.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="funnel-arrow">▼ <span className="funnel-rate">{taxaSql}% de conversão</span></div>

      <div className="funnel-step">
        <div className={`funnel-bar sql${isInt ? ' int' : ''}`} style={{ width: `${pctSql}%` }}>
          <span className="funnel-label">SQL</span>
          <span className="funnel-value">{sqls.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="funnel-arrow">▼ <span className="funnel-rate">{taxaPerdido}% perdidos</span></div>

      <div className="funnel-step">
        <div className="funnel-bar perdido" style={{ width: `${pctPerdido}%` }}>
          <span className="funnel-label">Perdidos</span>
          <span className="funnel-value">{perdidos.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  )
}
