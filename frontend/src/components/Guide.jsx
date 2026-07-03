import React from 'react'
import { Salad, Mic, Watch, MessageCircle, ArrowRight, Sparkles } from 'lucide-react'

export default function Guide({ onChangeTab }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="guide-view">
      <div className="glass rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-terracotta/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-terracotta/30 bg-terracotta/10 text-[10px] uppercase tracking-[0.25em] text-terracotta"><Sparkles className="w-3 h-3" /> Enterprise wellness OS</div>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">A private, always-on health analyst.</h1>
          <p className="mt-3 text-muted text-lg leading-relaxed max-w-2xl">HealthGuardAI listens, sees, and reasons across your voice, meals, sleep, and motion — surfacing early signals long before a wearable can.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Salad, key: 'NUTRITION', title: 'Nutrition Vision', body: 'Snap any meal. Gemini identifies ingredients and estimates calories, macros, and health score.', color: 'text-sage', bg: 'bg-sage/10 border-sage/20' },
          { icon: Mic, key: 'JOURNAL', title: 'Voice Journal', body: 'Speak or type. Tone-of-voice analysis surfaces stress that words alone cannot.', color: 'text-rose', bg: 'bg-rose/10 border-rose/20' },
          { icon: Watch, key: 'ACTIVITY', title: 'Devices & Vitals', body: 'Sync Fitbit / Apple Watch / Google Fit. Stream Bluetooth heart rate in real time.', color: 'text-terracotta', bg: 'bg-terracotta/10 border-terracotta/20' },
          { icon: MessageCircle, key: 'CHAT', title: 'AI Companion', body: 'A private companion that remembers your history and adjusts advice to your context.', color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
        ].map(c => (
          <div key={c.key} className="glass rounded-3xl p-6 hover:-translate-y-0.5 transition" data-testid={`guide-card-${c.key}`}>
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${c.bg}`}><c.icon className={`w-5 h-5 ${c.color}`} /></div>
            <h4 className="mt-4 font-display text-xl">{c.title}</h4>
            <p className="text-sm text-muted mt-2">{c.body}</p>
            <button onClick={() => onChangeTab(c.key)} className="mt-4 inline-flex items-center gap-1 text-sm text-terracotta hover:underline" data-testid={`guide-open-${c.key}`}>
              Open {c.title} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-8">
        <h3 className="font-display text-2xl">A day in the system</h3>
        <div className="mt-6 border-l border-white/10 ml-3 space-y-6">
          {[
            ['08:00', 'Sleep synced from your wearable. A readiness score frames the day.'],
            ['13:00', 'Photograph lunch. Macros logged. Stress-eating risk quietly monitored.'],
            ['18:30', 'A 60-second voice note. Tone reveals a spike; a breathing prompt appears.'],
            ['22:00', 'Nightly check-in. Insights recomputed. Streak preserved.'],
          ].map(([t, b], i) => (
            <div key={i} className="relative pl-6" data-testid={`guide-timeline-${i}`}>
              <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-terracotta" />
              <div className="font-mono text-xs text-terracotta">{t}</div>
              <p className="text-sm text-ink mt-1">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
