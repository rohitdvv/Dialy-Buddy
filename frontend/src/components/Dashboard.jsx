import React, { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Line, ComposedChart } from 'recharts'
import { api } from '../lib/api.js'
import WellnessRing from './WellnessRing.jsx'
import InsightCard from './InsightCard.jsx'
import { Flame, Trophy, Utensils, Moon, HeartPulse, Footprints, Sparkles, ArrowRight } from 'lucide-react'

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

  const latestStress = journal[0]?.stressLevel ?? null
  const badges = streak?.badges || []
  const activeDevices = devices?.filter(d => d.status === 'CONNECTED') || []

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* Hero — Wellness Score + KPI + Streak */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 card p-7 fade-up" data-testid="dashboard-score-card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Wellness Score</div>
              <div className="font-display font-display-title text-3xl md:text-4xl mt-1">Biometric Signal</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-teal flex items-center gap-1"><Sparkles className="w-3 h-3" /> Live</div>
          </div>
          <div className="grid grid-cols-2 gap-6 items-center mt-3">
            <WellnessRing score={insights.wellnessScore} />
            <div className="space-y-2.5 text-sm">
              <MiniStat label="Sleep" value={activity?.sleepHours ? `${activity.sleepHours} h` : '—'} icon={<Moon className="w-3.5 h-3.5" />} />
              <MiniStat label="Steps" value={activity?.steps ? activity.steps.toLocaleString() : '—'} icon={<Footprints className="w-3.5 h-3.5" />} />
              <MiniStat label="Heart" value={activity?.heartRateAvg ? `${activity.heartRateAvg} bpm` : '—'} icon={<HeartPulse className="w-3.5 h-3.5" />} tone={activity?.heartRateAvg > 90 ? 'rust' : 'moss'} />
              <MiniStat label="Meals" value={`${Math.round(todayCalories)} kcal`} icon={<Utensils className="w-3.5 h-3.5" />} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 card p-7 fade-up" style={{animationDelay:'80ms'}} data-testid="dashboard-streak-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Daily Streak</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display font-display-title text-6xl leading-none tabular">{streak?.streak ?? 0}</span>
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
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3 fade-up" style={{animationDelay:'140ms'}}>
          <QuickAction icon={<Utensils className="w-4 h-4" />} label="Log meal" testId="quick-log-meal" onClick={() => onChangeTab('NUTRITION')} />
          <QuickAction icon={<HeartPulse className="w-4 h-4" />} label="Voice check-in" testId="quick-voice-check" onClick={() => onChangeTab('JOURNAL')} />
          <QuickAction icon={<Sparkles className="w-4 h-4" />} label="Ask companion" testId="quick-ask-ai" onClick={() => onChangeTab('CHAT')} />
          <QuickAction icon={<Footprints className="w-4 h-4" />} label={activeDevices.length ? `${activeDevices.length} device${activeDevices.length===1?'':'s'} live` : 'Connect devices'} testId="quick-devices" onClick={() => onChangeTab('ACTIVITY')} highlight={activeDevices.length > 0} />
        </div>
      </section>

      {/* Trend charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6 fade-up" style={{animationDelay:'180ms'}} data-testid="dashboard-trend-activity">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl">Movement & Recovery</h3>
              <p className="text-xs text-muted">Last 7 days · steps vs sleep</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Bars · Line</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{top:10, right:10, left:0, bottom:0}}>
                <defs>
                  <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0E5F5C" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#146356" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7A8583', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#7A8583', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#7A8583', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4DED4', borderRadius: 12, color: '#1B2321', fontFamily: 'JetBrains Mono', fontSize: 12, boxShadow: '0 12px 40px -18px rgba(14,95,92,0.35)' }} />
                <Bar yAxisId="left" dataKey="steps" fill="url(#stepsGrad)" radius={[6,6,0,0]} barSize={18} />
                <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#B96A3A" strokeWidth={2.5} dot={{ r: 4, fill: '#B96A3A', stroke: '#FFFFFF', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 fade-up" style={{animationDelay:'220ms'}} data-testid="dashboard-trend-stress">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl">Emotional Load</h3>
              <p className="text-xs text-muted">Last 7 days · daily average stress</p>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Area</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{top:10, right:10, left:0, bottom:0}}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A94A3A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#A94A3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7A8583', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#7A8583', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4DED4', borderRadius: 12, color: '#1B2321', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                <Area type="monotone" dataKey="stress" stroke="#A94A3A" strokeWidth={2.5} fill="url(#stressGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section data-testid="dashboard-insights">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-2xl">HealthGuard Insights</h3>
            <p className="text-xs text-muted">Powered by Gemini 2.5 · Analysed against your recent history</p>
          </div>
          <button onClick={() => onChangeTab('CHAT')} className="text-xs text-teal hover:underline flex items-center gap-1">Ask a follow-up <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {loadingInsights && (insights.recommendations || []).length === 0 && (
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
          {(insights.recommendations || []).map((r, i) => <InsightCard key={i} rec={r} idx={i} />)}
        </div>
      </section>
    </div>
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
    <button data-testid={testId} onClick={onClick} className={`card px-4 py-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-card transition text-sm text-left ${highlight ? 'border-moss/30' : ''}`}>
      <span className={`w-9 h-9 rounded-xl grid place-items-center ${highlight ? 'bg-moss/15 text-moss border border-moss/30' : 'bg-teal/10 text-teal border border-teal/20'}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      <ArrowRight className="w-4 h-4 text-muted" />
    </button>
  )
}
