import React, { useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { Loader2, Search, Trash2, ImageIcon, Lock } from 'lucide-react'

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
          <div className="px-5 py-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted">Meal history</div>
          </div>
          <div className="p-2 space-y-1 max-h-[560px] overflow-y-auto">
            {dates.map(d => (
              <button key={d} data-testid={`nutrition-day-${d}`} onClick={() => setSelectedDate(d)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selectedDate === d ? 'bg-teal/10 border border-teal/25 text-ink' : 'text-ink2 hover:bg-bg'}`}>
                <span className="text-sm">{isToday(d) ? 'Today' : d}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${selectedDate === d ? 'bg-teal text-white' : 'bg-bg text-ink2'}`}>{grouped[d].length}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="md:col-span-9 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">{isToday(selectedDate) ? "Today's meals" : `Meals · ${selectedDate}`}</h3>
            <p className="text-sm text-ink2">Total intake · <span className="font-mono text-ink tabular">{Math.round(totalCal)} kcal</span></p>
          </div>
          <label className="bg-white border border-border rounded-full pl-4 pr-2 py-1.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted" />
            <input data-testid="nutrition-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals" className="bg-transparent text-sm focus:outline-none placeholder-muted w-40 md:w-56" />
          </label>
        </div>

        {isToday(selectedDate) && (
          <div className="card p-6" data-testid="nutrition-upload">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-lg">Analyze a meal</h4>
              {disabled && <span className="text-[10px] uppercase tracking-[0.22em] text-rust flex items-center gap-1"><Lock className="w-3 h-3" /> Upgrade to unlock</span>}
            </div>
            <label className={`block relative rounded-2xl border-2 border-dashed cursor-pointer p-8 text-center transition ${disabled ? 'opacity-60 cursor-not-allowed border-border' : 'border-border hover:border-teal'}`}>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview" className="mx-auto max-h-56 rounded-xl object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 grid place-items-center bg-white/85 rounded-xl">
                      <div className="flex items-center gap-2 text-ink text-sm"><Loader2 className="w-4 h-4 animate-spin text-teal" /> Analyzing with Gemini…</div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 grid place-items-center mx-auto mb-3"><ImageIcon className="w-6 h-6 text-teal" /></div>
                  <p className="text-sm text-ink">Drop a photo or click to upload</p>
                  <p className="text-xs text-muted mt-1">Gemini estimates calories, macros, and healthiness</p>
                </>
              )}
              <input data-testid="nutrition-file-input" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" disabled={disabled || analyzing} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
            </label>
            {error && <div className="mt-3 text-xs px-3 py-2 rounded-xl border border-rust/30 bg-rust/8 text-rust" data-testid="nutrition-error">{error}</div>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4" data-testid="nutrition-entries">
          {dayEntries.length === 0 && (
            <div className="card p-10 text-center text-ink2 text-sm">No meals for this day{search ? ' matching your search' : ''}.</div>
          )}
          {dayEntries.map((e) => (
            <div key={e.id} className="card p-5 flex flex-col md:flex-row md:items-center gap-4 fade-up" data-testid={`nutrition-entry-${e.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="font-display text-xl capitalize truncate">{e.foodName}</h5>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] border ${e.healthScore > 80 ? 'bg-moss/10 text-moss border-moss/30' : e.healthScore > 50 ? 'bg-amber/10 text-amber border-amber/30' : 'bg-rust/10 text-rust border-rust/30'}`}>{Math.round(e.healthScore)}/100</div>
                </div>
                <p className="text-sm text-ink2 mt-2 italic">&ldquo;{e.analysis}&rdquo;</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-mono text-ink2 tabular">
                  <Metric dot="bg-teal" label="kcal" value={Math.round(e.calories)} />
                  <Metric dot="bg-rust" label="P" value={`${Math.round(e.protein)}g`} />
                  <Metric dot="bg-copper" label="C" value={`${Math.round(e.carbs)}g`} />
                  <Metric dot="bg-moss" label="F" value={`${Math.round(e.fat)}g`} />
                  <span className="ml-auto text-muted">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
              <button data-testid={`nutrition-delete-${e.id}`} onClick={() => remove(e.id)} className="text-muted hover:text-rust p-2"><Trash2 className="w-4 h-4" /></button>
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
