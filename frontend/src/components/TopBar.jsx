import React from 'react'
import { Loader2, FileDown, CreditCard } from 'lucide-react'
import { API_BASE } from '../lib/api.js'

const titles = {
  DASHBOARD: 'Wellness Overview', NUTRITION: 'Nutrition Intelligence',
  JOURNAL: 'Voice Journal', ACTIVITY: 'Activity & Devices', CHAT: 'AI Companion',
  EXPORT: 'Data Export', BILLING: 'Billing & Subscription',
  GUIDE: 'Guide', ADMIN: 'Admin Console',
}
const subtitles = {
  DASHBOARD: 'Live signals across sleep, mood, nutrition and motion.',
  NUTRITION: 'Photograph any meal — AI unpacks macros, health-score, and context.',
  JOURNAL: 'Speak or write. Tone-of-voice AI decodes stress and sentiment.',
  ACTIVITY: 'Sync Fitbit, Oura, Whoop, Garmin, Apple Watch, and Google Fit.',
  CHAT: 'Ask anything. HealthGuard remembers your recent context.',
  EXPORT: 'Download your data as JSON, CSV, or a formatted PDF.',
  BILLING: 'Manage your subscription and payment method.',
  GUIDE: 'A tour of every capability.', ADMIN: 'Platform-wide signals.',
}

export default function TopBar({ tab, user, loading, streak, score, billing, onOpenBilling }) {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  const downloadPDF = async () => {
    const token = localStorage.getItem('hg_token')
    try {
      const res = await fetch(`${API_BASE}/api/export/all.pdf`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('failed')
      const blob = await res.blob()
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = `healthguard-report-${new Date().toISOString().slice(0,10)}.pdf`; a.click()
    } catch { alert('Could not generate PDF yet.') }
  }
  return (
    <header className="sticky top-0 z-10 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="px-5 md:px-10 py-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-display-title text-3xl md:text-4xl" data-testid="topbar-title">{titles[tab] || 'HealthGuardAI'}</h1>
            {loading && <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-teal"><Loader2 className="w-3 h-3 animate-spin" /> Syncing</span>}
          </div>
          <p className="text-sm text-ink2 mt-1 hidden md:block">{subtitles[tab] || ''}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {billing?.in_trial && (
            <button onClick={onOpenBilling} data-testid="topbar-trial-pill" className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber/15 border border-amber/40 text-ink hover:bg-amber/25 transition">
              <span className="text-[10px] uppercase tracking-[0.22em] text-copper">Trial</span>
              <span className="font-mono text-xs tabular">{billing.trial_days_left} days left</span>
            </button>
          )}
          {billing?.is_paid && (
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-moss/10 border border-moss/30 text-ink">
              <CreditCard className="w-3.5 h-3.5 text-moss" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-moss">Pro</span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-border">
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted">Score</span>
            <span className="font-mono text-sm text-ink tabular" data-testid="topbar-score">{Math.round(score || 0)}</span>
            <span className="text-[10px] text-muted">/100</span>
          </div>
          <button data-testid="topbar-download-report" onClick={downloadPDF} className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border text-xs text-ink hover:bg-white transition">
            <FileDown className="w-4 h-4" /> Report PDF
          </button>
          <div className="w-10 h-10 rounded-full grid place-items-center bg-teal text-white font-semibold" data-testid="topbar-user-avatar">{initial}</div>
        </div>
      </div>
    </header>
  )
}
