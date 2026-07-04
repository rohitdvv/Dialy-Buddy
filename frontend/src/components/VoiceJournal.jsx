import React, { useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { Mic, Square, Loader2, Send, Lock, ArrowUp, Smile } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }
const fadeIn = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function VoiceJournal({ entries, onAdded, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState('')
  const [selected, setSelected] = useState(new Date().toDateString())
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('voice')
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

  const waveformBars = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5" data-testid="journal-view">
      <aside className="md:col-span-3">
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-[#DDD8CF]"><div className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">Journal history</div></div>
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            {dates.map(d => (
              <button key={d} data-testid={`journal-day-${d}`} onClick={() => setSelected(d)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selected === d ? 'bg-[#0B4F5C]/10 border border-[#0B4F5C]/25 text-[#161B2E]' : 'text-[#3D4556] hover:bg-[#F4F2ED]'}`}>
                <span className="text-sm">{isToday(d) ? 'Today' : d}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selected === d ? 'bg-[#0B4F5C] text-white' : 'bg-[#F4F2ED] text-[#3D4556]'}`}>{grouped[d].length}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="md:col-span-9 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl text-[#161B2E]">{isToday(selected) ? "Today's journal" : `Journal · ${selected}`}</h3>
            {stats && <p className="text-sm text-[#3D4556]">{stats.count} entries · stress <span className="font-mono text-[#161B2E] tabular-nums">{stats.avgStress}/10</span> · happiness <span className="font-mono text-[#161B2E] tabular-nums">{stats.happiness}%</span></p>}
          </div>
          <div className="flex items-center gap-2 bg-[#F9F7F2] border border-[#DDD8CF] rounded-[14px] px-4 py-2.5 focus-within:ring-[3px] focus-within:ring-[#0B4F5C]/15 focus-within:border-[#0B4F5C] transition">
            <ArrowUp className="w-4 h-4 text-[#8B92A5] shrink-0 rotate-45" />
            <input data-testid="journal-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="bg-transparent text-sm focus:outline-none placeholder-[#8B92A5] w-40 md:w-56 text-[#161B2E]" />
          </div>
        </div>

        {isToday(selected) && (
          <div className="card p-6">
            <div className="flex items-center gap-1 mb-4 bg-[#F9F7F2] rounded-full p-1 w-fit">
              <button onClick={() => setActiveTab('voice')} className={`px-4 py-1.5 rounded-full text-sm transition ${activeTab === 'voice' ? 'bg-white text-[#161B2E] shadow-sm border border-[#DDD8CF]' : 'text-[#3D4556] hover:text-[#161B2E]'}`}>Voice</button>
              <button onClick={() => setActiveTab('text')} className={`px-4 py-1.5 rounded-full text-sm transition ${activeTab === 'text' ? 'bg-white text-[#161B2E] shadow-sm border border-[#DDD8CF]' : 'text-[#3D4556] hover:text-[#161B2E]'}`}>Text</button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'voice' ? (
                <motion.div key="voice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#F9F7F2] border border-[#DDD8CF]">
                      <div className="relative">
                        {isRecording && (
                          <>
                            <span className="absolute inset-0 rounded-full bg-[#0B4F5C]/20" style={{ animation: 'pulse-ring 2.2s cubic-bezier(0,0,0.2,1) infinite' }} />
                            <span className="absolute inset-0 rounded-full bg-[#0B4F5C]/10" style={{ animation: 'pulse-ring 2.2s cubic-bezier(0,0,0.2,1) infinite', animationDelay: '0.6s' }} />
                          </>
                        )}
                        <button data-testid="journal-record-btn" onClick={isRecording ? stop : start} disabled={processing || disabled}
                          className={`relative w-28 h-28 rounded-full grid place-items-center transition ${disabled ? 'bg-[#8B92A5]' : isRecording ? 'bg-[#0B4F5C] shadow-xl' : 'bg-[#0B4F5C] shadow-lg hover:scale-105'} disabled:opacity-60`}>
                          {processing ? <Loader2 className="w-9 h-9 animate-spin text-white" /> : isRecording ? <Square className="w-9 h-9 text-white" /> : disabled ? <Lock className="w-9 h-9 text-white" /> : <Mic className="w-10 h-10 text-white" />}
                        </button>
                      </div>
                      <p className="mt-5 text-sm text-[#161B2E]">{disabled ? 'Upgrade to record' : isRecording ? 'Listening…' : processing ? 'Analyzing tone' : 'Tap to record'}</p>
                      <p className="text-[11px] text-[#8B92A5] mt-1 max-w-[220px]">Speak freely — tone-of-voice AI detects hidden stress.</p>

                      {isRecording && (
                        <div className="mt-6 flex items-end gap-1 h-10">
                          {waveformBars.map((_, i) => (
                            <motion.div key={i} className="w-1 rounded-full bg-[#0B4F5C]"
                              animate={{ height: [4, 16 + Math.random() * 20, 4] }}
                              transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center p-6 rounded-2xl bg-[#F9F7F2] border border-[#DDD8CF]">
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#8B92A5] mb-3">Transcription preview</div>
                      <div className="h-32 rounded-xl bg-white border border-[#DDD8CF] p-4 text-sm text-[#3D4556] overflow-y-auto">
                        {processing ? (
                          <div className="space-y-2">
                            <div className="shimmer h-3 w-3/4 rounded" />
                            <div className="shimmer h-3 w-1/2 rounded" />
                            <div className="shimmer h-3 w-5/6 rounded" />
                          </div>
                        ) : (
                          <span className="text-[#8B92A5] italic">{isRecording ? 'Listening…' : 'Your voice will appear here after recording.'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                  <div className="space-y-3">
                    <label className="text-[11px] uppercase tracking-[0.22em] text-[#8B92A5]">How are you feeling?</label>
                    <textarea data-testid="journal-text-input" value={text} onChange={e => setText(e.target.value)} rows={5}
                      placeholder="What's on your mind? Write freely — our AI will analyze tone, stress, and sentiment."
                      className="field resize-none" disabled={disabled} />
                    <div className="flex justify-between items-center">
                      {error && <div className="text-xs text-[#8B3D3D]" data-testid="journal-error">{error}</div>}
                      <button data-testid="journal-submit-btn" onClick={sendText} disabled={!text.trim() || processing || disabled} className="ml-auto btn-primary text-sm flex items-center gap-2">
                        <Send className="w-4 h-4" /> Analyze entry
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {stats && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Smile className="w-5 h-5 text-[#0B4F5C]" />
              <h4 className="font-display text-lg text-[#161B2E]">Day summary</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="font-display text-3xl text-[#161B2E]">{dayEntries[0]?.mood || '—'}</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#8B92A5] mt-1">Dominant mood</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#8B92A5]">Stress level</span>
                  <span className="font-mono text-xs text-[#161B2E] tabular-nums">{stats.avgStress}/10</span>
                </div>
                <div className="h-2 rounded-full bg-[#EFEAE0] overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #0B4F5C, #8B3D3D)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.avgStress / 10) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-3xl text-[#0B4F5C] tabular-nums">{stats.happiness}%</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#8B92A5] mt-1">Sentiment score</div>
                <div className="mt-2 flex justify-center gap-1 h-6 items-end">
                  {[0.3, 0.5, 0.7, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
                    <div key={i} className="w-1.5 rounded-full bg-[#0B4F5C]/30" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <motion.div className="space-y-4" data-testid="journal-entries" variants={container} initial="hidden" animate="show">
          <AnimatePresence>
            {dayEntries.length === 0 && (
              <motion.div key="empty" variants={itemUp} className="card p-10 text-center text-[#3D4556] text-sm">
                No entries for this day{search ? ' matching your search' : ''}.
              </motion.div>
            )}
            {dayEntries.map(e => (
              <motion.div key={e.id} variants={itemUp} layout className="card p-5" data-testid={`journal-entry-${e.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h5 className="font-display text-lg capitalize text-[#161B2E]">{e.mood}</h5>
                    <span className={`text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border ${e.stressLevel > 7 ? 'text-[#8B3D3D] border-[#8B3D3D]/30 bg-[#8B3D3D]/8' : e.stressLevel < 4 ? 'text-[#3D6B5A] border-[#3D6B5A]/30 bg-[#3D6B5A]/8' : 'text-[#B87333] border-[#B87333]/30 bg-[#B87333]/8'}`}>Stress {e.stressLevel}/10</span>
                  </div>
                  <span className="text-xs font-mono text-[#8B92A5] tabular-nums">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-sm text-[#3D4556] mt-3 leading-relaxed">&ldquo;{e.summary}&rdquo;</p>
                <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-[#DDD8CF]">
                  {(e.keyTopics || []).map((t,i) => <span key={i} className="text-[11px] text-[#3D4556] bg-[#F4F2ED] border border-[#DDD8CF] rounded-full px-2.5 py-1">#{t}</span>)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  )
}
