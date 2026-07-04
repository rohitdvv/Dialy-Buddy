import React, { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
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
import Billing from './components/Billing.jsx'
import NightlyCheckIn from './components/NightlyCheckIn.jsx'
import Toast from './components/Toast.jsx'
import TrialBanner from './components/TrialBanner.jsx'
import { api } from './lib/api.js'

const ExportPanel = () => (
  <div className="p-10 text-center text-muted">
    <div className="text-sm text-ink2">Export panel coming soon.</div>
  </div>
)

const tabTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
}

export default function App() {
  const { user, billing, loading, logout, refreshBilling } = useAuth()
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

  const showToast = (message, type = 'INFO', duration = 4500) => {
    setToast({ message, type })
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), duration)
  }

  const loadAll = async () => {
    try {
      const [n, j, a, d, c, s] = await Promise.all([
        api.get('/nutrition'), api.get('/journal'), api.get('/activity'),
        api.get('/devices'), api.get('/chat'), api.get('/streak'),
      ])
      setNutrition(n.data); setJournal(j.data); setActivity(a.data)
      setDevices(d.data); setChat(c.data); setStreak(s.data)
    } catch (e) { console.error('loadAll', e) }
  }

  const loadInsights = async () => {
    setLoadingInsights(true)
    try { const { data } = await api.get('/insights'); setInsights(data) }
    catch (e) { console.error('insights', e) }
    finally { setLoadingInsights(false) }
  }

  useEffect(() => { if (user) { loadAll(); loadInsights(); refreshBilling() } }, [user])

  // Nightly check-in at 22:00
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

  // Handle post-checkout return
  useEffect(() => {
    const url = new URL(window.location.href)
    const sid = url.searchParams.get('session_id')
    if (sid && user) {
      setTab('BILLING')
      // billing page handles polling
    }
  }, [user])

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-bg text-ink2 font-mono text-sm" data-testid="app-loading">Initializing HealthGuardAI…</div>
  }
  if (!user) return <AuthScreen />

  const handleNutritionAdded = (entry) => { setNutrition(prev => [entry, ...prev]); loadInsights() }
  const handleJournalAdded = (entry) => {
    setJournal(prev => [entry, ...prev])
    if (entry.stressLevel >= 7 || entry.sentimentScore < -0.3) {
      showToast('High stress detected. Try a 2-minute breathing exercise.', 'ALERT', 8000)
    } else if (entry.sentimentScore > 0.5) {
      showToast(`Great to see you feeling ${String(entry.mood).toLowerCase()}!`, 'INFO', 5000)
    }
    loadInsights()
  }
  const handleActivityUpdate = async (data) => {
    setActivity(data)
    try { await api.post('/activity', data) } catch (e) { /* ignore */ void e }
  }
  const handleDeviceConnect = async (providerId, name) => {
    try {
      const { data } = await api.post('/devices/connect', { provider: providerId })
      setDevices(prev => [...prev.filter(d => d.id !== providerId), data])
      showToast(`${data.name || name} connected · ${data.records_synced || 30} days imported.`, 'INFO', 6000)
      await loadAll(); await loadInsights()
    } catch (e) {
      showToast('Could not connect device. Please try again.', 'ALERT')
    }
  }
  const handleDeviceResync = async (id) => {
    try {
      const { data } = await api.post(`/devices/${id}/sync`)
      showToast(`Re-synced ${data.records_synced} days.`, 'INFO')
      await loadAll()
    } catch { showToast('Re-sync failed.', 'ALERT') }
  }
  const handleDeviceDisconnect = async (id) => {
    setDevices(prev => prev.filter(d => d.id !== id))
    try { await api.post(`/devices/${id}/disconnect`) } catch (e) { void e }
    showToast('Device disconnected.', 'INFO')
  }
  const handleChatSend = async (text) => {
    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', text, timestamp: new Date().toISOString() }
    setChat(prev => [...prev, optimistic])
    try {
      const { data } = await api.post('/chat', { message: text })
      setChat(prev => [...prev.filter(m => m.id !== optimistic.id), data.user_message, data.reply])
    } catch (e) {
      setChat(prev => prev.filter(m => m.id !== optimistic.id))
      showToast('Could not reach the AI companion. Please try again.', 'ALERT')
    }
  }
  const handleCheckInSubmit = async ({ stressLevel, sleepHours, caloriesBurned }) => {
    try {
      const next = { ...(activity || {}), steps: activity?.steps || 6000, sleepHours,
        sleepQuality: activity?.sleepQuality || 6, heartRateAvg: activity?.heartRateAvg || 72, caloriesBurned }
      await api.post('/activity', next); setActivity(next)
      const { data } = await api.post('/journal/quick', { mood: 'Evening Check-in', stressLevel,
        sentimentScore: stressLevel > 6 ? -0.2 : 0.2, keyTopics: ['Check-in'],
        summary: `End of day check-in. Stress ${stressLevel}/10.` })
      setJournal(prev => [data, ...prev])
      localStorage.setItem('hg_last_checkin', new Date().toDateString())
      setShowCheckIn(false); loadInsights(); showToast('Nightly check-in saved.', 'INFO')
    } catch { showToast('Could not save check-in.', 'ALERT') }
  }

  const isAdmin = user?.role === 'admin'
  const trialActive = billing?.active

  return (
    <div className="min-h-screen bg-bg text-ink flex" data-testid="app-shell">
      <Sidebar tab={tab} onChange={setTab} onLogout={logout} onOpenCheckIn={() => setShowCheckIn(true)}
               isAdmin={isAdmin} streak={streak.streak} user={user} billing={billing} devices={devices} />

      <main className="flex-1 relative md:pl-72 pb-24 md:pb-0">
        <TopBar tab={tab} user={user} loading={loadingInsights} streak={streak.streak}
                score={insights.wellnessScore} billing={billing} onOpenBilling={() => setTab('BILLING')} onLogout={logout} />
        <TrialBanner billing={billing} onOpen={() => setTab('BILLING')} />

        <div className="px-5 md:px-10 py-6">
          <AnimatePresence mode="wait">
            {tab === 'DASHBOARD' && (
              <motion.div key="dashboard" {...tabTransition}>
                <Dashboard insights={insights} activity={activity} nutrition={nutrition}
                           journal={journal} streak={streak} onChangeTab={setTab}
                           loadingInsights={loadingInsights} devices={devices} />
              </motion.div>
            )}
            {tab === 'NUTRITION' && (
              <motion.div key="nutrition" {...tabTransition}>
                <NutritionTracker entries={nutrition} onAdded={handleNutritionAdded} onRefresh={loadAll} disabled={!trialActive} />
              </motion.div>
            )}
            {tab === 'JOURNAL' && (
              <motion.div key="journal" {...tabTransition}>
                <VoiceJournal entries={journal} onAdded={handleJournalAdded} disabled={!trialActive} />
              </motion.div>
            )}
            {tab === 'ACTIVITY' && (
              <motion.div key="activity" {...tabTransition}>
                <ActivityLog data={activity} devices={devices} onUpdate={handleActivityUpdate}
                             onConnect={handleDeviceConnect} onDisconnect={handleDeviceDisconnect}
                             onResync={handleDeviceResync}
                             onBluetoothData={(hr) => setActivity(prev => prev ? { ...prev, heartRateAvg: hr } : prev)} />
              </motion.div>
            )}
            {tab === 'CHAT' && (
              <motion.div key="chat" {...tabTransition}>
                <AIChat messages={chat} onSend={handleChatSend} disabled={!trialActive} />
              </motion.div>
            )}
            {tab === 'EXPORT' && (
              <motion.div key="export" {...tabTransition}>
                <ExportPanel />
              </motion.div>
            )}
            {tab === 'BILLING' && (
              <motion.div key="billing" {...tabTransition}>
                <Billing />
              </motion.div>
            )}
            {tab === 'GUIDE' && (
              <motion.div key="guide" {...tabTransition}>
                <Guide onChangeTab={setTab} />
              </motion.div>
            )}
            {tab === 'ADMIN' && isAdmin && (
              <motion.div key="admin" {...tabTransition}>
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <NightlyCheckIn isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} onSubmit={handleCheckInSubmit} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
