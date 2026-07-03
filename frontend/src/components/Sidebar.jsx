import React from 'react'
import { LayoutDashboard, Apple, Mic, Activity, MessageCircle, HelpCircle, Shield, LogOut, Moon, Flame, CreditCard, Download } from 'lucide-react'

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

export default function Sidebar({ tab, onChange, onLogout, onOpenCheckIn, isAdmin, streak, user, billing }) {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 z-20 flex-col border-r border-border bg-white">
        <div className="px-6 pt-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal to-emerald grid place-items-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-lg leading-none tracking-tight">HealthGuard<span className="text-copper">AI</span></div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted mt-1">Wellness OS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted px-3 mb-2">Signals</div>
          {primary.map(({ key, label, icon: Icon }) => (
            <NavBtn key={key} testId={`nav-${key.toLowerCase()}-btn`} active={tab === key} label={label} Icon={Icon} onClick={() => onChange(key)} />
          ))}
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted px-3 mt-6 mb-2">Account</div>
          {secondary.map(({ key, label, icon: Icon }) => (
            <NavBtn key={key} testId={`nav-${key.toLowerCase()}-btn`} active={tab === key} label={label} Icon={Icon} onClick={() => onChange(key)} />
          ))}
          {isAdmin && (
            <NavBtn testId="nav-admin-btn" active={tab === 'ADMIN'} label="Admin Console" Icon={Shield} onClick={() => onChange('ADMIN')} tone="copper" />
          )}
        </nav>

        <div className="px-3 pb-5 pt-4 border-t border-border space-y-2">
          <div className="mx-2 px-4 py-3 rounded-2xl bg-bg border border-border flex items-center gap-3">
            <Flame className="w-4 h-4 text-copper" />
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Streak</div>
              <div className="font-mono text-sm text-ink" data-testid="sidebar-streak">{streak} day{streak === 1 ? '' : 's'}</div>
            </div>
            {billing?.in_trial && (
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.25em] text-teal">Trial</div>
                <div className="font-mono text-sm text-ink tabular">{billing.trial_days_left}d</div>
              </div>
            )}
          </div>

          <button data-testid="sidebar-checkin-btn" onClick={onOpenCheckIn} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink2 hover:text-ink hover:bg-bg transition">
            <Moon className="w-4 h-4" /> Nightly check-in
          </button>

          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-9 h-9 rounded-full bg-teal text-white font-semibold grid place-items-center" data-testid="sidebar-avatar">{initial}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || 'Member'}</div>
              <div className="text-xs text-muted truncate">{user?.email}</div>
            </div>
            <button data-testid="sidebar-logout-btn" onClick={onLogout} className="text-muted hover:text-rust p-2" title="Log out"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 backdrop-blur">
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
  const cls = active
    ? `bg-teal/10 text-teal border border-teal/25`
    : `text-ink2 hover:text-ink hover:bg-bg`
  return (
    <button data-testid={testId} onClick={onClick} className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${cls}`}>
      <Icon className={`w-4 h-4 ${active ? 'text-teal' : tone === 'copper' ? 'text-copper' : ''}`} />
      <span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal" />}
    </button>
  )
}
