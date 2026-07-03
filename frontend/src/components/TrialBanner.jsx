import React from 'react'
import { X } from 'lucide-react'

export default function TrialBanner({ billing, onOpen }) {
  if (!billing) return null
  // Show only when in trial with <= 10 days left OR expired
  const show = (billing.in_trial && billing.trial_days_left <= 10) || (!billing.active)
  if (!show) return null
  const expired = !billing.active
  return (
    <div className={`mx-5 md:mx-10 mt-4 flex items-start gap-3 rounded-2xl border p-4 ${expired ? 'border-rust/30 bg-rust/8' : 'border-amber/30 bg-amber/10'}`} data-testid="trial-banner">
      <div className={`w-9 h-9 shrink-0 rounded-full grid place-items-center ${expired ? 'bg-rust/15 text-rust' : 'bg-copper/15 text-copper'}`}>
        <span className="font-mono text-sm">$</span>
      </div>
      <div className="flex-1">
        <div className="text-sm text-ink">
          {expired ? 'Your free trial has ended.' : `Trial ends in ${billing.trial_days_left} day${billing.trial_days_left === 1 ? '' : 's'}.`}
        </div>
        <div className="text-xs text-ink2 mt-0.5">
          {expired
            ? `Reading data still works. Upgrade for $${billing.plan_price_usd}/month to keep logging meals, journals, and chat.`
            : `Continue seamlessly for $${billing.plan_price_usd}/month — cancel anytime.`}
        </div>
      </div>
      <button data-testid="trial-banner-upgrade" onClick={onOpen} className="btn-primary text-sm">Upgrade</button>
    </div>
  )
}
