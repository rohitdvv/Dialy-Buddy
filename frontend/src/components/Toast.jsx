import React, { useEffect, useState } from 'react'
import { X, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Toast({ message, type = 'INFO', onClose }) {
  const [progress, setProgress] = useState(100)
  const isAlert = type === 'ALERT'
  const isSuccess = type === 'SUCCESS'

  const borderColor = isAlert ? 'border-l-[#8B3D3D]' : isSuccess ? 'border-l-[#3D6B5A]' : 'border-l-[#0B4F5C]'
  const iconColor = isAlert ? 'text-[#8B3D3D]' : isSuccess ? 'text-[#3D6B5A]' : 'text-[#0B4F5C]'
  const bgColor = isAlert ? 'bg-[#8B3D3D]/10' : isSuccess ? 'bg-[#3D6B5A]/10' : 'bg-[#0B4F5C]/10'
  const borderColorFull = isAlert ? 'border-[#8B3D3D]/30' : isSuccess ? 'border-[#3D6B5A]/30' : 'border-[#0B4F5C]/30'

  useEffect(() => {
    const duration = 4500
    const interval = 45
    const step = 100 / (duration / interval)
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) { clearInterval(timer); onClose(); return 0 }
        return prev - step
      })
    }, interval)
    return () => clearInterval(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        data-testid="toast"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 md:bottom-4 z-50 max-w-md w-[92%] md:w-auto flex items-start gap-3 px-4 py-3 rounded-2xl border bg-white shadow-lg ${borderColor} border-l-4 ${borderColorFull}`}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${bgColor}`}>
          {isAlert ? <AlertCircle className={`w-4 h-4 ${iconColor}`} /> : isSuccess ? <CheckCircle className={`w-4 h-4 ${iconColor}`} /> : <Info className={`w-4 h-4 ${iconColor}`} />}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#8B92A5]">
            {isAlert ? 'Wellness Alert' : isSuccess ? 'Success' : 'Insight'}
          </div>
          <div className="text-sm text-[#161B2E] mt-0.5">{message}</div>
          <div className="mt-2 h-1 rounded-full bg-[#EFEAE0] overflow-hidden">
            <motion.div className={`h-full rounded-full ${isAlert ? 'bg-[#8B3D3D]' : isSuccess ? 'bg-[#3D6B5A]' : 'bg-[#0B4F5C]'}`}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.05 }}
            />
          </div>
        </div>
        <button data-testid="toast-close" onClick={onClose} className="text-[#8B92A5] hover:text-[#161B2E] transition mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
