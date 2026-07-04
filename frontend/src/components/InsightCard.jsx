import React from 'react'
import { motion } from 'framer-motion'
import { Salad, Dumbbell, Brain, Moon } from 'lucide-react'

const CAT = {
  DIET: { icon: Salad, border: '#0B4F5C' },
  FITNESS: { icon: Dumbbell, border: '#3D6B5A' },
  STRESS: { icon: Brain, border: '#8B3D3D' },
  SLEEP: { icon: Moon, border: '#2D5F8F' },
}

const PRIORITY = {
  HIGH: { bg: '#8B3D3D', color: '#FFFFFF' },
  MEDIUM: { bg: '#C8A040', color: '#161B2E' },
  LOW: { bg: '#3D6B5A', color: '#FFFFFF' },
}

export default function InsightCard({ rec, idx, variants }) {
  const meta = CAT[rec.category] || CAT.STRESS
  const priority = PRIORITY[rec.priority] || PRIORITY.LOW
  const Icon = meta.icon
  return (
    <motion.div
      data-testid={`insight-card-${idx}`}
      className="card p-5 relative overflow-hidden"
      style={{ borderLeft: `3px solid ${meta.border}` }}
      variants={variants}
      whileHover={{ y: -2, boxShadow: '0 12px 40px -18px rgba(11,79,92,0.18)' }}
      transition={{ duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border bg-bg/50 border-border">
          <Icon className="w-3.5 h-3.5 text-ink2" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink2">{rec.category}</span>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: priority.bg, color: priority.color }}
        >
          {rec.priority}
        </span>
      </div>
      <h4 className="font-display text-base font-semibold leading-snug" style={{ color: '#161B2E', fontSize: 16 }}>{rec.title}</h4>
      <p className="text-[13px] leading-relaxed mt-2" style={{ color: '#3D4556', fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif' }}>{rec.description}</p>
    </motion.div>
  )
}
