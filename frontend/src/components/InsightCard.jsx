import React from 'react'
import { Salad, Dumbbell, Brain, Moon, AlertCircle } from 'lucide-react'

const CATEGORY = {
  DIET: { icon: Salad, color: 'text-sage', bg: 'bg-sage/10 border-sage/20' },
  FITNESS: { icon: Dumbbell, color: 'text-terracotta', bg: 'bg-terracotta/10 border-terracotta/20' },
  STRESS: { icon: Brain, color: 'text-rose', bg: 'bg-rose/10 border-rose/20' },
  SLEEP: { icon: Moon, color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
}

export default function InsightCard({ rec, idx }) {
  const meta = CATEGORY[rec.category] || CATEGORY.STRESS
  const Icon = meta.icon
  return (
    <div data-testid={`insight-card-${idx}`} className="glass rounded-3xl p-5 relative overflow-hidden fade-up hover:-translate-y-0.5 transition" style={{ animationDelay: `${idx * 80}ms` }}>
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${meta.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        <span className={`text-[10px] uppercase tracking-[0.22em] ${meta.color}`}>{rec.category}</span>
      </div>
      <h4 className="font-display text-lg mt-3 leading-snug">{rec.title}</h4>
      <p className="text-sm text-muted mt-2 leading-relaxed">{rec.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Priority</span>
        <span className={`text-[10px] uppercase tracking-[0.22em] flex items-center gap-1 ${rec.priority === 'HIGH' ? 'text-rose' : rec.priority === 'MEDIUM' ? 'text-gold' : 'text-sage'}`}>
          {rec.priority === 'HIGH' && <AlertCircle className="w-3 h-3" />} {rec.priority}
        </span>
      </div>
    </div>
  )
}
