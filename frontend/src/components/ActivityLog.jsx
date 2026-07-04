import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Footprints, Route, Timer, Flame, Moon, Heart, Activity, Bed, HeartPulse, TrendingUp, Watch, Dumbbell, Mountain, CircleDot, Save, Loader2 } from 'lucide-react'
import { api } from '../lib/api.js'
import DeviceManager from './DeviceManager.jsx'

const METRICS = [
  { key: 'steps', label: 'Steps', icon: Footprints, unit: '' },
  { key: 'distance', label: 'Distance', icon: Route, unit: 'km' },
  { key: 'activeMinutes', label: 'Active Min', icon: Timer, unit: 'min' },
  { key: 'caloriesBurned', label: 'Calories', icon: Flame, unit: 'kcal' },
  { key: 'sleepHours', label: 'Sleep', icon: Moon, unit: 'hrs' },
  { key: 'sleepQuality', label: 'Sleep Qty', icon: Bed, unit: '/10' },
  { key: 'heartRateAvg', label: 'HR Avg', icon: Heart, unit: 'bpm' },
  { key: 'restingHR', label: 'Resting HR', icon: HeartPulse, unit: 'bpm' },
  { key: 'hrv', label: 'HRV', icon: Activity, unit: 'ms' },
]

const DEFAULT_DATA = {
  steps: 0,
  distance: 0,
  activeMinutes: 0,
  caloriesBurned: 0,
  sleepHours: 0,
  sleepQuality: 5,
  heartRateAvg: 0,
  restingHR: 0,
  hrv: 0,
}

const HISTORY_MOCK = [
  { day: 'Mon', steps: 8432, distance: 6.2, activeMinutes: 45, caloriesBurned: 420, sleepHours: 7.5, sleepQuality: 7, heartRateAvg: 72, restingHR: 58, hrv: 42 },
  { day: 'Tue', steps: 10234, distance: 7.8, activeMinutes: 62, caloriesBurned: 510, sleepHours: 6.5, sleepQuality: 6, heartRateAvg: 75, restingHR: 60, hrv: 38 },
  { day: 'Wed', steps: 6789, distance: 5.1, activeMinutes: 30, caloriesBurned: 380, sleepHours: 8.0, sleepQuality: 8, heartRateAvg: 70, restingHR: 56, hrv: 45 },
  { day: 'Thu', steps: 9120, distance: 6.8, activeMinutes: 55, caloriesBurned: 460, sleepHours: 7.0, sleepQuality: 7, heartRateAvg: 74, restingHR: 59, hrv: 40 },
  { day: 'Fri', steps: 11500, distance: 8.5, activeMinutes: 70, caloriesBurned: 580, sleepHours: 6.0, sleepQuality: 5, heartRateAvg: 78, restingHR: 62, hrv: 35 },
  { day: 'Sat', steps: 13400, distance: 9.2, activeMinutes: 85, caloriesBurned: 650, sleepHours: 8.5, sleepQuality: 9, heartRateAvg: 68, restingHR: 55, hrv: 48 },
  { day: 'Sun', steps: 5600, distance: 4.0, activeMinutes: 20, caloriesBurned: 310, sleepHours: 9.0, sleepQuality: 9, heartRateAvg: 66, restingHR: 54, hrv: 50 },
]

