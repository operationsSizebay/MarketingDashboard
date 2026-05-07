const STEP_COLORS = ['#1e3a5f', '#2563eb', '#60a5fa']

export default function Funnel({ mqls, sqls, vendas = 0 }) {
  const steps = [
    { label: 'MQLs',   value: mqls },
    { label: 'SQLs',   value: sqls },
    { label: 'Vendas', value: vendas },
  ]

  const max  = Math.max(mqls, 1)
  const W    = 400
  const SH   = 64   // step height
  const CH   = 30   // connector height between steps
  const MIN  = 0.10 // minimum proportion (avoid zero-width bars)

  const getW  = (val) => W * Math.max(val / max, MIN)
  const totalH = steps.length * SH + (steps.length - 1) * CH

  const taxas = [
    null,
    mqls > 0 ? ((sqls   / mqls) * 100).toFixed(1) : '0.0',
    sqls > 0 ? ((vendas / sqls) * 100).toFixed(1) : '0.0',
  ]

  return (
    <div className="funnel">
      <p className="funnel-title">Funil de Conversão</p>
      <svg
        viewBox={`0 0 ${W} ${totalH}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {steps.map((step, i) => {
          const topW = getW(step.value)
          const botW = i + 1 < steps.length ? getW(steps[i + 1].value) : topW * 0.82
          const y    = i * (SH + CH)
          const tx   = (W - topW) / 2
          const bx   = (W - botW) / 2
          const midY = y + SH / 2
          const pts  = `${tx},${y} ${tx + topW},${y} ${bx + botW},${y + SH} ${bx},${y + SH}`

          return (
            <g key={step.label}>
              {/* Trapezoid */}
              <polygon points={pts} fill={STEP_COLORS[i]} />

              {/* Step label */}
              <text
                x={W / 2} y={midY - 9}
                textAnchor="middle"
                fill="rgba(255,255,255,0.85)"
                fontSize={10} fontWeight={700}
                style={{ letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                {step.label}
              </text>

              {/* Step value */}
              <text
                x={W / 2} y={midY + 11}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={18} fontWeight={700}
              >
                {step.value.toLocaleString('pt-BR')}
              </text>

              {/* Connector + conversion rate */}
              {i < steps.length - 1 && (
                <g>
                  <line
                    x1={W / 2} y1={y + SH}
                    x2={W / 2} y2={y + SH + CH - 8}
                    stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3,3"
                  />
                  <polygon
                    points={`${W / 2 - 5},${y + SH + CH - 10} ${W / 2 + 5},${y + SH + CH - 10} ${W / 2},${y + SH + CH - 2}`}
                    fill="#94a3b8"
                  />
                  <text
                    x={W / 2 + 10} y={y + SH + CH / 2 + 4}
                    textAnchor="start"
                    fill="#64748b"
                    fontSize={11}
                  >
                    {taxas[i + 1]}% conv.
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
