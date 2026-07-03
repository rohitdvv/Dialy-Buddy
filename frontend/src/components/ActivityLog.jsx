import React, { useEffect, useState } from 'react'
import DeviceManager from './DeviceManager.jsx'

export default function ActivityLog({ data, devices, onUpdate, onConnect, onDisconnect, onResync, onBluetoothData }) {
  const [local, setLocal] = useState(data || {})
  useEffect(() => { setLocal(data || {}) }, [data])

  const cloud = devices.some(d => d.status === 'CONNECTED' && d.type !== 'BLUETOOTH')
  const ble = devices.some(d => d.status === 'CONNECTED' && d.type === 'BLUETOOTH')

  const update = (k, v) => { const next = { ...local, [k]: v }; setLocal(next); onUpdate(next) }

  return (
    <div className="space-y-5" data-testid="activity-view">
      <DeviceManager connections={devices} onConnect={onConnect} onDisconnect={onDisconnect} onResync={onResync} onBluetoothData={onBluetoothData} />

      <div className="card p-6 relative">
        {cloud && <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.2em] text-teal">Auto-synced from wearable</div>}
        <h3 className="font-display text-xl mb-6">Manual Log</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <Slider label="Daily Steps" min={0} max={20000} step={100} value={local.steps || 0} onChange={v => update('steps', v)} disabled={cloud} testId="activity-steps" liveLabel={cloud ? 'Live sync' : ''} />
          <Slider label="Heart Rate (BPM)" min={40} max={180} step={1} value={local.heartRateAvg || 0} onChange={v => update('heartRateAvg', v)} disabled={ble || cloud} testId="activity-hr" liveLabel={ble ? 'BLE stream' : cloud ? 'Live sync' : ''} tone={ble ? 'rust' : undefined} />
          <Stepper label="Sleep (hrs)" value={local.sleepHours || 0} min={0} max={16} step={0.5} onChange={v => update('sleepHours', v)} disabled={cloud} testId="activity-sleep" />
          <Rating label="Sleep Quality" value={local.sleepQuality || 5} onChange={v => update('sleepQuality', v)} disabled={cloud} testId="activity-quality" />
        </div>
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange, disabled, tone, liveLabel, testId }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
        {liveLabel && <span className={`text-[10px] uppercase tracking-[0.2em] ${tone === 'rust' ? 'text-rust' : 'text-teal'} animate-pulse`}>{liveLabel}</span>}
      </div>
      <div className="flex items-center gap-3">
        <input data-testid={`${testId}-slider`} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} disabled={disabled} className="flex-1" />
        <span className="font-mono text-lg w-24 text-right tabular text-ink" data-testid={`${testId}-value`}>{value}</span>
      </div>
    </div>
  )
}

function Stepper({ label, value, onChange, min=0, max=16, step=0.5, disabled, testId }) {
  return (
    <div className="space-y-2">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <div className="flex items-center gap-6">
        <button disabled={disabled} onClick={() => onChange(Math.max(min, value - step))} data-testid={`${testId}-minus`} className="w-10 h-10 rounded-full border border-border hover:bg-bg disabled:opacity-40">−</button>
        <span className="flex-1 text-center font-mono text-3xl tabular" data-testid={`${testId}-value`}>{value}</span>
        <button disabled={disabled} onClick={() => onChange(Math.min(max, value + step))} data-testid={`${testId}-plus`} className="w-10 h-10 rounded-full border border-border hover:bg-bg disabled:opacity-40">+</button>
      </div>
    </div>
  )
}

function Rating({ label, value, onChange, disabled, testId }) {
  return (
    <div className="space-y-2">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onChange(n)} disabled={disabled} data-testid={`${testId}-${n}`}
            className={`w-9 h-9 rounded-full text-xs font-mono transition tabular ${value === n ? 'bg-teal text-white scale-110' : 'bg-bg text-ink2 hover:text-ink border border-border'} ${disabled ? 'opacity-60' : ''}`}
          >{n}</button>
        ))}
      </div>
    </div>
  )
}
