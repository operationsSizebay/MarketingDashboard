import '../chartSetup'
import { Line } from 'react-chartjs-2'

const OPTIONS = {
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { position: 'top', labels: { font: { size: 12 }, padding: 16 } },
    title: { display: false },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
    x: { grid: { display: false } },
  },
}

export default function LineChart({ historico = [] }) {
  if (!historico.length) return <p className="hbar-empty">Sem dados históricos.</p>

  const data = {
    labels: historico.map(h => h.mes),
    datasets: [
      {
        label: 'MQLs',
        data: historico.map(h => h.mqls),
        borderColor: '#303030',
        backgroundColor: 'rgba(48,48,48,0.06)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#303030',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'SQLs',
        data: historico.map(h => h.sqls),
        borderColor: '#BF512B',
        backgroundColor: 'rgba(191,81,43,0.06)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#BF512B',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  return <Line data={data} options={OPTIONS} />
}
