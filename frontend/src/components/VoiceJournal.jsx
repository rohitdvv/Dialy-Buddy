import React, { useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { Mic, Square, Loader2, Search, Send, Lock } from 'lucide-react'

export default function VoiceJournal({ entries, onAdded, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState('')
  const [selected, setSelected] = useState(new Date().toDateString())
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const rec = useRef(null); const chunks = useRef([])

  const grouped = useMemo(() => {
    const g = {}; const today = new Date().toDateString(); g[today] = []
    entries.forEach(e => { const k = e.timestamp ? new Date(e.timestamp).toDateString() : today
      if (!g[k]) g[k] = []; g[k].push(e) })
    return g
  }, [entries])
  const dates = useMemo(() => Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)), [grouped])
  const isToday = (d) => d === new Date().toDateString()
  const dayEntries = (grouped[selected] || []).filter(e => !search || (e.summary||'').toLowerCase().includes(search.toLowerCase()) || (e.mood||'').toLowerCase().includes(search.toLowerCase()) || (e.keyTopics||[]).some(t => t.toLowerCase().includes(search.toLowerCase())))

  const stats = useMemo(() => {
    if (!dayEntries.length) return null
    const s = dayEntries.reduce((a,e) => a+(e.stressLevel||0), 0) / dayEntries.length
    const sent = dayEntries.reduce((a,e) => a+(e.sentimentScore||0), 0) / dayEntries.length
    return { avgStress: Math.round(s * 10) / 10, happiness: Math.round(((sent + 1)/2) * 100), count: dayEntries.length }
  }, [dayEntries])

  const start = async () => {
    if (disabled) { setError('Your trial has ended. Upgrade to record.'); return }
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      rec.current = new MediaRecorder(stream); chunks.current = []
      rec.current.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data)
      rec.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        await sendAudio(blob); stream.getTracks().forEach(t => t.stop())
      }
      rec.current.start(); setIsRecording(true)
    } catch { setError('Microphone denied. Use text input instead.') }
  }
  const stop = () => { if (rec.current && isRecording) { rec.current.stop(); setIsRecording(false) } }

  const sendAudio = async (blob) => {
    setProcessing(true)
    try {
      const fd = new FormData(); fd.append('file', blob, 'voice.webm')
      const { data } = await api.post('/journal/analyze-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onAdded(data); setSelected(new Date().toDateString())
    } catch { setError('Failed to analyze voice.') } finally { setProcessing(false) }
  }
  const sendText = async () => {
    if (disabled) { setError('Your trial has ended.'); return }
    if (!text.trim()) return
    setProcessing(true); setError('')
    try {
      const { data } = await api.post('/journal/analyze-text', { text })
      onAdded(data); setText(''); setSelected(new Date().toDateString())
    } catch { setError('Failed to analyze entry.') } finally { setProcessing(false) }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5" data-testid="journal-view">
      <aside className="md:col-span-3">
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-border"><div className="text-[10px] uppercase tracking-[0.25em] text-muted">Journal history</div></div>
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            {dates.map(d => (
              <button key={d} data-testid={`journal-day-${d}`} onClick={() => setSelected(d)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selected === d ? 'bg-teal/10 border border-teal/25 text-ink' : 'text-ink2 hover:bg-bg'}`}>
                <span className="text-sm">{isToday(d) ? 'Today' : d}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selected === d ? 'bg-teal text-white' : 'bg-bg text-ink2'}`}>{grouped[d].length}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="md:col-span-9 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">{isToday(selected) ? "Today's journal" : `Journal · ${selected}`}</h3>
            {stats && <p className="text-sm text-ink2">{stats.count} entries · stress <span className="font-mono text-ink tabular">{stats.avgStress}/10</span> · happiness <span className="font-mono text-ink tabular">{stats.happiness}%</span></p>}
          </div>
          <label className="bg-white border border-border rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted" />
            <input data-testid="journal-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="bg-transparent text-sm focus:outline-none placeholder-muted w-40 md:w-56" />
          </label>
        </div>

        {isToday(selected) && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 card p-6 flex flex-col items-center justify-center text-center">
              <div className="relative">
                {isRecording && <span className="absolute inset-0 rounded-full bg-rust/25 pulse-ring" />}
                <button data-testid="journal-record-btn" onClick={isRecording ? stop : start} disabled={processing || disabled}
                  className={`relative w-24 h-24 rounded-full grid place-items-center transition ${disabled ? 'bg-muted' : isRecording ? 'bg-rust shadow-lg' : 'bg-teal shadow-lg hover:scale-105'} disabled:opacity-60`}>
                  {processing ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : isRecording ? <Square className="w-8 h-8 text-white" /> : disabled ? <Lock className="w-8 h-8 text-white" /> : <Mic className="w-9 h-9 text-white" />}
                </button>
              </div>
              <p className="mt-4 text-sm text-ink">{disabled ? 'Upgrade to record' : isRecording ? 'Listening…' : processing ? 'Analyzing tone' : 'Tap to record'}</p>
              <p className="text-[11px] text-muted mt-1 max-w-[220px]">Speak freely — tone-of-voice AI detects hidden stress.</p>
            </div>
            <div className="md:col-span-3 card p-6" data-testid="journal-text-area">
              <label className="text-[11px] uppercase tracking-[0.22em] text-muted">Or type</label>
              <textarea data-testid="journal-text-input" value={text} onChange={e => setText(e.target.value)} rows={4}
                placeholder="How are you feeling right now? What's on your mind?"
                className="field mt-2 resize-none" disabled={disabled} />
              <div className="flex justify-between items-center mt-3">
                {error && <div className="text-xs text-rust" data-testid="journal-error">{error}</div>}
                <button data-testid="journal-submit-btn" onClick={sendText} disabled={!text.trim() || processing || disabled} className="ml-auto btn-primary text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" /> Analyze entry
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4" data-testid="journal-entries">
          {dayEntries.length === 0 && (
            <div className="card p-10 text-center text-ink2 text-sm">No entries for this day{search ? ' matching your search' : ''}.</div>
          )}
          {dayEntries.map(e => (
            <div key={e.id} className="card p-5 fade-up" data-testid={`journal-entry-${e.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h5 className="font-display text-lg capitalize">{e.mood}</h5>
                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full border ${e.stressLevel > 7 ? 'text-rust border-rust/30 bg-rust/8' : e.stressLevel < 4 ? 'text-moss border-moss/30 bg-moss/8' : 'text-copper border-copper/30 bg-copper/8'}`}>Stress {e.stressLevel}/10</span>
                </div>
                <span className="text-xs font-mono text-muted">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-sm text-ink2 mt-3 leading-relaxed">&ldquo;{e.summary}&rdquo;</p>
              <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-border">
                {(e.keyTopics || []).map((t,i) => <span key={i} className="text-[11px] text-ink2 bg-bg border border-border rounded-full px-2 py-0.5">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
