import React, { useState } from 'react'
import { X, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NightlyCheckIn({ isOpen, onClose, onSubmit }) {
  const [stress, setStress] = useState(5)
  const [sleep, setSleep] = useState(7)
  const [calories, setCalories] = useState(2000)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40 backdrop-blur-sm" data-testid="checkin-modal"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <motion.div className="w-full max-w-[480px] bg-white rounded-3xl shadow-lg overflow-hidden p-0"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div className="p-6 flex items-center justify-between border-b border-[#DDD8CF]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B4F5C]/10 border border-[#0B4F5C]/20 grid place-items-center">
                  <Moon className="w-5 h-5 text-[#0B4F5C]" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-[#161B2E]">Nightly Check-in</h3>
                  <p className="text-xs text-[#3D4556]">Close the day — sync stress, sleep, burn.</p>
                </div>
              </div>
              <button data-testid="checkin-close" onClick={onClose} className="text-[#8B92A5] hover:text-[#161B2E] transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-[#8B92A5]">Overall day stress</label>
                  <span className={`text-xs font-mono tabular-nums ${stress > 7 ? 'text-[#8B3D3D]' : 'text-[#3D6B5A]'}`} data-testid="checkin-stress-val">{stress}/10</span>
                </div>
                <input data-testid="checkin-stress-input" type="range" min={1} max={10} step={1} value={stress}
                  onChange={e => setStress(parseInt(e.target.value))}
                  className="w-full accent-[#0B4F5C]"
                  style={{ accentColor: '#0B4F5C' }}
                />
                <div className="flex justify-between text-[10px] text-[#8B92A5] uppercase tracking-[0.2em]">
                  <span>Zen</span><span>Stressed</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.2em] text-[#8B92A5]">Sleep last night</label>
                <div className="flex items-center gap-6">
                  <button data-testid="checkin-sleep-minus" onClick={() => setSleep(Math.max(0, sleep - 0.5))}
                    className="w-10 h-10 rounded-full border border-[#DDD8CF] hover:bg-[#F9F7F2] text-lg text-[#161B2E] transition flex items-center justify-center">
                    −
                  </button>
                  <span className="font-mono text-4xl flex-1 text-center tabular-nums text-[#161B2E]" data-testid="checkin-sleep-val">{sleep}h</span>
                  <button data-testid="checkin-sleep-plus" onClick={() => setSleep(Math.min(16, sleep + 0.5))}
                    className="w-10 h-10 rounded-full border border-[#DDD8CF] hover:bg-[#F9F7F2] text-lg text-[#161B2E] transition flex items-center justify-center">
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.2em] text-[#8B92A5]">Active calories burned</label>
                <input data-testid="checkin-calories-input" type="number" value={calories} onChange={e => setCalories(parseInt(e.target.value) || 0)}
                  className="field font-mono tabular-nums bg-[#F9F7F2] border border-[#DDD8CF] rounded-[14px] focus:ring-[3px] focus:ring-[#0B4F5C]/15 focus:border-[#0B4F5C] transition px-4 py-2.5 w-full outline-none" />
              </div>

              <button data-testid="checkin-submit" onClick={() => onSubmit({ stressLevel: stress, sleepHours: sleep, caloriesBurned: calories })} className="btn-primary w-full">
                Save & Recompute Insights
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
