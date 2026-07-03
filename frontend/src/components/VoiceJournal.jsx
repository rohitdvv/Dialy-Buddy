import React, { useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { Mic, Square, Loader2, Search, Send } from 'lucide-react'

export default function VoiceJournal({ entries, onAdded }) {
  const [isRecording, setIsRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState('')
  const [selected, setSelected] = useState(new Date().toDateString())
  const [search, setSearch] = useState('')
  const rec = useRef(null)
  const chunks = useRef([])

  const grouped = useMemo(() => {
    const g = {}
    const today = new Date().toDateString()
    g[today] = []
    entries.forEach(e => {
      const k = e.timestamp ? new Date(e.timestamp).toDateString() : today
      if (!g[k]) g[k] = []
      g[k].push(e)
    })
    return g
  }, [entries])

  const dates = useMemo(() => Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)), [grouped])
  const isToday = (d) => d === new Date().toDateString()
  const dayEntries = (grouped[selected] || []).filter(e => !search || (e.summary || '').toLowerCase().includes(search.toLowerCase()) || (e.mood||'').toLowerCase().includes(search.toLowerCase()) || (e.keyTopics||[]).some(t => t.toLowerCase().includes(search.toLowerCase())))

  const stats = useMemo(() => {
    if (!dayEntries.length) return null
    const stress = dayEntries.reduce((s,e) => s + (e.stressLevel||0), 0) / dayEntries.length
    const sent = dayEntries.reduce((s,e) => s + (e.sentimentScore||0), 0) / dayEntries.length
    return { avgStress: Math.round(stress * 10) / 10, happiness: Math.round(((sent + 1)/2) * 100), count: dayEntries.length }
  }, [dayEntries])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      rec.current = new MediaRecorder(stream)
      chunks.current = []
      rec.current.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data)
      rec.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        await sendAudio(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      rec.current.start()
      setIsRecording(true)
    } catch { alert('Microphone denied. Use text input instead.') }
  }

  const stop = () => { if (rec.current && isRecording) { rec.current.stop(); setIsRecording(false) } }

  const sendAudio = async (blob) => {
    setProcessing(true)
    try {
      const fd = new FormData(); fd.append('file', blob, 'voice.webm')
      const { data } = await api.post('/journal/analyze-audio', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onAdded(data)
      setSelected(new Date().toDateString())
    } catch { alert('Failed to analyze voice.') } finally { setProcessing(false) }
  }

  const sendText = async () => {
    if (!text.trim()) return
    setProcessing(true)
    try {
      const { data } = await api.post('/journal/analyze-text', { text })
      onAdded(data); setText(''); setSelected(new Date().toDateString())
    } catch { alert('Failed to analyze entry.') } finally { setProcessing(false) }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" data-testid="journal-view">
      <aside className="md:col-span-3">
        <div className="glass rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5"><div className="text-[10px] uppercase tracking-[0.25em] text-muted">Journal history</div></div>
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            {dates.map(d => (
              <button key={d} data-testid={`journal-day-${d}`} onClick={() => setSelected(d)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selected === d ? 'bg-terracotta/10 border border-terracotta/30 text-ink' : 'text-muted hover:bg-white/5'}`}>
                <span className="text-sm">{isToday(d) ? 'Today' : d}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selected === d ? 'bg-terracotta text-bg' : 'bg-white/5 text-muted'}`}>{grouped[d].length}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="md:col-span-9 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">{isToday(selected) ? "Today's journal" : `Journal · ${selected}`}</h3>
            {stats && <p className="text-sm text-muted">{stats.count} entries · avg stress <span className="font-mono text-ink">{stats.avgStress}/10</span> · happiness <span className="font-mono text-ink">{stats.happiness}%</span></p>}
          </div>
          <label className="glass rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2 border-white/10">
            <Search className="w-4 h-4 text-muted" />
            <input data-testid="journal-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mood, topic" className="bg-transparent text-sm focus:outline-none placeholder-muted w-40 md:w-56" />
          </label>
        </div>

        {isToday(selected) && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 glass rounded-3xl p-6 flex flex-col items-center justify-center text-center">
              <button data-testid="journal-record-btn" onClick={isRecording ? stop : start} disabled={processing} className={`w-24 h-24 rounded-full grid place-items-center transition ${isRecording ? 'bg-rose shadow-[0_0_0_10px_rgba(185,109,113,0.15)]' : 'bg-terracotta shadow-glow-terracotta hover:scale-105'} disabled:opacity-60`}>
                {processing ? <Loader2 className="w-8 h-8 animate-spin text-bg" /> : isRecording ? <Square className="w-8 h-8 text-bg" /> : <Mic className="w-9 h-9 text-bg" />}
              </button>
              <p className="mt-4 text-sm">{isRecording ? 'Listening…' : processing ? 'Analyzing tone' : 'Tap to record'}</p>
              <p className="text-[11px] text-muted mt-1">Speak freely — tone-of-voice AI detects hidden stress.</p>
            </div>
            <div className="md:col-span-3 glass rounded-3xl p-6" data-testid="journal-text-area">
              <label className="text-[11px] uppercase tracking-[0.22em] text-muted">Or type</label>
              <textarea data-testid="journal-text-input" value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="How are you feeling right now? What's on your mind?" className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-terracotta placeholder-muted" />
              <div className="flex justify-end mt-3">
                <button data-testid="journal-submit-btn" onClick={sendText} disabled={!text.trim() || processing} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta text-bg text-sm font-medium hover:brightness-110 disabled:opacity-50"><Send className="w-4 h-4" /> Analyze entry</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4" data-testid="journal-entries">
          {dayEntries.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-muted text-sm">No entries for this day{search ? ' matching your search' : ''}.</div>
          )}
          {dayEntries.map(e => (
            <div key={e.id} className="glass rounded-3xl p-5" data-testid={`journal-entry-${e.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h5 className="font-display text-lg capitalize">{e.mood}</h5>
                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full border ${e.stressLevel > 7 ? 'text-rose border-rose/40 bg-rose/10' : e.stressLevel < 4 ? 'text-sage border-sage/40 bg-sage/10' : 'text-gold border-gold/40 bg-gold/10'}`}>Stress {e.stressLevel}/10</span>
                </div>
                <span className="text-xs font-mono text-muted">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-sm text-muted mt-3 leading-relaxed">"{e.summary}"</p>
              <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                {(e.keyTopics || []).map((t,i) => <span key={i} className="text-[11px] text-muted bg-white/5 border border-white/5 rounded-full px-2 py-0.5">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
