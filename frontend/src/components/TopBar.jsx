import React from 'react'
import { Loader2, Sparkles, FileDown } from 'lucide-react'
import { API_BASE } from '../lib/api.js'

const titles = {
  DASHBOARD: 'Wellness Overview',
  NUTRITION: 'Nutrition Intelligence',
  JOURNAL: 'Voice Journal',
  ACTIVITY: 'Activity & Devices',
  CHAT: 'AI Companion',
  GUIDE: 'Guide',
  ADMIN: 'Admin Console',
}

const subtitles = {
  DASHBOARD: 'Live signals across sleep, mood, nutrition and motion.',
  NUTRITION: 'Photograph any meal — AI unpacks macros, health-score and context.',
  JOURNAL: 'Speak or write. Tone-of-voice AI decodes stress and sentiment.',
  ACTIVITY: 'Sync wearables, stream heart-rate over Bluetooth, log manually.',
  CHAT: 'Ask anything. HealthGuard remembers your recent context.',
  GUIDE: 'A tour of every capability.',
  ADMIN: 'Aggregate signals across the platform.',
}

export default function TopBar({ tab, user, loading, streak, score }) {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  const downloadReport = async () => {
    const token = localStorage.getItem('hg_token')
    const url = `${API_BASE}/api/report/weekly.pdf`
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('failed')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `healthguard-weekly-${new Date().toISOString().slice(0,10)}.pdf`
      link.click()
    } catch { alert('Could not generate report yet.') }
  }
  return (
    <header className="sticky top-0 z-10 backdrop-blur-xl bg-bg/60 border-b border-white/5">
      <div className="px-6 md:px-10 py-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl tracking-tight" data-testid="topbar-title">{titles[tab] || 'HealthGuardAI'}</h1>
            {loading && <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold"><Loader2 className="w-3 h-3 animate-spin" />Syncing</span>}
          </div>
          <p className="text-sm text-muted mt-1 hidden md:block">{subtitles[tab] || ''}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Score</span>
            <span className="font-mono text-sm text-ink" data-testid="topbar-score">{Math.round(score || 0)}</span>
            <span className="text-[10px] text-muted">/100</span>
          </div>
          <button data-testid="topbar-download-report" onClick={downloadReport} className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 text-xs text-ink hover:bg-white/5">
            <FileDown className="w-4 h-4" /> Weekly PDF
          </button>
          <div className="w-10 h-10 rounded-full grid place-items-center bg-terracotta text-bg font-semibold" data-testid="topbar-user-avatar">
            {initial}
          </div>
        </div>
      </div>
    </header>
  )
}
