import '../chartSetup'
import { Doughnut } from 'react-chartjs-2'

const PALETTE = {
  // INT — operações
  'Europa':              '#303030',
  'Latam':               '#BF512B',
  'North America':       '#4285F4',
  'Asia':                '#E6D6CD',
  'Others':              '#888888',
  // BR — canais
  'Inbound':             '#303030',
  'Outbound':            '#BF512B',
  'Alianças/Parceiros':  '#888888',
  'TechTouch':           '#D2ECFF',
  'Eventos':             '#E6D6CD',
}
const FALLBACK = ['#303030','#BF512B','#4285F4','#E6D6CD','#888','#A0C4FF','#FFB347','#B5EAD7']

function color(name, i) {
  return PALETTE[name] ?? FALLBACK[i % FALLBACK.length]
}

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
  if (!data.length) return <p className="hbar-empty">Sem dados.</p>

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map((d, i) => color(d.name, i)),
      borderColor: '#fff',
      borderWidth: 2,
    }],
  }

  return <Doughnut data={chartData} options={OPTIONS} />
}
