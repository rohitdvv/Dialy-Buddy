import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Loader2, Lock } from 'lucide-react'

export default function AIChat({ messages, onSend, disabled }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const todayKey = new Date().toDateString()
  const [selected, setSelected] = useState(todayKey)

  const groups = useMemo(() => {
    const g = {}; g[todayKey] = []
    messages.forEach(m => { const k = m.timestamp ? new Date(m.timestamp).toDateString() : todayKey
      if (!g[k]) g[k] = []; g[k].push(m) })
    return g
  }, [messages])
  const dateKeys = useMemo(() => Object.keys(groups).sort((a,b) => new Date(b) - new Date(a)), [groups])
  const current = groups[selected] || []

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [current, sending])

  const send = async () => {
    if (!input.trim() || sending || disabled) return
    if (selected !== todayKey) setSelected(todayKey)
    const text = input; setInput(''); setSending(true)
    try { await onSend(text) } finally { setSending(false) }
  }
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[calc(100vh-200px)] min-h-[560px]" data-testid="chat-view">
      <aside className="md:col-span-3 card overflow-hidden flex flex-col p-0">
        <div className="px-5 py-4 border-b border-border text-[10px] uppercase tracking-[0.25em] text-muted">Conversations</div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {dateKeys.map(d => (
            <button key={d} data-testid={`chat-day-${d}`} onClick={() => setSelected(d)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selected === d ? 'bg-teal/10 border border-teal/25' : 'text-ink2 hover:bg-bg'}`}>
              <span className="text-sm">{d === todayKey ? 'Today' : d}</span>
              <span className="text-[10px] font-mono">{groups[d]?.length || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="md:col-span-9 card flex flex-col overflow-hidden p-0">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">Health Companion</h3>
            <div className="text-xs text-muted">{selected === todayKey ? 'Online · contextual to your recent signals' : 'Read-only archive'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-emerald grid place-items-center text-white font-semibold">HG</div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg/40">
          {current.length === 0 && (
            <div className="h-full grid place-items-center text-center text-ink2">
              <div>
                <div className="mx-auto w-14 h-14 rounded-full bg-white border border-border grid place-items-center mb-3 text-2xl">💬</div>
                <p className="text-sm text-ink2">Ask about diet, sleep, stress, or just say hello.</p>
              </div>
            </div>
          )}
          {current.map(m => (
            <div key={m.id} data-testid={`chat-msg-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-teal text-white rounded-br-md shadow-soft' : 'bg-white border border-border text-ink rounded-bl-md shadow-soft'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" style={{animationDelay:'.15s'}} />
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-bounce" style={{animationDelay:'.3s'}} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {selected === todayKey && (
          <div className="p-4 border-t border-border flex items-center gap-2 bg-white">
            <input data-testid="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder={disabled ? 'Upgrade to chat with HealthGuard' : 'Ask HealthGuard…'}
              className="field !rounded-full !py-3" disabled={sending || disabled} />
            <button data-testid="chat-send-btn" onClick={send} disabled={!input.trim() || sending || disabled}
              className="w-12 h-12 rounded-full bg-teal grid place-items-center text-white hover:brightness-110 disabled:opacity-40 shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : disabled ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
