import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './components/Dashboard.jsx'
import NutritionTracker from './components/NutritionTracker.jsx'
import VoiceJournal from './components/VoiceJournal.jsx'
import ActivityLog from './components/ActivityLog.jsx'
import AIChat from './components/AIChat.jsx'
import Guide from './components/Guide.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import NightlyCheckIn from './components/NightlyCheckIn.jsx'
import Toast from './components/Toast.jsx'
import { api } from './lib/api.js'

export default function App() {
  const { user, loading, logout } = useAuth()
  const [tab, setTab] = useState('DASHBOARD')
  const [insights, setInsights] = useState({ wellnessScore: 75, recommendations: [] })
  const [activity, setActivity] = useState(null)
  const [nutrition, setNutrition] = useState([])
  const [journal, setJournal] = useState([])
  const [chat, setChat] = useState([])
  const [devices, setDevices] = useState([])
  const [streak, setStreak] = useState({ streak: 0, badges: [] })
  const [toast, setToast] = useState(null)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const showToast = (message, type = 'INFO', duration = 4000) => {
    setToast({ message, type })
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), duration)
  }

  const loadAll = async () => {
    try {
      const [n, j, a, d, c, s] = await Promise.all([
        api.get('/nutrition'),
        api.get('/journal'),
        api.get('/activity'),
        api.get('/devices'),
        api.get('/chat'),
        api.get('/streak'),
      ])
      setNutrition(n.data)
      setJournal(j.data)
      setActivity(a.data)
      setDevices(d.data)
      setChat(c.data)
      setStreak(s.data)
    } catch (e) {
      console.error('loadAll', e)
    }
  }

  const loadInsights = async () => {
    setLoadingInsights(true)
    try {
      const { data } = await api.get('/insights')
      setInsights(data)
    } catch (e) {
      console.error('insights', e)
    } finally {
      setLoadingInsights(false)
    }
  }

  useEffect(() => {
    if (user) { loadAll(); loadInsights() }
  }, [user])

  // Nightly check-in trigger at 10pm (dev: check every minute)
  useEffect(() => {
    if (!user) return
    const t = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 22 && now.getMinutes() === 0) {
        const last = localStorage.getItem('hg_last_checkin')
        if (last !== now.toDateString()) setShowCheckIn(true)
      }
    }, 60000)
    return () => clearInterval(t)
  }, [user])

  // Simulate live device sync
  useEffect(() => {
    const cloudDevice = devices.find(d => d.type === 'CLOUD' && d.status === 'CONNECTED')
    if (!cloudDevice || !activity) return
    const t = setInterval(() => {
      setActivity(prev => prev ? { ...prev, steps: (prev.steps || 0) + Math.floor(Math.random() * 15), caloriesBurned: (prev.caloriesBurned || 0) + 1 } : prev)
    }, 5000)
    return () => clearInterval(t)
  }, [devices, activity])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-muted font-mono text-sm">Initializing HealthGuardAI…</div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  const handleNutritionAdded = (entry) => {
    setNutrition(prev => [entry, ...prev])
    loadInsights()
  }

  const handleJournalAdded = (entry) => {
    setJournal(prev => [entry, ...prev])
    if (entry.stressLevel >= 7 || entry.sentimentScore < -0.3) {
      showToast(`High stress detected. Try a 2-minute breathing exercise.`, 'ALERT', 8000)
    } else if (entry.sentimentScore > 0.5) {
      showToast(`Great to see you feeling ${String(entry.mood).toLowerCase()}!`, 'INFO', 6000)
    }
    loadInsights()
  }

  const handleActivityUpdate = async (data) => {
    setActivity(data)
    try { await api.post('/activity', data) } catch {}
  }

  const handleDeviceConnect = async (device) => {
    setDevices(prev => [...prev.filter(d => d.id !== device.id), device])
    try { await api.post('/devices', device) } catch {}
    showToast(`${device.name} connected.`, 'INFO')
  }

  const handleDeviceDisconnect = async (id) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    try { await api.delete(`/devices/${id}`) } catch {}
    showToast('Device disconnected.', 'INFO')
  }

  const handleChatSend = async (text) => {
    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', text, timestamp: new Date().toISOString() }
    setChat(prev => [...prev, optimistic])
    try {
      const { data } = await api.post('/chat', { message: text })
      setChat(prev => [...prev.filter(m => m.id !== optimistic.id), data.user_message, data.reply])
    } catch (e) {
      showToast('Could not reach the AI companion.', 'ALERT')
    }
  }

  const handleCheckInSubmit = async ({ stressLevel, sleepHours, caloriesBurned }) => {
    try {
      const next = { ...(activity || {}), steps: activity?.steps || 6000, sleepHours, sleepQuality: activity?.sleepQuality || 6, heartRateAvg: activity?.heartRateAvg || 72, caloriesBurned }
      await api.post('/activity', next)
      setActivity(next)
      const { data } = await api.post('/journal/quick', {
        mood: 'Evening Check-in',
        stressLevel,
        sentimentScore: 0,
        keyTopics: ['Check-in'],
        summary: `End of day check-in. Stress level ${stressLevel}/10.`,
      })
      setJournal(prev => [data, ...prev])
      localStorage.setItem('hg_last_checkin', new Date().toDateString())
      setShowCheckIn(false)
      loadInsights()
      showToast('Nightly check-in saved.', 'INFO')
    } catch {
      showToast('Could not save check-in.', 'ALERT')
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-bg text-ink flex" data-testid="app-shell">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{background:'radial-gradient(circle, rgba(216,107,69,0.18) 0%, transparent 60%)'}} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{background:'radial-gradient(circle, rgba(226,192,124,0.10) 0%, transparent 60%)'}} />
      </div>

      <Sidebar tab={tab} onChange={setTab} onLogout={logout} onOpenCheckIn={() => setShowCheckIn(true)} isAdmin={isAdmin} streak={streak.streak} />

      <main className="flex-1 relative z-10 md:pl-72 pb-24 md:pb-0">
        <TopBar tab={tab} user={user} loading={loadingInsights} streak={streak.streak} score={insights.wellnessScore} />
        <div className="px-6 md:px-10 py-6">
          {tab === 'DASHBOARD' && (
            <Dashboard
              insights={insights}
              activity={activity}
              nutrition={nutrition}
              journal={journal}
              streak={streak}
              onChangeTab={setTab}
            />
          )}
          {tab === 'NUTRITION' && (
            <NutritionTracker entries={nutrition} onAdded={handleNutritionAdded} onRefresh={loadAll} />
          )}
          {tab === 'JOURNAL' && (
            <VoiceJournal entries={journal} onAdded={handleJournalAdded} onRefresh={loadAll} />
          )}
          {tab === 'ACTIVITY' && (
            <ActivityLog
              data={activity}
              devices={devices}
              onUpdate={handleActivityUpdate}
              onConnect={handleDeviceConnect}
              onDisconnect={handleDeviceDisconnect}
              onBluetoothData={(hr) => setActivity(prev => prev ? { ...prev, heartRateAvg: hr } : prev)}
            />
          )}
          {tab === 'CHAT' && (
            <AIChat messages={chat} onSend={handleChatSend} />
          )}
          {tab === 'GUIDE' && <Guide onChangeTab={setTab} />}
          {tab === 'ADMIN' && isAdmin && <AdminPanel />}
        </div>
      </main>

      <NightlyCheckIn isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} onSubmit={handleCheckInSubmit} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
