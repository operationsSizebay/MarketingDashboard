import { useState, useEffect } from 'react'
import { fetchBrMeses, fetchBr, fetchBrHistorico } from '../api'
import IntMetricCard from './IntMetricCard'
import HorizontalBar from './HorizontalBar'
import Funnel from './Funnel'
import MonthSelector from './MonthSelector'
import LineChart from './LineChart'
import DoughnutChart from './DoughnutChart'
import CampaignTable from './CampaignTable'

const EMPTY = { fonte: '', status: '', informacoes_da_fonte: '' }
const SUB_TABS = [
  { key: 'visao-geral', label: 'Visão Geral' },
  { key: 'midia-paga',  label: 'Mídia Paga' },
  { key: 'historico',   label: 'Histórico' },
]

function prevMonth(mes) {
  const [y, m] = mes.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function calcVar(curr, prev) {
  if (prev == null || prev === 0) return null
  return ((curr - prev) / prev * 100).toFixed(1)
}

function SectionDivider({ title }) {
  return (
    <div className="section-divider">
      <div className="section-divider-line" />
      <span className="section-divider-title">{title}</span>
      <div className="section-divider-line" />
    </div>
  )
}

function PerdidosSection({ perdidos_mes, motivos_perda }) {
  if (perdidos_mes == null) return null
  return (
    <div className="perdidos-section">
      <div className="perdidos-header">
        <div>
          <div className="perdidos-total">{(perdidos_mes ?? 0).toLocaleString('pt-BR')}</div>
          <div className="perdidos-label">perdidos no mês</div>
        </div>
        <p className="card-header" style={{ marginBottom: 0, marginLeft: 'auto' }}>Motivos de Perda</p>
      </div>
      {motivos_perda && motivos_perda.length > 0 && (
        <div className="ranked-list">
          {motivos_perda.map((m, i) => (
            <div key={m.motivo} className="ranked-item">
              <span className="ranked-pos">#{i + 1}</span>
              <div className="ranked-content">
                <div className="ranked-header">
                  <span className="ranked-name">{m.motivo}</span>
                  <span className="ranked-count">{m.count}</span>
                  <span className="ranked-pct">{m.percentual}%</span>
                </div>
                <div className="ranked-track">
                  <div className="ranked-fill" style={{ width: `${m.percentual}%`, background: '#BF512B' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardBr() {
  const [meses,     setMeses]     = useState([])
  const [mes,       setMes]       = useState(null)
  const [filters,   setFilters]   = useState(EMPTY)
  const [data,      setData]      = useState(null)
  const [prevData,  setPrevData]  = useState(null)
  const [historico, setHistorico] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [subTab,    setSubTab]    = useState('visao-geral')

  useEffect(() => {
    fetchBrMeses()
      .then(m => { setMeses(m); if (m.length) setMes(m[0]) })
      .catch(e => setError(e.message))
    fetchBrHistorico()
      .then(setHistorico)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!mes) return
    setLoading(true)
    setError(null)
    const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    const prev = prevMonth(mes)
    Promise.all([
      fetchBr(mes, active),
      fetchBr(prev, active).catch(() => null),
    ])
      .then(([curr, p]) => { setData(curr); setPrevData(p) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [mes, filters])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const reset = () => setFilters(EMPTY)
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="dashboard br-dashboard">
      <div className="controls-row">
        <MonthSelector meses={meses} value={mes} onChange={setMes} />
        <div className="filters">
          <select value={filters.fonte} onChange={e => setF('fonte', e.target.value)}>
            <option value="">Fonte</option>
            {(data?.source_leads || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setF('status', e.target.value)}>
            <option value="">Status</option>
            {(data?.status_breakdown || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
          </select>
          <select value={filters.informacoes_da_fonte} onChange={e => setF('informacoes_da_fonte', e.target.value)}>
            <option value="">Inf. da Fonte</option>
            {(data?.informacoes_da_fonte_leads || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
          </select>
          {hasFilters && <button className="btn-reset" onClick={reset}>Limpar</button>}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading-overlay">Carregando...</div>}

      {data && (
        <>
          <div className="sub-tab-bar">
            {SUB_TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`sub-tab-btn${subTab === key ? ' active' : ''}`}
                onClick={() => setSubTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {subTab === 'visao-geral' && (
            <>
              {/* ── Seção: Leads ── */}
              <SectionDivider title="Leads" />

              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <IntMetricCard
                  label="MQLs"
                  value={data.mqls.toLocaleString('pt-BR')}
                  subtitle="leads inbound no mês"
                  variation={calcVar(data.mqls, prevData?.mqls)}
                />
                <IntMetricCard
                  label="SQLs"
                  value={data.sqls.toLocaleString('pt-BR')}
                  subtitle="convertidos no mês"
                  variation={calcVar(data.sqls, prevData?.sqls)}
                />
                <IntMetricCard
                  label="Taxa MQL→SQL"
                  value={`${data.taxa}%`}
                  subtitle="conversão de leads"
                  variation={calcVar(data.taxa, prevData?.taxa)}
                  accent
                />
              </div>

              <div className="funnel-donut-row">
                <Funnel mqls={data.mqls} sqls={data.sqls} vendas={data.vendas_mes ?? 0} />
                <div className="chart-card donut-card">
                  <p className="card-header">MQLs por Fonte</p>
                  <DoughnutChart data={data.source_leads} />
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-card">
                  <p className="card-header">Fonte — MQLs</p>
                  <HorizontalBar data={data.source_leads} total={data.mqls} variant="blue" />
                </div>
                <div className="chart-card">
                  <p className="card-header">Fonte — SQLs</p>
                  <HorizontalBar data={data.source_sqls} total={data.sqls} variant="blue-dark" />
                </div>
                <div className="chart-card">
                  <p className="card-header">Status</p>
                  <HorizontalBar data={data.status_breakdown} total={data.mqls} variant="blue" />
                </div>
                <div className="chart-card">
                  <p className="card-header">Informações da Fonte</p>
                  <HorizontalBar data={data.informacoes_da_fonte_leads} total={data.mqls} variant="blue-dark" />
                </div>
              </div>

              {/* ── Seção: Vendas ── */}
              <SectionDivider title="Vendas" />

              <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <IntMetricCard
                  label="Vendas"
                  value={(data.vendas_mes ?? 0).toLocaleString('pt-BR')}
                  subtitle="fechamentos no mês"
                  variation={calcVar(data.vendas_mes, prevData?.vendas_mes)}
                />
              </div>

              <PerdidosSection perdidos_mes={data.perdidos_mes} motivos_perda={data.motivos_perda} />
            </>
          )}

          {subTab === 'midia-paga' && (
            <div className="charts-grid">
              <div className="chart-card">
                <p className="card-header">Mídia — MQLs</p>
                <HorizontalBar data={data.medium_leads} total={data.mqls} variant="blue" />
              </div>
              <div className="chart-card">
                <p className="card-header">Mídia — SQLs</p>
                <HorizontalBar data={data.medium_sqls} total={data.sqls} variant="blue-dark" />
              </div>
              <div className="chart-card">
                <p className="card-header">UTM Source — Vendas</p>
                <HorizontalBar data={data.source_vendas} total={data.vendas_mes ?? 0} variant="blue" />
              </div>
              <div className="chart-card">
                <p className="card-header">UTM Medium — Vendas</p>
                <HorizontalBar data={data.medium_vendas} total={data.vendas_mes ?? 0} variant="blue-dark" />
              </div>
              <div className="chart-card col-span-2">
                <p className="card-header">Top 5 Campanhas — Vendas</p>
                <CampaignTable data={data.camp_vendas} total={data.vendas_mes ?? 0} />
              </div>
              <div className="chart-card col-span-2">
                <p className="card-header">Top Campanhas — MQLs</p>
                <CampaignTable data={data.top_campanhas_leads} total={data.mqls} />
              </div>
              <div className="chart-card col-span-2">
                <p className="card-header">Top Campanhas — SQLs</p>
                <CampaignTable data={data.top_campanhas_sqls} total={data.sqls} />
              </div>
            </div>
          )}

          {subTab === 'historico' && (
            <div className="chart-card">
              <p className="card-header">Evolução Mensal — MQLs e SQLs</p>
              <LineChart historico={historico} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
