export default function Funnel({ mqls, sqls, vendas = 0, theme = 'br' }) {
  const isInt = theme === 'int'
  const taxaSql   = mqls > 0 ? ((sqls / mqls) * 100).toFixed(1) : '0.0'
  const taxaVenda = sqls > 0 ? ((vendas / sqls) * 100).toFixed(1) : '0.0'
  const pctSql    = mqls > 0 ? Math.max((sqls / mqls) * 100, 5) : 5
  const pctVenda  = sqls > 0 ? Math.max((vendas / sqls) * 100, 5) : 5

  return (
    <div className="funnel">
      <p className="funnel-title">Funil de Conversão</p>

      <div className="funnel-step">
        <div className={`funnel-bar${isInt ? ' int-mql' : ''}`} style={{ width: '100%' }}>
          <span className="funnel-label">MQLs</span>
          <span className="funnel-value">{mqls.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="funnel-arrow">▼ <span className="funnel-rate">{taxaSql}% convertidos em SQL</span></div>

      <div className="funnel-step">
        <div className={`funnel-bar sql${isInt ? ' int' : ''}`} style={{ width: `${pctSql}%` }}>
          <span className="funnel-label">SQLs</span>
          <span className="funnel-value">{sqls.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className="funnel-arrow">▼ <span className="funnel-rate">{taxaVenda}% fechados em Venda</span></div>

      <div className="funnel-step">
        <div className={`funnel-bar venda${isInt ? ' int' : ''}`} style={{ width: `${pctVenda}%` }}>
          <span className="funnel-label">Vendas</span>
          <span className="funnel-value">{vendas.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  )
}
