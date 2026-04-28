export default function MonthSelector({ meses, value, onChange }) {
  return (
    <div className="month-selector">
      <label htmlFor="month-sel">Mês</label>
      <select
        id="month-sel"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={!meses.length}
      >
        {!meses.length && <option value="">Carregando...</option>}
        {meses.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  )
}
