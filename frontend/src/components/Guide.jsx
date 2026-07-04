import React from 'react'
import { Watch, Salad, Mic, MessageCircle, BarChart3, ArrowRight, Check } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  { icon: Watch, key: 'ACTIVITY', title: 'Connect a wearable', body: 'Sync your Fitbit, Apple Watch, or Garmin to start tracking sleep, heart rate, and activity.', page: 'Devices' },
  { icon: Salad, key: 'NUTRITION', title: 'Log your first meal', body: 'Snap a photo or search manually. AI estimates calories, macros, and a health score.', page: 'Nutrition' },
  { icon: Mic, key: 'JOURNAL', title: 'Record a voice check-in', body: 'Speak or type how you feel. Tone analysis reveals stress patterns you might miss.', page: 'Journal' },
  { icon: MessageCircle, key: 'CHAT', title: 'Ask the AI companion', body: 'Get personalized advice on diet, sleep, and stress based on your complete history.', page: 'Chat' },
  { icon: BarChart3, key: 'DASHBOARD', title: 'Review your insights', body: 'See trends, streaks, and early warnings across all your health signals.', page: 'Dashboard' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const itemUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }

export default function Guide({ onChangeTab }) {
  const completedSteps = 0 // could be derived from props later

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="guide-view">
      <div className="card p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#0B4F5C]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#B87333]/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0B4F5C]/30 bg-[#0B4F5C]/8 text-[10px] uppercase tracking-[0.25em] text-[#0B4F5C]">
            <Check className="w-3 h-3" /> Onboarding guide
          </div>
          <h1 className="mt-4 font-display font-display-title text-4xl md:text-5xl leading-[1.05] text-[#161B2E]">Welcome to HealthGuard</h1>
          <p className="mt-4 text-[#3D4556] text-lg leading-relaxed max-w-2xl">Complete these 5 steps to unlock your full health picture.</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">Progress</span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5] font-mono tabular-nums">{completedSteps}/{steps.length}</span>
        </div>
        <div className="h-2 rounded-full bg-[#EFEAE0] overflow-hidden">
          <motion.div className="h-full rounded-full bg-[#0B4F5C]"
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps / steps.length) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <motion.div className="grid grid-cols-1 gap-4" variants={container} initial="hidden" animate="show">
        {steps.map((step, index) => (
          <motion.div key={step.key} variants={itemUp} className="card p-6 flex flex-col md:flex-row md:items-center gap-5 relative" data-testid={`guide-card-${step.key}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0B4F5C] text-white grid place-items-center font-mono text-sm shrink-0">
                {index + 1}
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#0B4F5C]/10 border border-[#0B4F5C]/20 grid place-items-center shrink-0">
                <step.icon className="w-5 h-5 text-[#0B4F5C]" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-display text-xl text-[#161B2E]">{step.title}</h4>
              <p className="text-sm text-[#3D4556] mt-1 leading-relaxed">{step.body}</p>
            </div>
            <button onClick={() => onChangeTab(step.key)} className="btn-ghost inline-flex items-center gap-1.5 text-sm shrink-0 text-[#0B4F5C] border-[#0B4F5C]/30 hover:bg-[#0B4F5C]/5" data-testid={`guide-open-${step.key}`}>
              Go to {step.page} <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </motion.div>

      <div className="card p-8">
        <h3 className="font-display text-2xl text-[#161B2E]">A day in the system</h3>
        <div className="mt-6 border-l-2 border-[#0B4F5C]/20 ml-3 space-y-6">
          {[
            ['08:00', 'Sleep automatically synced from your wearable. A readiness score frames the day.'],
            ['13:00', 'Photograph lunch. Macros logged. Stress-eating risk quietly monitored.'],
            ['18:30', 'A 60-second voice note. Tone reveals a spike; a breathing prompt appears.'],
            ['22:00', 'Nightly check-in. Insights recomputed. Streak preserved.'],
          ].map(([t, b], i) => (
            <div key={i} className="relative pl-6" data-testid={`guide-timeline-${i}`}>
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0B4F5C] border-4 border-white shadow-sm" />
              <div className="font-mono text-xs text-[#0B4F5C] tabular-nums">{t}</div>
              <p className="text-sm text-[#161B2E] mt-1">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
