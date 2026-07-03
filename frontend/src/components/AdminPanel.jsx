import React, { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Users, AlertTriangle, Utensils, Mic, MessageCircle } from 'lucide-react'

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [s, u] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
        setStats(s.data); setUsers(u.data)
      } catch (e) { setError('Admin access required.') } finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className="text-muted">Loading…</div>
  if (error) return <div className="text-rose" data-testid="admin-error">{error}</div>

  return (
    <div className="space-y-6" data-testid="admin-view">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Kpi icon={Users} label="Users" value={stats.users_total} tone="terracotta" />
        <Kpi icon={Utensils} label="Meals logged" value={stats.meals_total} tone="sage" />
        <Kpi icon={Mic} label="Journal entries" value={stats.journals_total} tone="rose" />
        <Kpi icon={MessageCircle} label="Chat messages" value={stats.chats_total} tone="gold" />
        <Kpi icon={Users} label="New (7d)" value={stats.new_users_7d} tone="terracotta" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-rose" /><h3 className="font-display text-lg">High-stress events</h3></div>
          <div className="space-y-2">
            {stats.high_stress_events?.length ? stats.high_stress_events.map(e => (
              <div key={e.id} className="p-3 rounded-xl bg-white/5 border border-white/5" data-testid={`admin-stress-${e.id}`}>
                <div className="text-xs text-muted font-mono">{new Date(e.timestamp).toLocaleString()}</div>
                <div className="text-sm">{e.mood} · stress {e.stressLevel}/10</div>
                <div className="text-xs text-muted italic">"{e.summary}"</div>
              </div>
            )) : <div className="text-sm text-muted">No high-stress events yet.</div>}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg mb-3">Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-muted">
                <tr><th className="text-left py-2">Name</th><th className="text-left">Email</th><th className="text-left">Role</th><th className="text-right">Streak</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} data-testid={`admin-user-${u.id}`} className="border-t border-white/5">
                    <td className="py-2">{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td><span className={`text-[10px] uppercase tracking-[0.2em] ${u.role === 'admin' ? 'text-gold' : 'text-muted'}`}>{u.role}</span></td>
                    <td className="text-right font-mono">{u.streak || 0}</td>
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
    <div className="glass rounded-2xl p-4" data-testid={`admin-kpi-${label.toLowerCase().replace(/\s/g,'-')}`}>
      <div className={`inline-flex w-8 h-8 items-center justify-center rounded-lg bg-${tone}/10 border border-${tone}/20 text-${tone}`}><Icon className="w-4 h-4" /></div>
      <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted">{label}</div>
      <div className="font-mono text-2xl mt-1">{value}</div>
    </div>
  )
}
