import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Apple, Mic, Activity, MessageCircle, HelpCircle, Shield, LogOut, Moon, Flame, CreditCard, Download, Menu, X, Smartphone } from 'lucide-react'

const primary = [
  { key: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard },
  { key: 'NUTRITION', label: 'Nutrition', icon: Apple },
  { key: 'JOURNAL', label: 'Voice Journal', icon: Mic },
  { key: 'ACTIVITY', label: 'Activity & Devices', icon: Activity },
  { key: 'CHAT', label: 'AI Companion', icon: MessageCircle },
]

const secondary = [
  { key: 'EXPORT', label: 'Export', icon: Download },
  { key: 'BILLING', label: 'Billing', icon: CreditCard },
  { key: 'GUIDE', label: 'Guide', icon: HelpCircle },
]

export default function Sidebar({ tab, onChange, onLogout, onOpenCheckIn, isAdmin, streak, user, billing, devices = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  const connectedCount = devices?.filter(d => d.connected)?.length || 0

  const trialBadge = () => {
    if (!billing) return null
    if (billing.in_trial) return <span className="text-[10px] font-medium text-amber bg-amber/10 px-2 py-0.5 rounded-full">Trial · {billing.trial_days_left} days left</span>
    if (billing.is_paid) return <span className="text-[10px] font-medium text-moss bg-moss/10 px-2 py-0.5 rounded-full">Active</span>
    if (!billing.active) return <span className="text-[10px] font-medium text-rust bg-rust/10 px-2 py-0.5 rounded-full">Expired</span>
    return null
  }

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-[#DDD8CF]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal grid place-items-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg">HealthGuard<span className="text-muted font-sans text-sm">AI</span></span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-ink2"><Menu className="w-5 h-5" /></button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 z-20 flex-col border-r border-[#DDD8CF] bg-white">
        <div className="px-6 pt-8 pb-6 border-b border-[#DDD8CF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal to-[#161B2E] grid place-items-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-lg leading-none tracking-tight">HealthGuard<span className="text-muted font-sans text-sm font-normal">AI</span></div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted mt-1" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>PREVENTIVE WELLNESS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted px-3 mb-2" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Signals</div>
          {primary.map(({ key, label, icon: Icon }) => (
            <NavBtn key={key} testId={`nav-${key.toLowerCase()}-btn`} active={tab === key} label={label} Icon={Icon} onClick={() => onChange(key)} />
          ))}
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted px-3 mt-6 mb-2" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Account</div>
          {secondary.map(({ key, label, icon: Icon }) => (
            <NavBtn key={key} testId={`nav-${key.toLowerCase()}-btn`} active={tab === key} label={label} Icon={Icon} onClick={() => onChange(key)} />
          ))}
          {isAdmin && (
            <NavBtn testId="nav-admin-btn" active={tab === 'ADMIN'} label="Admin Console" Icon={Shield} onClick={() => onChange('ADMIN')} tone="copper" />
          )}
        </nav>

        <div className="px-3 pb-5 pt-4 border-t border-[#DDD8CF] space-y-2">
          {/* Device Status */}
          <div className="mx-2 px-4 py-3 rounded-2xl bg-[#F9F7F2] border border-[#DDD8CF] flex items-center gap-3">
            <div className="relative">
              <Smartphone className="w-4 h-4 text-ink2" />
              {connectedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-moss">
                  <span className="absolute inset-0 rounded-full bg-moss animate-ping opacity-75" />
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Device Status</div>
              <div className="font-mono text-sm text-ink tabular">{connectedCount} connected</div>
            </div>
          </div>

          {/* Streak */}
          <div className="mx-2 px-4 py-3 rounded-2xl bg-[#F9F7F2] border border-[#DDD8CF] flex items-center gap-3">
            <Flame className="w-4 h-4 text-copper" />
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Streak</div>
              <div className="font-mono text-sm text-ink tabular" data-testid="sidebar-streak">{streak} day{streak === 1 ? '' : 's'}</div>
            </div>
            <div>{trialBadge()}</div>
          </div>

          <button data-testid="sidebar-checkin-btn" onClick={onOpenCheckIn} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink2 hover:text-ink hover:bg-[#F9F7F2] transition">
            <Moon className="w-4 h-4" /> Nightly check-in
          </button>

          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-full bg-teal text-white font-semibold grid place-items-center" data-testid="sidebar-avatar">{initial}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || 'Member'}</div>
              <div className="text-xs text-muted truncate">{user?.email}</div>
            </div>
            <button data-testid="sidebar-logout-btn" onClick={onLogout} className="text-rust hover:bg-rust/10 p-2 rounded-lg transition" title="Log out"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 z-50 flex-col border-r border-[#DDD8CF] bg-white flex"
            >
              <div className="px-5 pt-4 pb-4 border-b border-[#DDD8CF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal to-[#161B2E] grid place-items-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-display text-lg">HealthGuard<span className="text-muted font-sans text-sm">AI</span></span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-ink2"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted px-3 mb-2" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Signals</div>
                {primary.map(({ key, label, icon: Icon }) => (
                  <NavBtn key={key} testId={`mnav-${key.toLowerCase()}-btn`} active={tab === key} label={label} Icon={Icon} onClick={() => { onChange(key); setMobileOpen(false) }} />
                ))}
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted px-3 mt-6 mb-2" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Account</div>
                {secondary.map(({ key, label, icon: Icon }) => (
                  <NavBtn key={key} testId={`mnav-${key.toLowerCase()}-btn`} active={tab === key} label={label} Icon={Icon} onClick={() => { onChange(key); setMobileOpen(false) }} />
                ))}
                {isAdmin && (
                  <NavBtn testId="mnav-admin-btn" active={tab === 'ADMIN'} label="Admin Console" Icon={Shield} onClick={() => { onChange('ADMIN'); setMobileOpen(false) }} tone="copper" />
                )}
              </nav>
              <div className="px-3 pb-5 pt-4 border-t border-[#DDD8CF] space-y-2">
                <div className="mx-2 px-4 py-3 rounded-2xl bg-[#F9F7F2] border border-[#DDD8CF] flex items-center gap-3">
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-ink2" />
                    {connectedCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-moss">
                        <span className="absolute inset-0 rounded-full bg-moss animate-ping opacity-75" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Device Status</div>
                    <div className="font-mono text-sm text-ink tabular">{connectedCount} connected</div>
                  </div>
                </div>
                <div className="mx-2 px-4 py-3 rounded-2xl bg-[#F9F7F2] border border-[#DDD8CF] flex items-center gap-3">
                  <Flame className="w-4 h-4 text-copper" />
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Streak</div>
                    <div className="font-mono text-sm text-ink tabular">{streak} day{streak === 1 ? '' : 's'}</div>
                  </div>
                  <div>{trialBadge()}</div>
                </div>
                <button onClick={() => { onOpenCheckIn(); setMobileOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink2 hover:text-ink hover:bg-[#F9F7F2] transition">
                  <Moon className="w-4 h-4" /> Nightly check-in
                </button>
                <div className="flex items-center gap-3 px-2 pt-2">
                  <div className="w-9 h-9 rounded-full bg-teal text-white font-semibold grid place-items-center">{initial}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user?.name || 'Member'}</div>
                    <div className="text-xs text-muted truncate">{user?.email}</div>
                  </div>
                  <button onClick={() => { onLogout(); setMobileOpen(false) }} className="text-rust hover:bg-rust/10 p-2 rounded-lg transition" title="Log out"><LogOut className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[#DDD8CF] bg-white/95 backdrop-blur">
        <div className="flex justify-around py-2">
          {primary.map(({ key, label, icon: Icon }) => (
            <button key={key} data-testid={`mnav-${key.toLowerCase()}-btn`} onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${tab === key ? 'text-teal' : 'text-muted'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}

function NavBtn({ testId, active, label, Icon, onClick, tone }) {
  return (
    <motion.button
      data-testid={testId}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
        active
          ? 'bg-teal text-white shadow-[0_2px_12px_-4px_rgba(14,95,92,0.35)]'
          : 'text-ink2 hover:text-ink hover:bg-[#F9F7F2]'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-white' : tone === 'copper' ? 'text-copper' : ''}`} />
      <span style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
    </motion.button>
  )
}
