export default function IntMetricCard({ label, value, subtitle, variation, accent }) {
  const varNum = variation != null ? parseFloat(variation) : null

  return (
    <div className={`int-metric-card${accent ? ' accent' : ''}`}>
      <p className="int-metric-label">{label}</p>
      <div className="int-metric-value">{value}</div>
      {subtitle && <p className="int-metric-subtitle">{subtitle}</p>}
      {varNum != null && (
        <p className={`int-metric-variation ${varNum >= 0 ? 'positive' : 'negative'}`}>
          {varNum >= 0 ? '▲' : '▼'} {Math.abs(varNum)}% vs mês anterior
        </p>
      )}
    </div>
  )
}
