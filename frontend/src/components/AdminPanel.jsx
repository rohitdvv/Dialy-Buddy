import React, { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { Users, AlertTriangle, Utensils, Mic, MessageCircle, Watch, CreditCard, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }

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

  if (loading) return <div className="text-[#3D4556]">Loading…</div>
  if (error) return <div className="text-[#8B3D3D]" data-testid="admin-error">{error}</div>

  const kpis = [
    { icon: Users, label: 'Users', value: stats.users_total, tone: 'teal', color: '#0B4F5C' },
    { icon: CreditCard, label: 'Paying', value: stats.paying_users, tone: 'moss', color: '#3D6B5A' },
    { icon: Utensils, label: 'Meals', value: stats.meals_total, tone: 'copper', color: '#B87333' },
    { icon: Mic, label: 'Journals', value: stats.journals_total, tone: 'rust', color: '#8B3D3D' },
    { icon: MessageCircle, label: 'Chats', value: stats.chats_total, tone: 'teal', color: '#0B4F5C' },
    { icon: Watch, label: 'Devices', value: stats.devices_total, tone: 'amber', color: '#C8A040' },
    { icon: DollarSign, label: 'Revenue', value: `$${((stats.paying_users || 0) * 10).toFixed(0)}`, tone: 'emerald', color: '#0F5C4F' },
  ]

  return (
    <div className="space-y-5" data-testid="admin-view">
      <motion.div className="grid grid-cols-2 md:grid-cols-7 gap-3" variants={container} initial="hidden" animate="show">
        {kpis.map(k => (
          <motion.div key={k.label} variants={itemUp} className="card p-4" data-testid={`admin-kpi-${k.label.toLowerCase()}`}>
            <div className="inline-flex w-9 h-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${k.color}15`, border: `1px solid ${k.color}30`, color: k.color }}>
              <k.icon className="w-4 h-4" />
            </div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#8B92A5] font-body">{k.label}</div>
            <div className="font-mono text-2xl mt-1 tabular-nums text-[#161B2E]">{k.value}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#8B3D3D]" />
            <h3 className="font-display text-lg text-[#161B2E]">High-stress events</h3>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {stats.high_stress_events?.length ? stats.high_stress_events.map(e => (
              <div key={e.id} className="p-3 rounded-xl bg-white border border-[#DDD8CF] border-l-4" style={{ borderLeftColor: '#8B3D3D' }} data-testid={`admin-stress-${e.id}`}>
                <div className="text-xs text-[#8B92A5] font-mono tabular-nums">{new Date(e.timestamp).toLocaleString()}</div>
                <div className="text-sm text-[#161B2E] mt-1">{e.mood} · stress {e.stressLevel}/10</div>
                <div className="text-xs text-[#3D4556] italic mt-1">&ldquo;{e.summary}&rdquo;</div>
              </div>
            )) : <div className="text-sm text-[#3D4556]">No high-stress events yet.</div>}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg mb-3 text-[#161B2E]">Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F7F2]">
                  <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-[0.2em] text-[#8B92A5] font-medium rounded-tl-xl">Name</th>
                  <th className="text-left px-3 text-[10px] uppercase tracking-[0.2em] text-[#8B92A5] font-medium">Email</th>
                  <th className="text-left px-3 text-[10px] uppercase tracking-[0.2em] text-[#8B92A5] font-medium">Role</th>
                  <th className="text-left px-3 text-[10px] uppercase tracking-[0.2em] text-[#8B92A5] font-medium">Plan</th>
                  <th className="text-right px-3 text-[10px] uppercase tracking-[0.2em] text-[#8B92A5] font-medium rounded-tr-xl">Streak</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} data-testid={`admin-user-${u.id}`} className={`border-t border-[#DDD8CF] ${idx === users.length - 1 ? 'last' : ''}`}>
                    <td className="py-2.5 px-3 text-[#161B2E]">{u.name}</td>
                    <td className="px-3 text-[#3D4556]">{u.email}</td>
                    <td className="px-3">
                      <span className={`text-[10px] uppercase tracking-[0.2em] ${u.role === 'admin' ? 'text-[#B87333]' : 'text-[#3D4556]'}`}>{u.role}</span>
                    </td>
                    <td className="px-3">
                      {u.billing?.is_paid
                        ? <span className="text-[10px] uppercase tracking-[0.2em] text-[#3D6B5A]">Pro</span>
                        : u.billing?.in_trial
                          ? <span className="text-[10px] uppercase tracking-[0.2em] text-[#B87333]">Trial · {u.billing.trial_days_left}d</span>
                          : <span className="text-[10px] uppercase tracking-[0.2em] text-[#8B3D3D]">Expired</span>}
                    </td>
                    <td className="text-right px-3 font-mono tabular-nums text-[#161B2E]">{u.streak || 0}</td>
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
