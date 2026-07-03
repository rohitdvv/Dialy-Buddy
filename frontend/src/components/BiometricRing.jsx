import React from 'react'

// Elegant orbital biometric ring visualization
// props: score (0-100)
export default function BiometricRing({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const size = 220
  const stroke = 14
  const center = size / 2
  const r1 = center - stroke * 1.5     // outer accent ring
  const r2 = center - stroke * 3       // primary progress
  const r3 = center - stroke * 5       // inner dashed
  const circumference = 2 * Math.PI * r2
  const offset = circumference - (clamped / 100) * circumference

  const label = clamped >= 80 ? 'Peak' : clamped >= 60 ? 'Balanced' : clamped >= 40 ? 'Watch' : 'Attend'
  const tone = clamped >= 60 ? '#7A9371' : clamped >= 40 ? '#E2C07C' : '#B96D71'

  return (
    <div className="relative grid place-items-center" data-testid="wellness-score-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_18px_rgba(216,107,69,0.25)]">
        {/* Outer subtle ring */}
        <circle cx={center} cy={center} r={r1} stroke="rgba(255,255,255,0.06)" strokeWidth={1} fill="none" strokeDasharray="2 6" />
        {/* Track */}
        <circle cx={center} cy={center} r={r2} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={r2}
          stroke="url(#biometricGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
        {/* Inner dashed */}
        <circle cx={center} cy={center} r={r3} stroke="rgba(226,192,124,0.35)" strokeWidth={1} fill="none" strokeDasharray="3 5" />
        <defs>
          <linearGradient id="biometricGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D86B45" />
            <stop offset="55%" stopColor="#E2C07C" />
            <stop offset="100%" stopColor="#7A9371" />
          </linearGradient>
        </defs>

        {/* center text */}
        <text x={center} y={center - 4} textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="600" fontSize="46" fill="#F2EFE9">{clamped}</text>
        <text x={center} y={center + 22} textAnchor="middle" fontFamily="Outfit" fontWeight="400" fontSize="12" fill={tone} letterSpacing="4">{label.toUpperCase()}</text>
      </svg>
    </div>
  )
}
