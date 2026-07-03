import React from 'react'
import { LayoutDashboard, Apple, Mic, Activity, MessageCircle, HelpCircle, Shield, LogOut, Moon, Flame } from 'lucide-react'

const items = [
  { key: 'DASHBOARD', label: 'Overview', icon: LayoutDashboard },
  { key: 'NUTRITION', label: 'Nutrition', icon: Apple },
  { key: 'JOURNAL', label: 'Voice Journal', icon: Mic },
  { key: 'ACTIVITY', label: 'Activity & Devices', icon: Activity },
  { key: 'CHAT', label: 'AI Companion', icon: MessageCircle },
  { key: 'GUIDE', label: 'Guide', icon: HelpCircle },
]

export default function Sidebar({ tab, onChange, onLogout, onOpenCheckIn, isAdmin, streak }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 z-20 flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="px-6 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-white/10 grid place-items-center bg-terracotta/10">
              <Shield className="w-5 h-5 text-terracotta" />
            </div>
            <div>
              <div className="font-display text-lg leading-none tracking-tight">HealthGuard<span className="text-terracotta">AI</span></div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted mt-1">Wellness OS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              data-testid={`nav-${key.toLowerCase()}-btn`}
              onClick={() => onChange(key)}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                tab === key ? 'bg-white/10 text-ink border border-white/10' : 'text-muted hover:text-ink hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab === key ? 'text-terracotta' : ''}`} />
              <span>{label}</span>
              {tab === key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-terracotta shadow-glow-terracotta" />}
            </button>
          ))}

          {isAdmin && (
            <button
              data-testid="nav-admin-btn"
              onClick={() => onChange('ADMIN')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                tab === 'ADMIN' ? 'bg-gold/10 text-ink border border-gold/30' : 'text-muted hover:text-ink hover:bg-white/5'
              }`}
            >
              <Shield className={`w-4 h-4 ${tab === 'ADMIN' ? 'text-gold' : ''}`} />
              Admin Console
            </button>
          )}
        </nav>

        <div className="px-3 pb-6 space-y-2 border-t border-white/5 pt-4">
          <div className="mx-2 px-4 py-3 rounded-xl bg-terracotta/5 border border-terracotta/20 flex items-center gap-3">
            <Flame className="w-4 h-4 text-terracotta" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Streak</div>
              <div className="font-mono text-sm text-ink" data-testid="sidebar-streak">{streak} day{streak === 1 ? '' : 's'}</div>
            </div>
          </div>
          <button data-testid="sidebar-checkin-btn" onClick={onOpenCheckIn} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-ink hover:bg-white/5">
            <Moon className="w-4 h-4" /> Nightly check-in
          </button>
          <button data-testid="sidebar-logout-btn" onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted hover:text-rose hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex justify-around py-2">
          {items.slice(0, 5).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              data-testid={`mnav-${key.toLowerCase()}-btn`}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${tab === key ? 'text-terracotta' : 'text-muted'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
