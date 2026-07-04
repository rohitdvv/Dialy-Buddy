import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Line, ComposedChart } from 'recharts'
import { api } from '../lib/api.js'
import WellnessRing from './WellnessRing.jsx'
import InsightCard from './InsightCard.jsx'
import { Flame, Trophy, Utensils, Moon, HeartPulse, Footprints, Sparkles, ArrowRight, Activity, Timer, Zap, MapPin } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
}

export default function Dashboard({ insights, activity, nutrition, journal, streak, onChangeTab, loadingInsights, devices }) {
  const [history, setHistory] = useState([])

  useEffect(() => { api.get('/activity/history?days=14').then(({ data }) => setHistory(data)).catch(() => setHistory([])) }, [activity])

  const trend = useMemo(() => {
    const days = 7
    const map = {}; history.forEach(h => { map[h.date] = h })
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0,10)
      const rec = map[iso] || {}
      const dayJournals = journal.filter(j => j.timestamp && j.timestamp.slice(0,10) === iso)
      const avgStress = dayJournals.length ? Math.round(dayJournals.reduce((s,j)=>s+(j.stressLevel||0),0)/dayJournals.length) : null
      const dayCal = nutrition.filter(n => n.timestamp && n.timestamp.slice(0,10) === iso).reduce((s,n)=>s+(n.calories||0),0)
      out.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        date: iso,
        steps: rec.steps || 0,
        sleep: rec.sleepHours || 0,
        stress: avgStress ?? 0,
        calories: Math.round(dayCal),
        hr: rec.heartRateAvg || 0,
      })
    }
    return out
  }, [history, journal, nutrition])

  const todayCalories = useMemo(() => {
    const today = new Date().toISOString().slice(0,10)
    return nutrition.filter(n => n.timestamp && n.timestamp.slice(0,10) === today).reduce((s,n)=>s+(n.calories||0), 0)
  }, [nutrition])

  const badges = streak?.badges || []
  const activeDevices = devices?.filter(d => d.status === 'CONNECTED') || []

  const latestHistory = history[history.length - 1] || {}
  const restingHR = activity?.heartRateAvg || latestHistory?.heartRateAvg || null
  const hrv = activity?.hrv || (restingHR ? Math.round(72 - (restingHR - 60) * 0.4) : null)
  const activeMinutes = activity?.activeMinutes || (activity?.steps ? Math.round(activity.steps / 120) : null)
  const distanceKm = activity?.distanceKm || (activity?.steps ? Math.round(activity.steps / 1312 * 10) / 10 : null)

  const tooltipStyle = {
    background: '#FFFFFF',
    border: '1px solid #DDD8CF',
    borderRadius: 12,
    color: '#161B2E',
    fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
    fontSize: 12,
    boxShadow: '0 12px 40px -18px rgba(11,79,92,0.18)'
  }

  return (
    <motion.div className="space-y-6" data-testid="dashboard-view" initial="hidden" animate="visible">
      {/* Hero — Wellness Score + KPI + Streak */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-12 gap-5" variants={containerVariants}>
        <motion.div
          className="lg:col-span-5 card p-7"
          data-testid="dashboard-score-card"
          variants={cardVariants}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Wellness Score</div>
              <div className="font-display font-display-title text-3xl md:text-4xl mt-1" style={{ color: '#161B2E' }}>Biometric Signal</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-teal flex items-center gap-1"><Sparkles className="w-3 h-3" /> Live</div>
          </div>
          <div className="grid grid-cols-2 gap-6 items-center mt-3">
            <WellnessRing score={insights?.wellnessScore ?? 0} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MiniStat label="Sleep" value={activity?.sleepHours ? `${activity.sleepHours} h` : '—'} icon={<Moon className="w-3.5 h-3.5" />} />
              <MiniStat label="Steps" value={activity?.steps ? activity.steps.toLocaleString() : '—'} icon={<Footprints className="w-3.5 h-3.5" />} />
              <MiniStat label="Heart" value={activity?.heartRateAvg ? `${activity.heartRateAvg} bpm` : '—'} icon={<HeartPulse className="w-3.5 h-3.5" />} tone={activity?.heartRateAvg > 90 ? 'rust' : 'moss'} />
              <MiniStat label="Meals" value={`${Math.round(todayCalories)} kcal`} icon={<Utensils className="w-3.5 h-3.5" />} />
              <MiniStat label="HRV" value={hrv ? `${hrv} ms` : '—'} icon={<Activity className="w-3.5 h-3.5" />} />
              <MiniStat label="Resting HR" value={restingHR ? `${restingHR} bpm` : '—'} icon={<Timer className="w-3.5 h-3.5" />} />
              <MiniStat label="Active Min" value={activeMinutes ? `${activeMinutes} min` : '—'} icon={<Zap className="w-3.5 h-3.5" />} />
              <MiniStat label="Distance" value={distanceKm ? `${distanceKm} km` : '—'} icon={<MapPin className="w-3.5 h-3.5" />} />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="lg:col-span-4 card p-7"
          data-testid="dashboard-streak-card"
          variants={cardVariants}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Daily Streak</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display font-display-title text-6xl leading-none tabular" style={{ color: '#161B2E' }}>{streak?.streak ?? 0}</span>
                <span className="text-ink2 text-sm">days</span>
              </div>
              <p className="text-xs text-ink2 mt-2 max-w-[220px]">Consistency compounds. Log anything today to keep the flame alive.</p>
            </div>
            <div className="w-14 h-14 rounded-full border border-copper/30 bg-copper/10 grid place-items-center">
              <Flame className="w-6 h-6 text-copper" />
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-border">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3">Badges</div>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(b => (
                <div key={b.id} data-testid={`badge-${b.id}`} className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${b.earned ? 'border-amber/40 bg-amber/8' : 'border-border bg-white opacity-50'}`}>
                  <Trophy className={`w-4 h-4 ${b.earned ? 'text-amber' : 'text-muted'}`} />
                  <div className="min-w-0">
                    <div className="text-xs truncate text-ink">{b.name}</div>
                    <div className="text-[10px] text-muted truncate">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3" variants={cardVariants}>
          <QuickAction icon={<Utensils className="w-4 h-4" />} label="Log meal" testId="quick-log-meal" onClick={() => onChangeTab('NUTRITION')} />
          <QuickAction icon={<HeartPulse className="w-4 h-4" />} label="Voice check-in" testId="quick-voice-check" onClick={() => onChangeTab('JOURNAL')} />
          <QuickAction icon={<Sparkles className="w-4 h-4" />} label="Ask companion" testId="quick-ask-ai" onClick={() => onChangeTab('CHAT')} />
          <QuickAction icon={<Footprints className="w-4 h-4" />} label={activeDevices.length ? `${activeDevices.length} device${activeDevices.length===1?'':'s'} live` : 'Connect devices'} testId="quick-devices" onClick={() => onChangeTab('ACTIVITY')} highlight={activeDevices.length > 0} />
        </motion.div>
      </motion.div>

      {/* Trend charts */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-5" variants={containerVariants}>
        <motion.div
          className="card p-6"
          data-testid="dashboard-trend-activity"
          variants={cardVariants}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl" style={{ color: '#161B2E' }}>Movement & Recovery</h3>
              <p className="text-xs text-muted">Last 7 days · steps vs sleep</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Bars · Line</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{top:10, right:10, left:0, bottom:0}}>
                <defs>
                  <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B4F5C" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0B4F5C" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD8CF" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8B92A5', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#8B92A5', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#8B92A5', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar yAxisId="left" dataKey="steps" fill="url(#stepsGrad)" radius={[6,6,0,0]} barSize={18} />
                <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#B87333" strokeWidth={2.5} dot={{ r: 4, fill: '#B87333', stroke: '#FFFFFF', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="card p-6"
          data-testid="dashboard-trend-stress"
          variants={cardVariants}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl" style={{ color: '#161B2E' }}>Emotional Load</h3>
              <p className="text-xs text-muted">Last 7 days · daily average stress</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Area</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{top:10, right:10, left:0, bottom:0}}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B3D3D" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8B3D3D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDD8CF" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8B92A5', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#8B92A5', fontSize: 11, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="stress" stroke="#8B3D3D" strokeWidth={2.5} fill="url(#stressGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Insights */}
      <motion.div data-testid="dashboard-insights" variants={cardVariants}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-2xl" style={{ color: '#161B2E' }}>HealthGuard Insights</h3>
            <p className="text-xs text-muted">Powered by Gemini 2.5 · Analysed against your recent history</p>
          </div>
          <button onClick={() => onChangeTab('CHAT')} className="text-xs text-teal hover:underline flex items-center gap-1">Ask a follow-up <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" variants={containerVariants}>
          {loadingInsights && (insights?.recommendations || []).length === 0 && (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-5 h-44">
                <div className="w-24 h-5 shimmer rounded-full" />
                <div className="mt-4 w-40 h-4 shimmer" />
                <div className="mt-2 w-56 h-3 shimmer" />
                <div className="mt-2 w-48 h-3 shimmer" />
                <div className="mt-8 w-20 h-3 shimmer" />
              </div>
            ))
          )}
          {(insights?.recommendations || []).map((r, i) => <InsightCard key={i} rec={r} idx={i} variants={cardVariants} />)}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function MiniStat({ label, value, icon, tone }) {
  const c = tone === 'rust' ? 'text-rust' : tone === 'moss' ? 'text-moss' : 'text-ink'
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg border border-border">
      <div className="flex items-center gap-2 text-muted text-[11px] uppercase tracking-[0.18em]">
        <span className="text-teal">{icon}</span> {label}
      </div>
      <div className={`font-mono text-sm tabular ${c}`}>{value}</div>
    </div>
  )
}

function QuickAction({ icon, label, onClick, testId, highlight }) {
  return (
    <motion.button
      data-testid={testId}
      onClick={onClick}
      className={`card px-4 py-4 flex items-center gap-3 text-sm text-left ${highlight ? 'border-moss/30' : ''}`}
      whileHover={{ y: -2, boxShadow: '0 12px 40px -18px rgba(11,79,92,0.22)' }}
      transition={{ duration: 0.25, ease: [0.2, 0.9, 0.2, 1] }}
    >
      <span className={`w-9 h-9 rounded-xl grid place-items-center ${highlight ? 'bg-moss/15 text-moss border border-moss/30' : 'bg-teal/10 text-teal border border-teal/20'}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="w-4 h-4 text-muted" />
    </motion.button>
  )
}
