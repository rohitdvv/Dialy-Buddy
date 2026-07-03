import React, { useState } from 'react'
import { Watch, HeartPulse, X, Loader2 } from 'lucide-react'

export default function DeviceManager({ connections, onConnect, onDisconnect, onBluetoothData }) {
  const [loading, setLoading] = useState(null)
  const [appleModal, setAppleModal] = useState(false)
  const [appleStatus, setAppleStatus] = useState('SCANNING')

  const isConnected = (id) => connections.some(c => c.id === id && c.status === 'CONNECTED')

  const connectCloud = (name, id) => {
    setLoading(id)
    setTimeout(() => {
      onConnect({ id, name, type: 'CLOUD', status: 'CONNECTED', lastSync: new Date().toLocaleTimeString() })
      setLoading(null)
    }, 1400)
  }

  const startApple = () => { setAppleModal(true); setAppleStatus('SCANNING'); setTimeout(() => setAppleStatus('FOUND'), 2200) }
  const selectApple = (name) => {
    setAppleStatus('SYNCING')
    setTimeout(() => {
      onConnect({ id: 'apple_watch', name, type: 'CLOUD', status: 'CONNECTED', lastSync: 'just now' })
      setAppleModal(false)
    }, 1800)
  }

  const connectBLE = async () => {
    setLoading('ble_hr')
    try {
      // eslint-disable-next-line no-undef
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const ch = await service.getCharacteristic('heart_rate_measurement')
      await ch.startNotifications()
      ch.addEventListener('characteristicvaluechanged', (e) => {
        const v = e.target.value; const flags = v.getUint8(0)
        const hr = (flags & 0x01) === 0 ? v.getUint8(1) : v.getUint16(1, true)
        if (onBluetoothData) onBluetoothData(hr)
      })
      onConnect({ id: 'ble_hr', name: device.name || 'HR Monitor', type: 'BLUETOOTH', status: 'CONNECTED', lastSync: 'Live stream' })
    } catch { alert('Bluetooth pairing failed. Requires Chrome/Edge + BLE HR monitor.') } finally { setLoading(null) }
  }

  const devices = [
    { id: 'apple_watch', name: 'Apple Watch', desc: 'HealthKit activity + sleep', tone: 'ink', action: startApple },
    { id: 'fitbit', name: 'Fitbit', desc: 'Steps, sleep, active zone', tone: 'terracotta', action: () => connectCloud('Fitbit', 'fitbit') },
    { id: 'gfit', name: 'Google Fit', desc: 'Activity + wellbeing', tone: 'gold', action: () => connectCloud('Google Fit', 'gfit') },
    { id: 'ble_hr', name: 'HR Monitor (BLE)', desc: 'Web Bluetooth heart rate', tone: 'rose', action: connectBLE, icon: HeartPulse },
  ]

  return (
    <div className="glass rounded-3xl p-6" data-testid="devices-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl">Connected Devices</h3>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Wearables & sensors</span>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {devices.map(d => {
          const active = isConnected(d.id)
          const Icon = d.icon || Watch
          return (
            <div key={d.id} data-testid={`device-${d.id}`} className={`rounded-2xl border transition p-4 flex items-center justify-between ${active ? 'border-terracotta/30 bg-terracotta/5' : 'border-white/10 bg-white/2'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl grid place-items-center bg-${d.tone}/10 border border-${d.tone}/20`}>
                  <Icon className={`w-5 h-5 text-${d.tone}`} />
                </div>
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-[11px] text-muted">{active ? 'Streaming…' : d.desc}</div>
                </div>
              </div>
              <button
                data-testid={`device-toggle-${d.id}`}
                disabled={loading === d.id}
                onClick={() => active ? onDisconnect(d.id) : d.action()}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  active ? 'bg-rose/15 border border-rose/40 text-rose hover:bg-rose/25' : 'bg-terracotta text-bg hover:brightness-110'
                }`}
              >
                {loading === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : active ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          )
        })}
      </div>

      {appleModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm" data-testid="apple-modal">
          <div className="w-full max-w-sm glass rounded-3xl p-6 relative">
            <button data-testid="apple-modal-close" onClick={() => setAppleModal(false)} className="absolute top-4 right-4 text-muted hover:text-ink"><X className="w-5 h-5" /></button>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto bg-ink/10 border border-white/10 grid place-items-center"><Watch className="w-7 h-7 text-ink" /></div>
              <h4 className="mt-3 font-display text-lg">{appleStatus === 'SCANNING' ? 'Searching…' : appleStatus === 'FOUND' ? 'Select device' : 'Importing HealthKit'}</h4>
              <p className="text-xs text-muted">{appleStatus === 'SYNCING' ? 'HeartRate · SleepAnalysis · Workouts' : 'Bring your watch nearby'}</p>
            </div>
            <div className="mt-6 min-h-[160px] flex flex-col justify-center">
              {appleStatus === 'SCANNING' && (
                <div className="grid place-items-center">
                  <div className="w-20 h-20 rounded-full border border-white/10 relative">
                    <span className="absolute inset-0 rounded-full border border-terracotta/40 pulse-ring" />
                  </div>
                </div>
              )}
              {appleStatus === 'FOUND' && (
                <div className="space-y-2">
                  {['Apple Watch Series 9', 'Apple Watch Ultra 2'].map(n => (
                    <button key={n} data-testid={`apple-select-${n}`} onClick={() => selectApple(n)} className="w-full text-left px-4 py-3 rounded-xl border border-white/10 hover:border-terracotta/40 hover:bg-terracotta/5">{n}</button>
                  ))}
                </div>
              )}
              {appleStatus === 'SYNCING' && (
                <div className="grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-terracotta" /></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
