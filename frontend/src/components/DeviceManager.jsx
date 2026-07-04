import React, { useEffect, useState } from 'react'
import { Watch, Activity, Mountain, CircleDot, Dumbbell, HeartPulse, RefreshCw, Loader2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { api } from '../lib/api.js'

const DEVICE_ICON = {
  apple_watch: Watch,
  fitbit: Watch,
  google_fit: Activity,
  garmin: Mountain,
  oura: CircleDot,
  whoop: Dumbbell,
  polar_ble: HeartPulse,
}

const CLOUD_PROVIDERS = ['apple_watch', 'fitbit', 'google_fit', 'garmin', 'oura', 'whoop']

const INITIAL_HISTORY = [
  { id: 'init-1', event: 'Apple Watch connected', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'init-2', event: 'Fitbit disconnected', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'init-3', event: 'Garmin connected', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'init-4', event: 'Oura connected', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'init-5', event: 'Whoop connected', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
]

export default function DeviceManager({ connections, onConnect, onDisconnect, onResync, onBluetoothData }) {
  const [catalog, setCatalog] = useState([])
  const [connectingId, setConnectingId] = useState(null)
  const [history, setHistory] = useState(INITIAL_HISTORY)

  useEffect(() => { api.get('/devices/catalog').then(({ data }) => setCatalog(data.devices)).catch(() => setCatalog([])) }, [])

  const isConnected = (id) => connections.some(c => c.id === id && c.status === 'CONNECTED')
  const conn = (id) => connections.find(c => c.id === id)

  const addHistory = (event) => {
    setHistory(prev => [{ id: `evt-${Date.now()}`, event, timestamp: new Date().toISOString() }, ...prev].slice(0, 5))
  }

  const connectCloud = async (id, name) => {
    setConnectingId(id)
    try { await onConnect(id, name); addHistory(`${name} connected`) } finally { setConnectingId(null) }
  }

  const disconnectDevice = async (id, name) => {
    await onDisconnect(id)
    addHistory(`${name} disconnected`)
  }

  const connectBLE = async () => {
    setConnectingId('polar_ble')
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const ch = await service.getCharacteristic('heart_rate_measurement')
      await ch.startNotifications()
      ch.addEventListener('characteristicvaluechanged', (e) => {
        const v = e.target.value; const flags = v.getUint8(0)
        const hr = (flags & 0x01) === 0 ? v.getUint8(1) : v.getUint16(1, true)
        onBluetoothData && onBluetoothData(hr)
      })
      await onConnect('polar_ble', device.name || 'HR Monitor')
      addHistory(`${device.name || 'HR Monitor'} connected via Bluetooth`)
    } catch { alert('Bluetooth pairing failed. Requires Chrome/Edge and a nearby BLE heart-rate monitor.') }
    finally { setConnectingId(null) }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="card p-6" data-testid="devices-panel">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl">Connected Devices</h3>
          <p className="text-xs text-muted">Real-time & historical sync from your wearables</p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted">40+ integrations via Terra</span>
      </div>

      <motion.div
        className="grid md:grid-cols-2 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {catalog.map(d => {
          const active = isConnected(d.id)
          const c = conn(d.id)
          const isBLE = d.type === 'BLUETOOTH'
          const Icon = DEVICE_ICON[d.id] || Watch
          return (
            <motion.div
              key={d.id}
              data-testid={`device-${d.id}`}
              variants={cardVariants}
              className={`rounded-2xl border p-4 flex items-center justify-between transition-all duration-300 ${
                active ? 'border-l-[3px] border-l-teal bg-teal/[0.04] border-border' : 'bg-white border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full grid place-items-center text-lg transition-colors duration-300 ${active ? 'bg-teal text-white' : 'bg-bg text-ink2'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-ink text-sm">{d.name}</div>
                  <div className="text-[11px] text-muted">
                    {active
                      ? (isBLE ? 'Streaming live · Bluetooth LE' : `${c?.records_synced || 30}d imported · ${c?.lastSync ? formatTime(c.lastSync) : ''}`)
                      : (isBLE ? 'Web-Bluetooth · live HR only' : 'Cloud sync · steps · sleep · HR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {active && !isBLE && (
                  <button
                    data-testid={`device-resync-${d.id}`}
                    onClick={() => onResync(d.id)}
                    className="w-9 h-9 rounded-full border border-border hover:bg-bg text-ink2 grid place-items-center transition-colors"
                    title="Re-sync"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  data-testid={`device-toggle-${d.id}`}
                  disabled={connectingId === d.id}
                  onClick={() => active ? disconnectDevice(d.id, d.name) : (isBLE ? connectBLE() : connectCloud(d.id, d.name))}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 disabled:opacity-70 min-w-[110px] ${
                    active
                      ? 'bg-rust/10 border border-rust/30 text-rust hover:bg-rust/20'
                      : 'bg-teal text-white hover:brightness-110'
                  }`}
                >
                  {connectingId === d.id ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing…</span>
                  ) : active ? 'Disconnect' : (
                    <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Connect</span>
                  )}
                </button>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="mt-6">
        <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted mb-3">Connection History</h4>
        <div className="space-y-2">
          {history.map((evt) => (
            <div key={evt.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-xl bg-bg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-ink2 text-xs">{evt.event}</span>
              </div>
              <span className="font-mono text-[10px] text-muted tabular-nums">{formatDate(evt.timestamp)} · {formatTime(evt.timestamp)}</span>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-xs text-muted py-2">No connection events yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
