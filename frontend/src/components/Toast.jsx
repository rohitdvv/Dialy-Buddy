import React from 'react'
import { X, Info, AlertCircle } from 'lucide-react'

export default function Toast({ message, type = 'INFO', onClose }) {
  const isAlert = type === 'ALERT'
  return (
    <div data-testid="toast" className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] md:w-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl fade-up ${
      isAlert ? 'bg-rose/15 border-rose/40 text-rose' : 'bg-white/5 border-white/10 text-ink'
    }`}>
      <div className={`w-8 h-8 rounded-full grid place-items-center ${isAlert ? 'bg-rose/20' : 'bg-terracotta/15'}`}>
        {isAlert ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4 text-terracotta" />}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] opacity-80">{isAlert ? 'Wellness Alert' : 'Insight'}</div>
        <div className="text-sm">{message}</div>
      </div>
      <button data-testid="toast-close" onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  )
}
