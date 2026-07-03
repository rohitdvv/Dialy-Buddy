import React, { useState } from 'react'
import { X, Moon } from 'lucide-react'

export default function NightlyCheckIn({ isOpen, onClose, onSubmit }) {
  const [stress, setStress] = useState(5)
  const [sleep, setSleep] = useState(7)
  const [calories, setCalories] = useState(2000)
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/40 backdrop-blur-sm" data-testid="checkin-modal">
      <div className="w-full max-w-lg card overflow-hidden fade-up p-0">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 grid place-items-center"><Moon className="w-5 h-5 text-teal" /></div>
            <div>
              <h3 className="font-display text-xl">Nightly Check-In</h3>
              <p className="text-xs text-ink2">Close the day — sync stress, sleep, burn.</p>
            </div>
          </div>
          <button data-testid="checkin-close" onClick={onClose} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted">Overall day stress</label>
              <span className={`text-xs font-mono tabular ${stress > 7 ? 'text-rust' : 'text-moss'}`} data-testid="checkin-stress-val">{stress}/10</span>
            </div>
            <input data-testid="checkin-stress-input" type="range" min={1} max={10} step={1} value={stress} onChange={e => setStress(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted uppercase tracking-[0.2em]"><span>Zen</span><span>Stressed</span></div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted">Sleep last night</label>
            <div className="flex items-center gap-6">
              <button data-testid="checkin-sleep-minus" onClick={() => setSleep(Math.max(0, sleep - 0.5))} className="w-10 h-10 rounded-full border border-border hover:bg-bg text-lg">−</button>
              <span className="font-mono text-4xl flex-1 text-center tabular" data-testid="checkin-sleep-val">{sleep}h</span>
              <button data-testid="checkin-sleep-plus" onClick={() => setSleep(Math.min(16, sleep + 0.5))} className="w-10 h-10 rounded-full border border-border hover:bg-bg text-lg">+</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted">Active calories burned</label>
            <input data-testid="checkin-calories-input" type="number" value={calories} onChange={e => setCalories(parseInt(e.target.value) || 0)} className="field font-mono tabular" />
          </div>
          <button data-testid="checkin-submit" onClick={() => onSubmit({ stressLevel: stress, sleepHours: sleep, caloriesBurned: calories })} className="btn-primary w-full">Save & Recompute Insights</button>
        </div>
      </div>
    </div>
  )
}
