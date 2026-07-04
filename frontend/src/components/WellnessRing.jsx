import React from 'react'
import { motion } from 'framer-motion'

// Nordic clinical wellness ring — soft, multi-ring, precise
export default function WellnessRing({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)))
  const size = 160
  const stroke = 10
  const c = size / 2
  const r1 = c - stroke * 1.2   // outer accent (muted dashed)
  const r2 = c - stroke * 2.8   // main progress
  const r3 = c - stroke * 4.6   // inner accent (copper dashed)
  const circumference = 2 * Math.PI * r2
  const targetOffset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative grid place-items-center" data-testid="wellness-score-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_12px_rgba(11,79,92,0.35)]">
        {/* Track */}
        <circle cx={c} cy={c} r={r2} stroke="#EFEAE0" strokeWidth={stroke} fill="none" />
        {/* Outer muted dashed ring */}
        <circle cx={c} cy={c} r={r1} stroke="#8B92A5" strokeWidth={2} fill="none" strokeDasharray="4 4" opacity={0.4} />
        {/* Inner copper dashed ring */}
        <circle cx={c} cy={c} r={r3} stroke="#B87333" strokeWidth={2} fill="none" strokeDasharray="4 4" opacity={0.3} />
        {/* Progress */}
        <motion.circle
          cx={c} cy={c} r={r2}
          stroke="#0B4F5C"
          strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${c} ${c})`}
        />
        {/* Score text */}
        <text
          x={c} y={c + 3}
          textAnchor="middle"
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontWeight="500"
          fontSize="36"
          fill="#161B2E"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {clamped}
        </text>
        {/* Label */}
        <text
          x={c} y={c + 22}
          textAnchor="middle"
          fontFamily="Inter, Geist, ui-sans-serif, system-ui, sans-serif"
          fontWeight="500"
          fontSize="9"
          fill="#8B92A5"
          letterSpacing="3"
        >
          WELLNESS SCORE
        </text>
      </svg>
    </div>
  )
}
