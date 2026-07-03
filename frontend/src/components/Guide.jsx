import React from 'react'
import { Salad, Mic, Watch, MessageCircle, Sparkles, ArrowRight, Download, CreditCard } from 'lucide-react'

export default function Guide({ onChangeTab }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="guide-view">
      <div className="card p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-teal/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-copper/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal/30 bg-teal/8 text-[10px] uppercase tracking-[0.25em] text-teal"><Sparkles className="w-3 h-3" /> Enterprise wellness OS</div>
          <h1 className="mt-4 font-display font-display-title text-5xl leading-[1.05]">A private, always-on health analyst.</h1>
          <p className="mt-4 text-ink2 text-lg leading-relaxed max-w-2xl">HealthGuardAI listens, sees, and reasons across your voice, meals, sleep, and motion — surfacing early signals long before a wearable can.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Salad, key: 'NUTRITION', title: 'Nutrition Vision', body: 'Snap any meal. Gemini identifies ingredients, calories, macros, and a health score.', tone: 'moss' },
          { icon: Mic, key: 'JOURNAL', title: 'Voice Journal', body: 'Speak or type. Tone-of-voice analysis surfaces stress that words alone cannot.', tone: 'rust' },
          { icon: Watch, key: 'ACTIVITY', title: 'Devices & Vitals', body: 'Real cloud sync: Fitbit, Apple Watch, Garmin, Oura, Whoop, Google Fit. Live BLE HR.', tone: 'teal' },
          { icon: MessageCircle, key: 'CHAT', title: 'AI Companion', body: 'A private companion that remembers your history and adjusts advice to your context.', tone: 'copper' },
          { icon: Download, key: 'EXPORT', title: 'Full Data Export', body: 'Download JSON, CSV, or a formatted PDF anytime. Your data — yours.', tone: 'teal' },
          { icon: CreditCard, key: 'BILLING', title: 'Subscription', body: '30-day free trial · then $10/month. Reading data always works — cancel anytime.', tone: 'copper' },
        ].map(c => (
          <div key={c.key} className="card p-6 hover:-translate-y-0.5 transition" data-testid={`guide-card-${c.key}`}>
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border bg-${c.tone}/10 border-${c.tone}/20`}><c.icon className={`w-5 h-5 text-${c.tone}`} /></div>
            <h4 className="mt-4 font-display text-xl">{c.title}</h4>
            <p className="text-sm text-ink2 mt-2 leading-relaxed">{c.body}</p>
            <button onClick={() => onChangeTab(c.key)} className="mt-4 inline-flex items-center gap-1 text-sm text-teal hover:underline" data-testid={`guide-open-${c.key}`}>
              Open {c.title} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-8">
        <h3 className="font-display text-2xl">A day in the system</h3>
        <div className="mt-6 border-l-2 border-teal/20 ml-3 space-y-6">
          {[
            ['08:00', 'Sleep automatically synced from your wearable. A readiness score frames the day.'],
            ['13:00', 'Photograph lunch. Macros logged. Stress-eating risk quietly monitored.'],
            ['18:30', 'A 60-second voice note. Tone reveals a spike; a breathing prompt appears.'],
            ['22:00', 'Nightly check-in. Insights recomputed. Streak preserved.'],
          ].map(([t, b], i) => (
            <div key={i} className="relative pl-6" data-testid={`guide-timeline-${i}`}>
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal border-4 border-white shadow-soft" />
              <div className="font-mono text-xs text-teal tabular">{t}</div>
              <p className="text-sm text-ink mt-1">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
