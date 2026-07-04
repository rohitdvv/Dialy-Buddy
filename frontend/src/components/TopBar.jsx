import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, FileDown, CreditCard, ChevronDown, Settings, LogOut } from 'lucide-react'
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

export default function TopBar({ tab, user, loading, streak, score, billing, onOpenBilling, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  useEffect(() => {
    const handleClick = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
    <header className="sticky top-0 z-10 bg-transparent border-b border-[#DDD8CF]">
      <div className="px-5 md:px-10 py-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl tracking-tight" data-testid="topbar-title">{titles[tab] || 'HealthGuardAI'}</h1>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-teal">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing
              </span>
            )}
          </div>
          <p className="text-sm text-ink2 mt-1 hidden md:block" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>{subtitles[tab] || ''}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Score display */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-[#DDD8CF]">
            {loading ? (
              <div className="w-16 h-4 shimmer" />
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Score</span>
                <span className="font-mono text-sm text-ink tabular" data-testid="topbar-score">{Math.round(score || 0)}</span>
                <span className="text-[10px] text-muted">/100</span>
              </>
            )}
          </div>

          {/* Trial badge */}
          {billing?.in_trial && (
            <button onClick={onOpenBilling} data-testid="topbar-trial-pill" className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-amber/15 border border-amber/40 text-ink hover:bg-amber/25 transition">
              <span className="text-[10px] uppercase tracking-[0.22em] text-copper" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Trial</span>
              <span className="font-mono text-xs tabular">{billing.trial_days_left} days</span>
            </button>
          )}
          {billing?.is_paid && (
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-moss/10 border border-moss/30 text-ink">
              <CreditCard className="w-3.5 h-3.5 text-moss" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-moss" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Pro</span>
            </div>
          )}
          {!billing?.active && billing && !billing.in_trial && (
            <button onClick={onOpenBilling} className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full bg-rust/10 border border-rust/30 text-ink hover:bg-rust/20 transition">
              <span className="text-[10px] uppercase tracking-[0.22em] text-rust" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Expired</span>
            </button>
          )}

          <button data-testid="topbar-download-report" onClick={downloadPDF} className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#DDD8CF] text-xs text-ink hover:bg-white transition">
            <FileDown className="w-4 h-4" /> Report PDF
          </button>

          {/* Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(v => !v)} className="w-10 h-10 rounded-full grid place-items-center bg-teal text-white font-semibold hover:ring-2 hover:ring-teal/30 transition">
              {initial}
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-[#DDD8CF] rounded-2xl shadow-[0_1px_2px_rgba(27,35,33,0.04),0_12px_40px_-18px_rgba(14,95,92,0.18)] overflow-hidden z-50"
                >
                  <button onClick={() => { setDropdownOpen(false) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink2 hover:bg-[#F9F7F2] transition">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={() => { setDropdownOpen(false); onOpenBilling() }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink2 hover:bg-[#F9F7F2] transition">
                    <CreditCard className="w-4 h-4" /> Billing
                  </button>
                  <div className="border-t border-[#DDD8CF]" />
                  <button onClick={() => { setDropdownOpen(false); onLogout() }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rust hover:bg-rust/10 transition">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
