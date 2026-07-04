import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

export default function TrialBanner({ billing, onOpen }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const key = billing?.in_trial ? 'hg_trial_banner_dismissed' : billing?.is_paid ? 'hg_paid_banner_dismissed' : 'hg_expired_banner_dismissed'
    const wasDismissed = localStorage.getItem(key)
    if (wasDismissed === '1') setDismissed(true)
    else setDismissed(false)
  }, [billing])

  const handleDismiss = () => {
    const key = billing?.in_trial ? 'hg_trial_banner_dismissed' : billing?.is_paid ? 'hg_paid_banner_dismissed' : 'hg_expired_banner_dismissed'
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  if (!billing) return null

  const inTrial = billing.in_trial
  const isPaid = billing.is_paid
  const expired = !billing.active

  if (!inTrial && !isPaid && !expired) return null

  const config = inTrial
    ? {
        gradient: 'linear-gradient(90deg, #C8A040 0%, #B87333 100%)',
        icon: <Zap className="w-5 h-5 text-white" />,
        title: `${billing.trial_days_left} day${billing.trial_days_left === 1 ? '' : 's'} left in your free trial.`,
        sub: `Continue seamlessly for $${billing.plan_price_usd || 10}/month — cancel anytime.`,
        cta: 'Upgrade now — $10/month',
        ctaClass: 'bg-white text-[#B87333] hover:bg-white/90',
        textColor: 'text-white',
        subColor: 'text-white/90',
      }
    : isPaid
    ? {
        gradient: 'linear-gradient(90deg, #3D6B5A 0%, #4A7A5F 100%)',
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        title: 'Your subscription is active.',
        sub: `Renews on ${billing.renews_on || 'next billing cycle'}.`,
        cta: null,
        textColor: 'text-white',
        subColor: 'text-white/90',
      }
    : {
        gradient: 'linear-gradient(90deg, #8B3D3D 0%, #A94A3A 100%)',
        icon: <AlertCircle className="w-5 h-5 text-white" />,
        title: 'Your trial has ended.',
        sub: 'Upgrade to continue accessing all features.',
        cta: 'Upgrade to continue',
        ctaClass: 'bg-white text-[#8B3D3D] hover:bg-white/90',
        textColor: 'text-white',
        subColor: 'text-white/90',
      }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
          data-testid="trial-banner"
        >
          <div className="mx-5 md:mx-10 mt-4 flex items-center gap-3 rounded-2xl p-4 text-white" style={{ background: config.gradient }}>
            <div className="w-9 h-9 shrink-0 rounded-full bg-white/20 grid place-items-center backdrop-blur">
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${config.textColor}`}>{config.title}</div>
              <div className={`text-xs mt-0.5 ${config.subColor}`} style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>{config.sub}</div>
            </div>
            {config.cta && (
              <button onClick={onOpen} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${config.ctaClass}`} style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                {config.cta}
              </button>
            )}
            <button onClick={handleDismiss} className="shrink-0 p-2 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
