import React from 'react'

// Nordic clinical wellness ring — soft, multi-ring, precise
export default function WellnessRing({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const size = 220, stroke = 12
  const c = size / 2
  const r1 = c - stroke * 1.4  // outer accent
  const r2 = c - stroke * 3    // main progress
  const r3 = c - stroke * 5.2  // inner accent
  const circumference = 2 * Math.PI * r2
  const offset = circumference - (clamped / 100) * circumference

  const label = clamped >= 80 ? 'Optimal' : clamped >= 60 ? 'Balanced' : clamped >= 40 ? 'Watch' : 'Attend'
  const tone = clamped >= 60 ? '#4A7A5F' : clamped >= 40 ? '#C69749' : '#A94A3A'

  return (
    <div className="relative grid place-items-center" data-testid="wellness-score-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer subtle ring */}
        <circle cx={c} cy={c} r={r1} stroke="#E4DED4" strokeWidth={1} fill="none" />
        {/* Progress track */}
        <circle cx={c} cy={c} r={r2} stroke="#EFEAE0" strokeWidth={stroke} fill="none" />
        {/* Progress */}
        <circle
          cx={c} cy={c} r={r2}
          stroke="url(#ringGrad)"
          strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
        {/* Inner dotted */}
        <circle cx={c} cy={c} r={r3} stroke="#0E5F5C" strokeOpacity={0.15} strokeWidth={1} fill="none" strokeDasharray="2 5" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0E5F5C" />
            <stop offset="55%" stopColor="#146356" />
            <stop offset="100%" stopColor="#4A7A5F" />
          </linearGradient>
        </defs>

        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 2 * Math.PI - Math.PI/2
          const x1 = c + Math.cos(angle) * (r1 + 8)
          const y1 = c + Math.sin(angle) * (r1 + 8)
          const x2 = c + Math.cos(angle) * (r1 + (i % 5 === 0 ? 14 : 11))
          const y2 = c + Math.sin(angle) * (r1 + (i % 5 === 0 ? 14 : 11))
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7A8583" strokeOpacity={i % 5 === 0 ? 0.35 : 0.15} strokeWidth={i % 5 === 0 ? 1 : 0.6} />
        })}

        <text x={c} y={c - 2} textAnchor="middle" fontFamily="Fraunces" fontWeight="500" fontSize="52" fill="#1B2321" style={{fontVariationSettings:'"opsz" 144'}}>{clamped}</text>
        <text x={c} y={c + 24} textAnchor="middle" fontFamily="Geist" fontWeight="500" fontSize="11" fill={tone} letterSpacing="4">{label.toUpperCase()}</text>
      </svg>
    </div>
  )
}
