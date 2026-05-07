import '../chartSetup'
import { Doughnut } from 'react-chartjs-2'

const PALETTE = {
  'Europa':        '#1e3a5f',
  'Latam':         '#2563eb',
  'North America': '#60a5fa',
  'Asia':          '#bfdbfe',
  'Others':        '#6b7280',
  'Brasil (ignorar)': '#d1d5db',
}

const FALLBACK = ['#1e3a5f', '#2563eb', '#60a5fa', '#bfdbfe', '#6b7280', '#374151', '#93c5fd', '#d1d5db']

const OPTIONS = {
  responsive: true,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'right',
      labels: { font: { size: 12 }, padding: 14, boxWidth: 12 },
    },
  },
}

export default function DoughnutChart({ data = [] }) {
  if (!data.length) return <p className="ranked-empty">Sem dados.</p>

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map((d, i) => PALETTE[d.name] ?? FALLBACK[i % FALLBACK.length]),
      borderColor: '#fff',
      borderWidth: 2,
    }],
  }

  return <Doughnut data={chartData} options={OPTIONS} />
}
