import React, { useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { Loader2, Search, Trash2, ImageIcon, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const itemUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }

export default function NutritionTracker({ entries, onAdded, onRefresh, disabled }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString())
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const grouped = useMemo(() => {
    const g = {}; const today = new Date().toDateString(); g[today] = []
    entries.forEach(e => { const k = e.timestamp ? new Date(e.timestamp).toDateString() : today
      if (!g[k]) g[k] = []; g[k].push(e) })
    return g
  }, [entries])

  const dates = useMemo(() => Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)), [grouped])
  const isToday = (d) => d === new Date().toDateString()
  const dayEntries = (grouped[selectedDate] || []).filter(e => !search || e.foodName?.toLowerCase().includes(search.toLowerCase()))
  const totalCal = dayEntries.reduce((s,e) => s + (e.calories || 0), 0)

  const upload = async (file) => {
    if (disabled) { setError('Your trial has ended. Please upgrade to log meals.'); return }
    setError(''); setAnalyzing(true)
    const reader = new FileReader(); reader.readAsDataURL(file); reader.onloadend = () => setPreview(reader.result)
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await api.post('/nutrition/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onAdded(data); setPreview(null); setSelectedDate(new Date().toDateString())
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to analyze image. Please try a clearer photo.'
      setError(typeof msg === 'string' ? msg : 'Failed to analyze image.'); setPreview(null)
    } finally { setAnalyzing(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this entry?')) return
    try { await api.delete(`/nutrition/${id}`); onRefresh() } catch (e) { void e }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5" data-testid="nutrition-view">
      <aside className="md:col-span-3">
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-4 border-b border-[#DDD8CF]">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">Meal history</div>
          </div>
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            {dates.map(d => (
              <button key={d} data-testid={`nutrition-day-${d}`} onClick={() => setSelectedDate(d)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selectedDate === d ? 'bg-[#0B4F5C]/10 border border-[#0B4F5C]/25 text-[#161B2E]' : 'text-[#3D4556] hover:bg-[#F4F2ED]'}`}>
                <span className="text-sm">{isToday(d) ? 'Today' : d}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selectedDate === d ? 'bg-[#0B4F5C] text-white' : 'bg-[#F4F2ED] text-[#3D4556]'}`}>{grouped[d].length}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="md:col-span-9 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl text-[#161B2E]">{isToday(selectedDate) ? "Today's meals" : `Meals · ${selectedDate}`}</h3>
            <p className="text-sm text-[#3D4556]">Total intake · <span className="font-mono text-[#161B2E] tabular-nums">{Math.round(totalCal)} kcal</span></p>
          </div>
          <div className="flex items-center gap-2 bg-[#F9F7F2] border border-[#DDD8CF] rounded-[14px] px-4 py-2.5 focus-within:ring-[3px] focus-within:ring-[#0B4F5C]/15 focus-within:border-[#0B4F5C] transition">
            <Search className="w-4 h-4 text-[#8B92A5] shrink-0" />
            <input data-testid="nutrition-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals" className="bg-transparent text-sm focus:outline-none placeholder-[#8B92A5] w-40 md:w-56 text-[#161B2E]" />
          </div>
        </div>

        {isToday(selectedDate) && (
          <div className="card p-6" data-testid="nutrition-upload">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-lg text-[#161B2E]">Analyze a meal</h4>
              {disabled && <span className="text-[10px] uppercase tracking-[0.22em] text-[#8B3D3D] flex items-center gap-1"><Lock className="w-3 h-3" /> Upgrade to unlock</span>}
            </div>
            <label className={`block relative rounded-2xl border-2 border-dashed cursor-pointer p-8 text-center transition ${disabled ? 'opacity-60 cursor-not-allowed border-[#DDD8CF]' : 'border-[#DDD8CF] hover:border-[#0B4F5C] hover:bg-[#F9F7F2]'}`}>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview" className="mx-auto max-h-56 rounded-xl object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 grid place-items-center bg-white/85 rounded-xl">
                      <div className="flex items-center gap-2 text-[#161B2E] text-sm"><Loader2 className="w-4 h-4 animate-spin text-[#0B4F5C]" /> Analyzing with Gemini…</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#0B4F5C]/10 border border-[#0B4F5C]/20 grid place-items-center mx-auto mb-3"><ImageIcon className="w-6 h-6 text-[#0B4F5C]" /></div>
                  <p className="font-display text-sm text-[#161B2E]">Drop or tap to upload</p>
                  <p className="text-xs text-[#8B92A5] mt-1">Gemini estimates calories, macros, and healthiness</p>
                </>
              )}
              <input data-testid="nutrition-file-input" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" disabled={disabled || analyzing} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
            </label>
            {error && <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} className="mt-3 text-xs px-3 py-2 rounded-xl border border-[#8B3D3D]/30 bg-[#8B3D3D]/8 text-[#8B3D3D]" data-testid="nutrition-error">{error}</motion.div>}
          </div>
        )}

        <motion.div className="grid grid-cols-1 gap-4" data-testid="nutrition-entries" variants={container} initial="hidden" animate="show">
          <AnimatePresence>
            {dayEntries.length === 0 && (
              <motion.div key="empty" variants={itemUp} className="card p-10 text-center text-[#3D4556] text-sm">
                No meals for this day{search ? ' matching your search' : ''}.
              </motion.div>
            )}
            {dayEntries.map((e) => (
              <motion.div key={e.id} variants={itemUp} layout className="card p-5 flex flex-col md:flex-row md:items-center gap-4" data-testid={`nutrition-entry-${e.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="font-medium text-base capitalize truncate text-[#161B2E]">{e.foodName}</h5>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] border ${e.healthScore > 80 ? 'bg-[#3D6B5A]/10 text-[#3D6B5A] border-[#3D6B5A]/30' : e.healthScore > 50 ? 'bg-[#C8A040]/10 text-[#C8A040] border-[#C8A040]/30' : 'bg-[#8B3D3D]/10 text-[#8B3D3D] border-[#8B3D3D]/30'}`}>
                      {Math.round(e.healthScore)}/100
                    </div>
                  </div>
                  <p className="text-sm text-[#3D4556] mt-2 italic leading-relaxed">&ldquo;{e.analysis}&rdquo;</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono text-[#3D4556] tabular-nums">
                    <Metric dot="bg-[#0B4F5C]" label="kcal" value={Math.round(e.calories)} />
                    <Metric dot="bg-[#8B3D3D]" label="P" value={`${Math.round(e.protein)}g`} />
                    <Metric dot="bg-[#B87333]" label="C" value={`${Math.round(e.carbs)}g`} />
                    <Metric dot="bg-[#3D6B5A]" label="F" value={`${Math.round(e.fat)}g`} />
                    <span className="ml-auto text-[#8B92A5]">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                <button data-testid={`nutrition-delete-${e.id}`} onClick={() => remove(e.id)} className="text-[#8B92A5] hover:text-[#8B3D3D] p-2 transition"><Trash2 className="w-4 h-4" /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  )
}

function Metric({ dot, label, value }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dot}`} /> <span className="text-[#0B4F5C]">{value}</span> <span className="text-[#8B92A5]">{label}</span></span>
}
