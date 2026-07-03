import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function AIChat({ messages, onSend }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  const todayKey = new Date().toDateString()
  const [selected, setSelected] = useState(todayKey)

  const groups = useMemo(() => {
    const g = {}
    g[todayKey] = []
    messages.forEach(m => {
      const k = m.timestamp ? new Date(m.timestamp).toDateString() : todayKey
      if (!g[k]) g[k] = []
      g[k].push(m)
    })
    return g
  }, [messages])

  const dateKeys = useMemo(() => Object.keys(groups).sort((a,b) => new Date(b) - new Date(a)), [groups])
  const current = groups[selected] || []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [current, sending])

  const send = async () => {
    if (!input.trim() || sending) return
    if (selected !== todayKey) setSelected(todayKey)
    const text = input; setInput(''); setSending(true)
    try { await onSend(text) } finally { setSending(false) }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[560px]" data-testid="chat-view">
      <aside className="md:col-span-3 glass rounded-3xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-white/5 text-[10px] uppercase tracking-[0.25em] text-muted">Conversations</div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {dateKeys.map(d => (
            <button key={d} data-testid={`chat-day-${d}`} onClick={() => setSelected(d)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selected === d ? 'bg-terracotta/10 border border-terracotta/30' : 'text-muted hover:bg-white/5'}`}>
              <span className="text-sm">{d === todayKey ? 'Today' : d}</span>
              <span className="text-[10px] font-mono">{groups[d]?.length || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="md:col-span-9 glass rounded-3xl flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">Health Companion</h3>
            <div className="text-xs text-muted">{selected === todayKey ? 'Online · Contextual to your recent signals' : 'Read-only archive'}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-terracotta grid place-items-center text-bg font-semibold">AI</div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {current.length === 0 && (
            <div className="h-full grid place-items-center text-center text-muted opacity-60">
              <div>
                <div className="mx-auto w-14 h-14 rounded-full border border-white/10 grid place-items-center mb-2">💬</div>
                <p className="text-sm">Ask about diet, sleep, stress, or just say hello.</p>
              </div>
            </div>
          )}
          {current.map(m => (
            <div key={m.id} data-testid={`chat-msg-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-terracotta text-bg rounded-br-none' : 'bg-white/5 border border-white/10 rounded-bl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-bounce" style={{animationDelay:'.15s'}} />
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-bounce" style={{animationDelay:'.3s'}} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {selected === todayKey && (
          <div className="p-4 border-t border-white/5 flex items-center gap-2">
            <input data-testid="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask HealthGuard…" className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-terracotta placeholder-muted" disabled={sending} />
            <button data-testid="chat-send-btn" onClick={send} disabled={!input.trim() || sending} className="w-11 h-11 rounded-full bg-terracotta grid place-items-center text-bg hover:brightness-110 disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
