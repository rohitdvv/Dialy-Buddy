import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Loader2, Lock, ArrowUp, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
}

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
        <div className="px-5 py-4 border-b border-[#DDD8CF] text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">Conversations</div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {dateKeys.map(d => (
            <button key={d} data-testid={`chat-day-${d}`} onClick={() => setSelected(d)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${selected === d ? 'bg-[#0B4F5C]/10 border border-[#0B4F5C]/25' : 'text-[#3D4556] hover:bg-[#F4F2ED]'}`}>
              <span className="text-sm">{d === todayKey ? 'Today' : d}</span>
              <span className="text-[10px] font-mono tabular-nums">{groups[d]?.length || 0}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="md:col-span-9 card flex flex-col overflow-hidden p-0 relative">
        <header className="px-6 py-4 border-b border-[#DDD8CF] flex items-center justify-between bg-white">
          <div>
            <h3 className="font-display text-lg text-[#161B2E]">Health Companion</h3>
            <div className="text-xs text-[#8B92A5]">{selected === todayKey ? 'Online · contextual to your recent signals' : 'Read-only archive'}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B4F5C] to-[#0F5C4F] grid place-items-center text-white font-semibold shadow-sm">HG</div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9F7F2]">
          {current.length === 0 && (
            <div className="h-full grid place-items-center text-center text-[#3D4556]">
              <div>
                <div className="mx-auto w-14 h-14 rounded-full bg-white border border-[#DDD8CF] grid place-items-center mb-3 shadow-sm">
                  <Sparkles className="w-6 h-6 text-[#0B4F5C]" />
                </div>
                <p className="text-sm text-[#3D4556]">Ask about diet, sleep, stress, or just say hello.</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {current.map(m => (
              <motion.div key={m.id} data-testid={`chat-msg-${m.role}`} variants={messageVariants} initial="hidden" animate="show"
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#0B4F5C] text-white rounded-2xl rounded-br-sm shadow-sm' : 'bg-[#F9F7F2] border border-[#DDD8CF] text-[#161B2E] rounded-2xl rounded-bl-sm shadow-sm'}`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sending && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-[#F9F7F2] border border-[#DDD8CF] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B4F5C] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B4F5C] animate-bounce" style={{animationDelay:'.15s'}} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B4F5C] animate-bounce" style={{animationDelay:'.3s'}} />
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {selected === todayKey && (
          <div className="p-4 border-t border-[#DDD8CF] flex items-center gap-2 bg-white">
            <input data-testid="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder={disabled ? 'Upgrade to chat with HealthGuard' : 'Ask HealthGuard…'}
              className="field !rounded-full !py-3" disabled={sending || disabled} />
            <button data-testid="chat-send-btn" onClick={send} disabled={!input.trim() || sending || disabled}
              className="w-12 h-12 rounded-full bg-[#0B4F5C] grid place-items-center text-white hover:brightness-110 disabled:opacity-40 shrink-0 shadow-sm transition hover:scale-105 active:scale-95">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : disabled ? <Lock className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        )}

        {disabled && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm grid place-items-center z-10">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-[#8B3D3D]/10 border border-[#8B3D3D]/20 grid place-items-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-[#8B3D3D]" />
              </div>
              <h4 className="font-display text-xl text-[#161B2E]">Upgrade to chat with your AI companion</h4>
              <p className="text-sm text-[#3D4556] mt-2 max-w-xs mx-auto">Your trial has ended. Upgrade to HealthGuard Pro to continue the conversation.</p>
              <button className="btn-primary mt-5" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'BILLING' }))}>Upgrade Now</button>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  )
}
