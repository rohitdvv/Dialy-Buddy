import React, { useMemo, useEffect, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, LineChart, Line } from 'recharts'
import { api } from '../lib/api.js'
import BiometricRing from './BiometricRing.jsx'
import InsightCard from './InsightCard.jsx'
import { Flame, Trophy, Award, Utensils, Moon, HeartPulse, Sparkles } from 'lucide-react'

export default function Dashboard({ insights, activity, nutrition, journal, streak, onChangeTab, loadingInsights }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    api.get('/activity/history?days=7').then(({ data }) => setHistory(data)).catch(() => setHistory([]))
  }, [activity])

  // Build 7-day trend (fill missing days)
  const trend = useMemo(() => {
    const days = 7
    const map = {}
    history.forEach(h => { map[h.date] = h })
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0,10)
      const rec = map[iso] || {}
      // stress: derive from journal entries on that date
      const dayJournals = journal.filter(j => j.timestamp && j.timestamp.slice(0,10) === iso)
      const avgStress = dayJournals.length ? Math.round(dayJournals.reduce((s,j)=>s+(j.stressLevel||0),0)/dayJournals.length) : (i === 0 && journal[0] ? journal[0].stressLevel : null)
      // calories from nutrition
      const dayCal = nutrition.filter(n => n.timestamp && n.timestamp.slice(0,10) === iso).reduce((s,n)=>s+(n.calories||0),0)
      out.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        date: iso,
        steps: rec.steps || (i === 0 ? activity?.steps || 0 : 0),
        sleep: rec.sleepHours || (i === 0 ? activity?.sleepHours || 0 : 0),
        stress: avgStress ?? 0,
        calories: Math.round(dayCal),
      })
    }
    return out
  }, [history, activity, journal, nutrition])

  const todayCalories = useMemo(() => {
    const today = new Date().toISOString().slice(0,10)
    return nutrition.filter(n => n.timestamp && n.timestamp.slice(0,10) === today).reduce((s,n)=>s+(n.calories||0), 0)
  }, [nutrition])

  const latestStress = journal[0]?.stressLevel ?? null
  const badges = streak?.badges || []
  const earnedBadges = badges.filter(b => b.earned)

  return (
    <div className="space-y-8" data-testid="dashboard-view">
      {/* Hero: Wellness Score + KPIs */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biometric Ring */}
        <div className="lg:col-span-5 glass rounded-3xl p-6 md:p-8 relative overflow-hidden grain" data-testid="dashboard-score-card">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Wellness Score</div>
              <div className="font-display text-3xl md:text-4xl tracking-tight mt-1">Biometric Signal</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Live</div>
          </div>
          <div className="grid grid-cols-2 gap-6 items-center mt-4">
            <BiometricRing score={insights.wellnessScore} />
            <div className="space-y-3 text-sm">
              <MiniStat label="Sleep" value={`${activity?.sleepHours ?? '—'} h`} icon={<Moon className="w-3.5 h-3.5" />} />
              <MiniStat label="Stress" value={latestStress != null ? `${latestStress}/10` : '—'} icon={<HeartPulse className="w-3.5 h-3.5" />} tone={latestStress > 6 ? 'rose' : 'sage'} />
              <MiniStat label="Steps" value={activity?.steps ?? '—'} icon={<Flame className="w-3.5 h-3.5" />} />
              <MiniStat label="Calories" value={`${todayCalories} kcal`} icon={<Utensils className="w-3.5 h-3.5" />} />
            </div>
          </div>
        </div>

        {/* Streak + Badges */}
        <div className="lg:col-span-4 glass rounded-3xl p-6 md:p-8" data-testid="dashboard-streak-card">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Daily Streak</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-5xl md:text-6xl leading-none">{streak?.streak ?? 0}</span>
                <span className="text-muted text-sm">days</span>
              </div>
              <p className="text-xs text-muted mt-2">Consistency compounds. Log any activity today to keep the flame.</p>
            </div>
            <div className="w-14 h-14 rounded-full border border-terracotta/40 bg-terracotta/10 grid place-items-center">
              <Flame className="w-6 h-6 text-terracotta" />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted mb-3">Badges</div>
            <div className="grid grid-cols-2 gap-2">
              {badges.map(b => (
                <div key={b.id} data-testid={`badge-${b.id}`} className={`px-3 py-2 rounded-xl border ${b.earned ? 'border-gold/40 bg-gold/5' : 'border-white/5 bg-white/2 opacity-40'} flex items-center gap-2`}>
                  <Trophy className={`w-4 h-4 ${b.earned ? 'text-gold' : 'text-muted'}`} />
                  <div className="min-w-0">
                    <div className="text-xs truncate">{b.name}</div>
                    <div className="text-[10px] text-muted truncate">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-3">
          <QuickAction icon={<Utensils className="w-4 h-4" />} label="Log meal" testId="quick-log-meal" onClick={() => onChangeTab('NUTRITION')} />
          <QuickAction icon={<HeartPulse className="w-4 h-4" />} label="Voice check-in" testId="quick-voice-check" onClick={() => onChangeTab('JOURNAL')} />
          <QuickAction icon={<Sparkles className="w-4 h-4" />} label="Ask companion" testId="quick-ask-ai" onClick={() => onChangeTab('CHAT')} />
          <QuickAction icon={<Award className="w-4 h-4" />} label="Devices" testId="quick-devices" onClick={() => onChangeTab('ACTIVITY')} />
        </div>
      </section>

      {/* Trend charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6" data-testid="dashboard-trend-activity">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">Steps & Sleep — 7d</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Motion / Recovery</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#0d0d0d', border: '1px solid #262626', borderRadius: 8, color: '#F2EFE9', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="steps" fill="#D86B45" radius={[6,6,0,0]} barSize={16} />
                <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#E2C07C" strokeWidth={2.5} dot={{ r: 3, fill: '#E2C07C' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6" data-testid="dashboard-trend-stress">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">Stress Pattern — 7d</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Emotional load</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B96D71" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#B96D71" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#0d0d0d', border: '1px solid #262626', borderRadius: 8, color: '#F2EFE9', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
                <Area type="monotone" dataKey="stress" stroke="#B96D71" strokeWidth={2.5} fill="url(#stressGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* AI Insights */}
      <section data-testid="dashboard-insights">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">HealthGuard Insights</h3>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Powered by Gemini 2.5</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {loadingInsights && (insights.recommendations || []).length === 0 && (
            Array.from({length:4}).map((_,i) => (
              <div key={i} className="glass rounded-3xl p-5 h-40 relative overflow-hidden">
                <div className="w-24 h-5 rounded-full shimmer" />
                <div className="mt-4 w-40 h-4 rounded shimmer" />
                <div className="mt-2 w-56 h-3 rounded shimmer" />
                <div className="mt-2 w-48 h-3 rounded shimmer" />
                <div className="mt-6 w-20 h-3 rounded shimmer" />
              </div>
            ))
          )}
          {(insights.recommendations || []).map((r, i) => (
            <InsightCard key={i} rec={r} idx={i} />
          ))}
        </div>
      </section>
    </div>
  )
}

function MiniStat({ label, value, icon, tone }) {
  const toneCls = tone === 'rose' ? 'text-rose' : tone === 'sage' ? 'text-sage' : 'text-ink'
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-2 text-muted text-[11px] uppercase tracking-[0.18em]">
        <span className="text-terracotta">{icon}</span> {label}
      </div>
      <div className={`font-mono text-sm ${toneCls}`}>{value}</div>
    </div>
  )
}

function QuickAction({ icon, label, onClick, testId }) {
  return (
    <button data-testid={testId} onClick={onClick} className="glass rounded-2xl px-4 py-4 flex items-center gap-3 hover:-translate-y-0.5 transition text-sm">
      <span className="w-8 h-8 rounded-lg bg-terracotta/10 border border-terracotta/20 grid place-items-center text-terracotta">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
