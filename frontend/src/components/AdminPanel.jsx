import React, { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Users, AlertTriangle, Utensils, Mic, MessageCircle, Watch, CreditCard } from 'lucide-react'

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { (async () => {
    try {
      const [s, u] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      setStats(s.data); setUsers(u.data)
    } catch { setError('Admin access required.') } finally { setLoading(false) }
  })() }, [])

  if (loading) return <div className="text-ink2">Loading…</div>
  if (error) return <div className="text-rust" data-testid="admin-error">{error}</div>

  return (
    <div className="space-y-5" data-testid="admin-view">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi icon={Users} label="Users" value={stats.users_total} tone="teal" />
        <Kpi icon={CreditCard} label="Paying" value={stats.paying_users} tone="moss" />
        <Kpi icon={Utensils} label="Meals" value={stats.meals_total} tone="copper" />
        <Kpi icon={Mic} label="Journal" value={stats.journals_total} tone="rust" />
        <Kpi icon={MessageCircle} label="Chats" value={stats.chats_total} tone="teal" />
        <Kpi icon={Watch} label="Devices" value={stats.devices_total} tone="amber" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-rust" /><h3 className="font-display text-lg">High-stress events</h3></div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {stats.high_stress_events?.length ? stats.high_stress_events.map(e => (
              <div key={e.id} className="p-3 rounded-xl bg-bg border border-border" data-testid={`admin-stress-${e.id}`}>
                <div className="text-xs text-muted font-mono">{new Date(e.timestamp).toLocaleString()}</div>
                <div className="text-sm text-ink">{e.mood} · stress {e.stressLevel}/10</div>
                <div className="text-xs text-ink2 italic">&ldquo;{e.summary}&rdquo;</div>
              </div>
            )) : <div className="text-sm text-ink2">No high-stress events yet.</div>}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-display text-lg mb-3">Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-muted">
                <tr><th className="text-left py-2">Name</th><th className="text-left">Email</th><th className="text-left">Role</th><th className="text-left">Plan</th><th className="text-right">Streak</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} data-testid={`admin-user-${u.id}`} className="border-t border-border">
                    <td className="py-2 text-ink">{u.name}</td>
                    <td className="text-ink2">{u.email}</td>
                    <td><span className={`text-[10px] uppercase tracking-[0.2em] ${u.role === 'admin' ? 'text-copper' : 'text-ink2'}`}>{u.role}</span></td>
                    <td>
                      {u.billing?.is_paid
                        ? <span className="text-[10px] uppercase tracking-[0.2em] text-moss">Pro</span>
                        : u.billing?.in_trial
                          ? <span className="text-[10px] uppercase tracking-[0.2em] text-copper">Trial · {u.billing.trial_days_left}d</span>
                          : <span className="text-[10px] uppercase tracking-[0.2em] text-rust">Expired</span>}
                    </td>
                    <td className="text-right font-mono tabular">{u.streak || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, tone }) {
  return (
    <div className="card p-4" data-testid={`admin-kpi-${label.toLowerCase()}`}>
      <div className={`inline-flex w-9 h-9 items-center justify-center rounded-xl bg-${tone}/10 border border-${tone}/20 text-${tone}`}><Icon className="w-4 h-4" /></div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted">{label}</div>
      <div className="font-mono text-2xl mt-1 tabular text-ink">{value}</div>
    </div>
  )
}
