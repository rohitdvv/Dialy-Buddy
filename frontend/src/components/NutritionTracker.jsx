import React, { useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { Camera, Loader2, Search, Trash2, ImageIcon } from 'lucide-react'

export default function NutritionTracker({ entries, onAdded, onRefresh }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString())
  const [search, setSearch] = useState('')

  const grouped = useMemo(() => {
    const groups = {}
    const today = new Date().toDateString()
    groups[today] = []
    entries.forEach(e => {
      const key = e.timestamp ? new Date(e.timestamp).toDateString() : today
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    return groups
  }, [entries])

  const dates = useMemo(() => Object.keys(grouped).sort((a,b) => new Date(b) - new Date(a)), [grouped])
  const isToday = (d) => d === new Date().toDateString()

  const dayEntries = (grouped[selectedDate] || []).filter(e => !search || e.foodName?.toLowerCase().includes(search.toLowerCase()))
  const totalCal = dayEntries.reduce((s,e) => s + (e.calories || 0), 0)

  const upload = async (file) => {
    setAnalyzing(true)
    const reader = new FileReader()
    reader.readAsDataURL(file); reader.onloadend = () => setPreview(reader.result)
    try {
      const fd = new FormData(); fd.append('file', file)
      const { data } = await api.post('/nutrition/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onAdded(data)
      setPreview(null)
      setSelectedDate(new Date().toDateString())
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to analyze image. Please try a clearer photo.'
      alert(typeof msg === 'string' ? msg : 'Failed to analyze image. Please try a clearer photo.')
      setPreview(null)
    } finally { setAnalyzing(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this entry?')) return
    try { await api.delete(`/nutrition/${id}`); onRefresh() } catch {}
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" data-testid="nutrition-view">
      {/* Sidebar */}
      <aside className="md:col-span-3 space-y-3">
        <div className="glass rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Meal logs</div>
          </div>
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            {dates.map(d => (
              <button key={d} data-testid={`nutrition-day-${d}`} onClick={() => setSelectedDate(d)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selectedDate === d ? 'bg-terracotta/10 border border-terracotta/30 text-ink' : 'text-muted hover:bg-white/5'}`}>
                <span className="text-sm">{isToday(d) ? 'Today' : d}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selectedDate === d ? 'bg-terracotta text-bg' : 'bg-white/5 text-muted'}`}>{grouped[d].length}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="md:col-span-9 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">{isToday(selectedDate) ? "Today's meals" : `Meals · ${selectedDate}`}</h3>
            <p className="text-sm text-muted">Total intake · <span className="font-mono text-ink">{Math.round(totalCal)} kcal</span></p>
          </div>
          <label className="glass rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2 border-white/10">
            <Search className="w-4 h-4 text-muted" />
            <input data-testid="nutrition-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals" className="bg-transparent text-sm focus:outline-none placeholder-muted w-40 md:w-56" />
          </label>
        </div>

        {isToday(selectedDate) && (
          <div className="glass rounded-3xl p-6" data-testid="nutrition-upload">
            <h4 className="font-display text-lg mb-3">Analyze a meal</h4>
            <label className="block relative rounded-2xl border-2 border-dashed border-white/10 hover:border-terracotta/40 cursor-pointer transition p-8 text-center">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview" className="mx-auto max-h-56 rounded-xl object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 grid place-items-center bg-black/60 rounded-xl">
                      <div className="flex items-center gap-2 text-ink text-sm"><Loader2 className="w-4 h-4 animate-spin text-terracotta" /> Analyzing with Gemini…</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-terracotta mx-auto mb-3" />
                  <p className="text-sm text-ink">Drag & drop or click to upload a photo</p>
                  <p className="text-xs text-muted mt-1">Gemini estimates calories, macros, and healthiness</p>
                </>
              )}
              <input data-testid="nutrition-file-input" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" disabled={analyzing} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4" data-testid="nutrition-entries">
          {dayEntries.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-muted text-sm">No meals for this day{search ? ' matching your search' : ''}.</div>
          )}
          {dayEntries.map((e) => (
            <div key={e.id} className="glass rounded-3xl p-5 flex flex-col md:flex-row md:items-center gap-4" data-testid={`nutrition-entry-${e.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="font-display text-xl capitalize truncate">{e.foodName}</h5>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] ${e.healthScore > 80 ? 'bg-sage/10 text-sage border border-sage/30' : e.healthScore > 50 ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-rose/10 text-rose border border-rose/30'}`}>{Math.round(e.healthScore)}/100</div>
                </div>
                <p className="text-sm text-muted mt-2 italic">"{e.analysis}"</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono text-muted">
                  <Metric dot="bg-terracotta" label="kcal" value={Math.round(e.calories)} />
                  <Metric dot="bg-rose" label="P" value={`${Math.round(e.protein)}g`} />
                  <Metric dot="bg-gold" label="C" value={`${Math.round(e.carbs)}g`} />
                  <Metric dot="bg-sage" label="F" value={`${Math.round(e.fat)}g`} />
                  <span className="ml-auto text-muted">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
              <button data-testid={`nutrition-delete-${e.id}`} onClick={() => remove(e.id)} className="text-muted hover:text-rose p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Metric({ dot, label, value }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dot}`} /> {value} <span className="text-muted">{label}</span></span>
}
