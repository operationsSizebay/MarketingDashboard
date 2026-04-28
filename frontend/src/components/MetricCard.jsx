export default function MetricCard({ label, value, subtitle, accent }) {
  return (
    <div className={`metric-card${accent ? ' accent' : ''}`}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  )
}
