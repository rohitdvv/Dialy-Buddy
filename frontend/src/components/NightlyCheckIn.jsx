import React, { useState } from 'react'
import { X, Moon } from 'lucide-react'

export default function NightlyCheckIn({ isOpen, onClose, onSubmit }) {
  const [stress, setStress] = useState(5)
  const [sleep, setSleep] = useState(7)
  const [calories, setCalories] = useState(2000)
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/80 backdrop-blur-sm" data-testid="checkin-modal">
      <div className="w-full max-w-lg glass rounded-3xl overflow-hidden fade-up">
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-terracotta/10 grid place-items-center"><Moon className="w-5 h-5 text-terracotta" /></div>
            <div>
              <h3 className="font-display text-xl">Nightly Check-In</h3>
              <p className="text-xs text-muted">Wrap the day — sync stress, sleep, and burn.</p>
            </div>
          </div>
          <button data-testid="checkin-close" onClick={onClose} className="text-muted hover:text-ink"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted">Overall day stress</label>
              <span className={`text-xs font-mono ${stress > 7 ? 'text-rose' : 'text-sage'}`} data-testid="checkin-stress-val">{stress}/10</span>
            </div>
            <input data-testid="checkin-stress-input" type="range" min={1} max={10} step={1} value={stress} onChange={e => setStress(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted uppercase tracking-[0.2em]"><span>Zen</span><span>Stressed</span></div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted">Sleep last night</label>
            <div className="flex items-center gap-6">
              <button data-testid="checkin-sleep-minus" onClick={() => setSleep(Math.max(0, sleep - 0.5))} className="w-10 h-10 rounded-full border border-white/10 hover:bg-white/5 text-lg">−</button>
              <span className="font-mono text-4xl flex-1 text-center" data-testid="checkin-sleep-val">{sleep}h</span>
              <button data-testid="checkin-sleep-plus" onClick={() => setSleep(Math.min(16, sleep + 0.5))} className="w-10 h-10 rounded-full border border-white/10 hover:bg-white/5 text-lg">+</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] uppercase tracking-[0.2em] text-muted">Active calories burned</label>
            <input data-testid="checkin-calories-input" type="number" value={calories} onChange={e => setCalories(parseInt(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono focus:outline-none focus:border-terracotta" />
          </div>
          <button data-testid="checkin-submit" onClick={() => onSubmit({ stressLevel: stress, sleepHours: sleep, caloriesBurned: calories })} className="w-full py-3 rounded-full bg-terracotta text-bg font-semibold hover:brightness-110">Save & Generate Insights</button>
        </div>
      </div>
    </div>
  )
}