export default function ActivityLog({ data, devices, onUpdate, onConnect, onDisconnect, onResync, onBluetoothData }) {
  const [local, setLocal] = useState({ ...DEFAULT_DATA, ...(data || {}) })
  const [history, setHistory] = useState(HISTORY_MOCK)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setLocal({ ...DEFAULT_DATA, ...(data || {}) }) }, [data])

  useEffect(() => {
    setLoadingHistory(true)
    api.get('/activity/history?days=7')
      .then(({ data }) => { if (Array.isArray(data) && data.length) setHistory(data) })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [])

  const cloudDevice = devices.find(d => d.status === 'CONNECTED' && d.type !== 'BLUETOOTH')
  const bleDevice = devices.find(d => d.status === 'CONNECTED' && d.type === 'BLUETOOTH')
  const isCloud = !!cloudDevice
  const isBle = !!bleDevice

  const update = (k, v) => {
    if (isCloud && ['steps', 'distance', 'activeMinutes', 'caloriesBurned', 'sleepHours', 'sleepQuality', 'heartRateAvg'].includes(k)) return
    if (isBle && k === 'heartRateAvg') return
    const next = { ...local, [k]: v }
    setLocal(next)
    onUpdate(next)
  }

  const handleSave = () => {
    setSaving(true)
    onUpdate(local)
    setTimeout(() => setSaving(false), 800)
  }

  const sparklineMax = (key) => Math.max(...history.map(h => h[key] || 0), 1)

  const getDeviceIcon = () => {
    if (!cloudDevice) return null
    const icons = { apple_watch: Watch, fitbit: Watch, google_fit: Activity, garmin: Mountain, oura: CircleDot, whoop: Dumbbell }
    const I = icons[cloudDevice.id] || Activity
    return <I className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-6" data-testid="activity-view">
      <DeviceManager connections={devices} onConnect={onConnect} onDisconnect={onDisconnect} onResync={onResync} onBluetoothData={onBluetoothData} />

      {isCloud && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-moss/10 text-moss text-xs font-medium border border-moss/20"
          data-testid="sync-badge"
        >
          {getDeviceIcon()}
          Syncing from {cloudDevice.name}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="card p-6"
        data-testid="today-summary"
      >
        <h3 className="font-display text-xl mb-4">Today&apos;s Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {METRICS.map(({ key, label, icon: Icon, unit }) => {
            const value = local[key] ?? 0
            return (
              <motion.div
                key={key}
                whileHover={{ y: -2 }}
                className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2 transition-shadow hover:shadow-card"
                data-testid={`metric-card-${key}`}
              >
                <div className="flex items-center gap-2 text-muted">
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-[0.18em]">{label}</span>
                </div>
                <div className="font-mono text-xl text-ink tabular-nums">
                  {value}
                  <span className="text-xs text-muted ml-1">{unit}</span>
                </div>
              </motion.div>
            )
          })}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2 transition-shadow hover:shadow-card"
            data-testid="metric-card-provider"
          >
            <div className="flex items-center gap-2 text-muted">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.18em]">Provider</span>
            </div>
            <div className="font-mono text-sm text-ink tabular-nums">
              {isCloud ? cloudDevice.name : (isBle ? 'BLE Monitor' : 'Manual')}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="card p-6"
        data-testid="history-table"
      >
        <h3 className="font-display text-xl mb-4">7-Day History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.18em] text-muted border-b border-border">
                <th className="text-left py-2 px-2">Day</th>
                <th className="text-right py-2 px-2">Steps</th>
                <th className="text-right py-2 px-2">Dist</th>
                <th className="text-right py-2 px-2">Active</th>
                <th className="text-right py-2 px-2">Cals</th>
                <th className="text-right py-2 px-2">Sleep</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">HR</th>
                <th className="text-right py-2 px-2">RHR</th>
                <th className="text-right py-2 px-2">HRV</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={row.day || i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="py-2 px-2 text-ink2 font-medium">{row.day}</td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-mono tabular-nums">{row.steps}</span>
                    <div className="w-16 h-1.5 bg-bg rounded-full ml-auto mt-1 overflow-hidden">
                      <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min((row.steps / sparklineMax('steps')) * 100, 100)}%` }} />
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{row.distance}km</td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-mono tabular-nums">{row.activeMinutes}</span>
                    <div className="w-16 h-1.5 bg-bg rounded-full ml-auto mt-1 overflow-hidden">
                      <div className="h-full bg-emerald rounded-full" style={{ width: `${Math.min((row.activeMinutes / sparklineMax('activeMinutes')) * 100, 100)}%` }} />
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{row.caloriesBurned}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{row.sleepHours}h</td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-mono tabular-nums">{row.sleepQuality}</span>
                    <div className="w-12 h-1.5 bg-bg rounded-full ml-auto mt-1 overflow-hidden">
                      <div className="h-full bg-amber rounded-full" style={{ width: `${(row.sleepQuality / 10) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{row.heartRateAvg}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{row.restingHR}</td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums">{row.hrv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="card p-6"
        data-testid="manual-entry"
      >
        <h3 className="font-display text-xl mb-6">Manual Entry</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <NumberInput label="Steps" value={local.steps || 0} onChange={v => update('steps', parseInt(v))} disabled={isCloud} testId="activity-steps" />
          <NumberInput label="Distance (km)" value={local.distance || 0} onChange={v => update('distance', parseFloat(v))} step="0.1" disabled={isCloud} testId="activity-distance" />
          <NumberInput label="Active Minutes" value={local.activeMinutes || 0} onChange={v => update('activeMinutes', parseInt(v))} disabled={isCloud} testId="activity-active" />
          <NumberInput label="Calories Burned" value={local.caloriesBurned || 0} onChange={v => update('caloriesBurned', parseInt(v))} disabled={isCloud} testId="activity-calories" />
          <NumberInput label="Sleep Hours" value={local.sleepHours || 0} onChange={v => update('sleepHours', parseFloat(v))} step="0.5" disabled={isCloud} testId="activity-sleep" />
          <RatingInput label="Sleep Quality (1-10)" value={local.sleepQuality || 5} onChange={v => update('sleepQuality', v)} disabled={isCloud} testId="activity-quality" />
          <NumberInput label="Heart Rate Avg (BPM)" value={local.heartRateAvg || 0} onChange={v => update('heartRateAvg', parseInt(v))} disabled={isCloud || isBle} testId="activity-hr" tone={isBle ? 'rust' : undefined} />
          <NumberInput label="Resting HR (BPM)" value={local.restingHR || 0} onChange={v => update('restingHR', parseInt(v))} disabled={isCloud} testId="activity-resting" />
          <NumberInput label="HRV (ms)" value={local.hrv || 0} onChange={v => update('hrv', parseInt(v))} disabled={isCloud} testId="activity-hrv" />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-muted">
            {isCloud ? 'Data auto-synced from connected device. Manual entry disabled.' : 'Enter your daily metrics manually.'}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || isCloud}
            className="px-6 py-2.5 rounded-full bg-teal text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-50 inline-flex items-center gap-2"
            data-testid="manual-submit"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Entry
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function NumberInput({ label, value, onChange, disabled, step = '1', testId, tone }) {
  return (
    <div className="space-y-2" data-testid={testId}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
        {tone === 'rust' && <span className="text-[10px] uppercase tracking-[0.2em] text-rust animate-pulse">BLE stream</span>}
      </div>
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        data-testid={`${testId}-input`}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink font-mono text-sm tabular-nums focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

function RatingInput({ label, value, onChange, disabled, testId }) {
  return (
    <div className="space-y-2" data-testid={testId}>
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            disabled={disabled}
            data-testid={`${testId}-${n}`}
            className={`w-9 h-9 rounded-full text-xs font-mono transition tabular-nums ${value === n ? 'bg-teal text-white scale-110' : 'bg-bg text-ink2 hover:text-ink border border-border'} ${disabled ? 'opacity-60' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
