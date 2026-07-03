import React, { useEffect, useState } from 'react'
import { Watch, HeartPulse, Loader2, RefreshCw, Check } from 'lucide-react'
import { api } from '../lib/api.js'

// Icon per device. All are stylistic (no real brand logos required).
const DEVICE_ICON = {
  apple_watch: '🍎', fitbit: '⌚', google_fit: '🟢', garmin: '⛰', oura: '💍', whoop: '💪', polar_ble: '❤️',
}

const CLOUD_PROVIDERS = ['apple_watch', 'fitbit', 'google_fit', 'garmin', 'oura', 'whoop']

export default function DeviceManager({ connections, onConnect, onDisconnect, onResync, onBluetoothData }) {
  const [catalog, setCatalog] = useState([])
  const [connectingId, setConnectingId] = useState(null)

  useEffect(() => { api.get('/devices/catalog').then(({ data }) => setCatalog(data.devices)).catch(() => setCatalog([])) }, [])

  const isConnected = (id) => connections.some(c => c.id === id && c.status === 'CONNECTED')
  const conn = (id) => connections.find(c => c.id === id)

  const connectCloud = async (id, name) => {
    setConnectingId(id)
    try { await onConnect(id, name) } finally { setConnectingId(null) }
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
      // Persist device (no historical data available from BLE alone)
      await onConnect('polar_ble', device.name || 'HR Monitor')
    } catch { alert('Bluetooth pairing failed. Requires Chrome/Edge and a nearby BLE heart-rate monitor.') }
    finally { setConnectingId(null) }
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

      <div className="grid md:grid-cols-2 gap-3">
        {catalog.map(d => {
          const active = isConnected(d.id)
          const c = conn(d.id)
          const isBLE = d.type === 'BLUETOOTH'
          return (
            <div key={d.id} data-testid={`device-${d.id}`} className={`rounded-2xl border p-4 flex items-center justify-between transition ${active ? 'border-teal/30 bg-teal/5' : 'border-border bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl grid place-items-center text-lg ${active ? 'bg-teal text-white' : 'bg-bg text-ink2'}`}>
                  {isBLE ? <HeartPulse className="w-5 h-5" /> : (DEVICE_ICON[d.id] || <Watch className="w-5 h-5" />)}
                </div>
                <div>
                  <div className="font-medium text-ink">{d.name}</div>
                  <div className="text-[11px] text-muted">
                    {active
                      ? (isBLE ? 'Streaming live' : `${c?.records_synced || 30}d imported · ${c?.lastSync ? new Date(c.lastSync).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}`)
                      : (isBLE ? 'Web-Bluetooth · live HR only' : 'Cloud sync · steps · sleep · HR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {active && !isBLE && (
                  <button data-testid={`device-resync-${d.id}`} onClick={() => onResync(d.id)} className="w-9 h-9 rounded-full border border-border hover:bg-bg text-ink2 grid place-items-center" title="Re-sync">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  data-testid={`device-toggle-${d.id}`}
                  disabled={connectingId === d.id}
                  onClick={() => active ? onDisconnect(d.id) : (isBLE ? connectBLE() : connectCloud(d.id, d.name))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition disabled:opacity-70 min-w-[110px] ${
                    active ? 'bg-rust/10 border border-rust/30 text-rust hover:bg-rust/20' : 'bg-teal text-white hover:brightness-110'
                  }`}
                >
                  {connectingId === d.id ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing…</span>
                  ) : active ? 'Disconnect' : (
                    <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Connect</span>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
