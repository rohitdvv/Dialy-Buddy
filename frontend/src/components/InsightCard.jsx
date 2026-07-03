import React from 'react'
import { Salad, Dumbbell, Brain, Moon, AlertCircle } from 'lucide-react'

const CAT = {
  DIET: { icon: Salad, color: 'text-moss', bg: 'bg-moss/10 border-moss/25' },
  FITNESS: { icon: Dumbbell, color: 'text-teal', bg: 'bg-teal/10 border-teal/25' },
  STRESS: { icon: Brain, color: 'text-rust', bg: 'bg-rust/10 border-rust/25' },
  SLEEP: { icon: Moon, color: 'text-copper', bg: 'bg-copper/10 border-copper/25' },
}

export default function InsightCard({ rec, idx }) {
  const meta = CAT[rec.category] || CAT.STRESS
  const Icon = meta.icon
  return (
    <div data-testid={`insight-card-${idx}`} className="card p-5 relative overflow-hidden fade-up hover:-translate-y-0.5 transition" style={{ animationDelay: `${idx * 90}ms` }}>
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border ${meta.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        <span className={`text-[10px] uppercase tracking-[0.22em] ${meta.color}`}>{rec.category}</span>
      </div>
      <h4 className="font-display text-lg mt-3 leading-snug">{rec.title}</h4>
      <p className="text-sm text-ink2 mt-2 leading-relaxed">{rec.description}</p>
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Priority</span>
        <span className={`text-[10px] uppercase tracking-[0.22em] flex items-center gap-1 ${rec.priority === 'HIGH' ? 'text-rust' : rec.priority === 'MEDIUM' ? 'text-copper' : 'text-moss'}`}>
          {rec.priority === 'HIGH' && <AlertCircle className="w-3 h-3" />} {rec.priority}
        </span>
      </div>
    </div>
  )
}
