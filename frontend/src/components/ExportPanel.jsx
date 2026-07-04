import React, { useEffect, useState } from 'react'
import { api, API_BASE } from '../lib/api.js'
import { FileJson, FileSpreadsheet, FileText, Download, Loader2, ShieldCheck, Activity, Apple, Mic, Watch, MessageCircle } from 'lucide-react'

const COLLECTIONS = [
  { key: 'activity', label: 'Activity', icon: Activity, endpoint: '/activity/history' },
  { key: 'nutrition', label: 'Nutrition', icon: Apple, endpoint: '/nutrition' },
  { key: 'journal', label: 'Journal', icon: Mic, endpoint: '/journal' },
  { key: 'devices', label: 'Devices', icon: Watch, endpoint: '/devices' },
  { key: 'chat', label: 'Chat', icon: MessageCircle, endpoint: '/chat' },
]

async function downloadAuthed(path, filename) {
  const token = localStorage.getItem('hg_token')
  const res = await fetch(`${API_BASE}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ExportPanel() {
  const [counts, setCounts] = useState(null)
  const [busy, setBusy] = useState('')
  const [csvCollection, setCsvCollection] = useState('activity')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const results = await Promise.all(COLLECTIONS.map(c => api.get(c.endpoint).catch(() => ({ data: [] }))))
        if (!alive) return
        const next = {}
        COLLECTIONS.forEach((c, i) => { next[c.key] = Array.isArray(results[i].data) ? results[i].data.length : 0 })
        setCounts(next)
      } catch { if (alive) setCounts({}) }
    })()
    return () => { alive = false }
  }, [])

  const stamp = new Date().toISOString().slice(0, 10)

  const run = async (id, path, filename) => {
    setBusy(id); setError('')
    try { await downloadAuthed(path, filename) }
    catch { setError('Could not generate that file. Please try again.') }
    finally { setBusy('') }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="export-view">
      {/* Summary of what's in the vault */}
      <div className="card p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" /> Your data vault
        </div>
        <h2 className="font-display font-display-title text-3xl md:text-4xl mt-2 leading-[1.05]">Everything you've logged,<br/>yours to take anywhere.</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {COLLECTIONS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="card-quiet p-4 text-center" data-testid={`export-count-${key}`}>
              <Icon className="w-4 h-4 text-teal mx-auto" />
              <div className="mt-2 font-mono text-2xl tabular text-ink">
                {counts ? (counts[key] ?? 0) : <span className="inline-block w-8 h-6 shimmer align-middle" />}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full export formats */}
      <div className="grid md:grid-cols-3 gap-4">
        <ExportCard
          testId="export-json"
          icon={FileJson}
          title="Full JSON"
          desc="Complete machine-readable bundle — activity, nutrition, journal, devices, and chat."
          action="Download .json"
          loading={busy === 'json'}
          onClick={() => run('json', '/export/all.json', `healthguard-export-${stamp}.json`)}
        />
        <ExportCard
          testId="export-pdf"
          icon={FileText}
          title="Formatted PDF"
          desc="A clean, printable wellness report with your trends, meals, and journal highlights."
          action="Download .pdf"
          loading={busy === 'pdf'}
          onClick={() => run('pdf', '/export/all.pdf', `healthguard-full-export-${stamp}.pdf`)}
        />
        <div className="card p-6 flex flex-col" data-testid="export-csv">
          <div className="w-10 h-10 rounded-2xl bg-teal/10 grid place-items-center"><FileSpreadsheet className="w-5 h-5 text-teal" /></div>
          <h3 className="font-display text-lg mt-4">CSV by dataset</h3>
          <p className="text-sm text-ink2 mt-1 flex-1">Spreadsheet-ready rows for a single dataset.</p>
          <label className="block mt-4">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-muted mb-1.5">Dataset</span>
            <select
              data-testid="export-csv-select"
              value={csvCollection}
              onChange={e => setCsvCollection(e.target.value)}
              className="field"
            >
              {COLLECTIONS.filter(c => ['activity', 'nutrition', 'journal'].includes(c.key)).map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <button
            data-testid="export-csv-btn"
            disabled={busy === 'csv'}
            onClick={() => run('csv', `/export/all.csv?collection=${csvCollection}`, `healthguard-${csvCollection}-${stamp}.csv`)}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {busy === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download .csv
          </button>
        </div>
      </div>

      {error && <div className="text-xs px-3 py-2.5 rounded-xl border border-rust/30 bg-rust/10 text-rust" data-testid="export-error">{error}</div>}

      <div className="card p-6 text-sm text-ink2">
        <h3 className="font-display text-lg text-ink">About your export</h3>
        <p className="mt-3">Exports include all data synced from your connected wearables — steps, sleep, heart rate, and calories — alongside everything you've logged manually. Your data is portable and never locked in.</p>
      </div>
    </div>
  )
}

function ExportCard({ testId, icon: Icon, title, desc, action, loading, onClick }) {
  return (
    <div className="card p-6 flex flex-col" data-testid={testId}>
      <div className="w-10 h-10 rounded-2xl bg-teal/10 grid place-items-center"><Icon className="w-5 h-5 text-teal" /></div>
      <h3 className="font-display text-lg mt-4">{title}</h3>
      <p className="text-sm text-ink2 mt-1 flex-1">{desc}</p>
      <button
        data-testid={`${testId}-btn`}
        disabled={loading}
        onClick={onClick}
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {action}
      </button>
    </div>
  )
}
