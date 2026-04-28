import { useState, useEffect } from 'react'
import { fetchBrMeses, fetchBr, fetchBrHistorico } from '../api'
import IntMetricCard from './IntMetricCard'
import HorizontalBar from './HorizontalBar'
import Funnel from './Funnel'
import MonthSelector from './MonthSelector'
import LineChart from './LineChart'
import DoughnutChart from './DoughnutChart'
import CampaignTable from './CampaignTable'

const EMPTY = { tipo_de_lead: '', canal: '', fonte: '', status: '', informacoes_da_fonte: '' }
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
          <select value={filters.canal} onChange={e => setF('canal', e.target.value)}>
            <option value="">Canal</option>
            {(data?.canal_leads || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
          </select>
          <select value={filters.fonte} onChange={e => setF('fonte', e.target.value)}>
            <option value="">Fonte</option>
            {(data?.source_leads || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
          </select>
          <select value={filters.tipo_de_lead} onChange={e => setF('tipo_de_lead', e.target.value)}>
            <option value="">Tipo de Lead</option>
            {(data?.tipo_de_lead_leads || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
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
          <div className="metrics-grid">
            <IntMetricCard
              label="MQLs"
              value={data.mqls.toLocaleString('pt-BR')}
              subtitle="leads criados no mês"
              variation={calcVar(data.mqls, prevData?.mqls)}
            />
            <IntMetricCard
              label="SQLs"
              value={data.sqls.toLocaleString('pt-BR')}
              subtitle="convertidos no mês"
              variation={calcVar(data.sqls, prevData?.sqls)}
            />
            <IntMetricCard
              label="Perdidos"
              value={data.perdidos.toLocaleString('pt-BR')}
              subtitle="oportunidades perdidas"
              variation={calcVar(data.perdidos, prevData?.perdidos)}
            />
            <IntMetricCard
              label="Taxa MQL→SQL"
              value={`${data.taxa}%`}
              subtitle="conversão"
              variation={calcVar(data.taxa, prevData?.taxa)}
              accent
            />
          </div>

          <div className="funnel-donut-row">
            <Funnel mqls={data.mqls} sqls={data.sqls} perdidos={data.perdidos} theme="br" />
            <div className="chart-card donut-card">
              <p className="card-header">MQLs por Canal</p>
              <DoughnutChart data={data.canal_leads} />
            </div>
          </div>

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
            <div className="charts-grid">
              <div className="chart-card">
                <p className="card-header">Canal — MQLs</p>
                <HorizontalBar data={data.canal_leads} total={data.mqls} />
              </div>
              <div className="chart-card">
                <p className="card-header">Canal — SQLs</p>
                <HorizontalBar data={data.canal_sqls} total={data.sqls} variant="linen" />
              </div>
              <div className="chart-card">
                <p className="card-header">Fonte — MQLs</p>
                <HorizontalBar data={data.source_leads} total={data.mqls} />
              </div>
              <div className="chart-card">
                <p className="card-header">Fonte — SQLs</p>
                <HorizontalBar data={data.source_sqls} total={data.sqls} variant="linen" />
              </div>
              <div className="chart-card">
                <p className="card-header">Tipo de Lead</p>
                <HorizontalBar data={data.tipo_de_lead_leads} total={data.mqls} />
              </div>
              <div className="chart-card">
                <p className="card-header">Status</p>
                <HorizontalBar data={data.status_breakdown} total={data.mqls} variant="linen" />
              </div>
            </div>
          )}

          {subTab === 'midia-paga' && (
            <div className="charts-grid">
              <div className="chart-card">
                <p className="card-header">Mídia — MQLs</p>
                <HorizontalBar data={data.medium_leads} total={data.mqls} />
              </div>
              <div className="chart-card">
                <p className="card-header">Mídia — SQLs</p>
                <HorizontalBar data={data.medium_sqls} total={data.sqls} variant="linen" />
              </div>
              <div className="chart-card col-span-2">
                <p className="card-header">Top Campanhas — MQLs</p>
                <CampaignTable data={data.top_campanhas_leads} total={data.mqls} variant="br" />
              </div>
              <div className="chart-card col-span-2">
                <p className="card-header">Top Campanhas — SQLs</p>
                <CampaignTable data={data.top_campanhas_sqls} total={data.sqls} variant="br" />
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
