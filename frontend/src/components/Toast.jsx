import React from 'react'
import { X, Info, AlertCircle } from 'lucide-react'

export default function Toast({ message, type = 'INFO', onClose }) {
  const isAlert = type === 'ALERT'
  return (
    <div data-testid="toast" className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] md:w-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-card fade-up bg-white ${isAlert ? 'border-rust/40' : 'border-border'}`}>
      <div className={`w-8 h-8 rounded-full grid place-items-center ${isAlert ? 'bg-rust/12 text-rust' : 'bg-teal/12 text-teal'}`}>
        {isAlert ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted">{isAlert ? 'Wellness Alert' : 'Insight'}</div>
        <div className="text-sm text-ink">{message}</div>
      </div>
      <button data-testid="toast-close" onClick={onClose} className="ml-2 text-muted hover:text-ink"><X className="w-4 h-4" /></button>
    </div>
  )
}
