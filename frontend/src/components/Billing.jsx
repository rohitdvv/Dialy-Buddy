import React, { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Check, Loader2, CreditCard, ShieldCheck, Sparkles } from 'lucide-react'

export default function Billing() {
  const { billing, refreshBilling } = useAuth()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [polling, setPolling] = useState(false)

  // Polling if returning from checkout
  useEffect(() => {
    const url = new URL(window.location.href)
    const sid = url.searchParams.get('session_id')
    if (!sid) return
    setPolling(true); setMsg('Confirming payment…')
    let attempts = 0
    const tick = async () => {
      attempts++
      try {
        const { data } = await api.get(`/billing/checkout/status/${sid}`)
        if (data.payment_status === 'paid') {
          setMsg('Payment confirmed. Thank you!')
          setPolling(false); await refreshBilling()
          window.history.replaceState({}, '', window.location.pathname)
          return
        }
        if (data.status === 'expired') { setMsg('Checkout expired.'); setPolling(false); return }
      } catch (e) { void e }
      if (attempts < 20) setTimeout(tick, 2000)
      else { setMsg('Still processing — refresh in a minute.'); setPolling(false) }
    }
    tick()
  }, [])

  const upgrade = async () => {
    setLoading(true); setMsg('')
    try {
      const { data } = await api.post('/billing/checkout', { origin_url: window.location.origin })
      window.location.href = data.url
    } catch (e) {
      setMsg('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="billing-view">
      <div className="grid md:grid-cols-3 gap-4">
        <StatusPill label="Plan" value={billing?.is_paid ? 'Pro · Monthly' : billing?.in_trial ? 'Free Trial' : 'Expired'} tone={billing?.is_paid ? 'moss' : billing?.in_trial ? 'copper' : 'rust'} />
        <StatusPill label={billing?.is_paid ? 'Renews in' : billing?.in_trial ? 'Trial ends in' : 'Ended'}
                    value={billing?.is_paid ? `${billing.paid_days_left}d` : billing?.in_trial ? `${billing.trial_days_left}d` : '—'} tone="teal" />
        <StatusPill label="Price" value={`$${billing?.plan_price_usd?.toFixed(2) || '10.00'} / mo`} tone="ink" />
      </div>

      <div className="card p-8 grid md:grid-cols-2 gap-6 items-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-teal/8 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal/30 bg-teal/8 text-[10px] uppercase tracking-[0.25em] text-teal"><Sparkles className="w-3 h-3" /> HealthGuard Pro</div>
          <h2 className="font-display font-display-title text-4xl md:text-5xl mt-4 leading-[1.05]">Full access.<br/>Zero friction.</h2>
          <ul className="mt-6 space-y-2.5 text-sm text-ink2">
            {[
              'Unlimited AI food-image and voice-tone analyses',
              'All 40+ wearable integrations (Terra + Fitbit OAuth)',
              'Weekly wellness report PDF + full data export',
              'Priority AI companion responses',
              'Advanced trend analytics and streak insights',
            ].map(x => <li key={x} className="flex items-start gap-2"><Check className="w-4 h-4 text-moss shrink-0 mt-0.5" /> {x}</li>)}
          </ul>
        </div>

        <div className="relative">
          <div className="card-quiet p-6 bg-bg text-center">
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted">Monthly</div>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="font-display font-display-title text-6xl tabular">$10</span>
              <span className="text-ink2">/mo</span>
            </div>
            <div className="text-xs text-muted mt-1">Billed monthly · cancel anytime</div>

            {billing?.is_paid ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-moss text-sm"><ShieldCheck className="w-4 h-4" /> You're on Pro until {new Date(billing.paid_until).toLocaleDateString()}</div>
            ) : (
              <button data-testid="billing-upgrade-btn" onClick={upgrade} disabled={loading || polling} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                {(loading || polling) && <Loader2 className="w-4 h-4 animate-spin" />}
                <CreditCard className="w-4 h-4" /> {billing?.in_trial ? `Upgrade — continue in ${billing.trial_days_left}d` : 'Upgrade now'}
              </button>
            )}

            {msg && <div className="mt-4 text-xs px-3 py-2 rounded-xl border border-border bg-white text-ink2" data-testid="billing-msg">{msg}</div>}
            {polling && <div className="mt-3 text-[11px] text-muted">Verifying with Stripe…</div>}
            <div className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted">Secured by Stripe</div>
          </div>
        </div>
      </div>

      <div className="card p-6 text-sm text-ink2" data-testid="billing-faq">
        <h3 className="font-display text-lg text-ink">FAQ</h3>
        <div className="mt-4 space-y-4">
          <p><b className="text-ink">What happens after my trial ends?</b><br/>Your data stays. You can keep reading your history and reports; new logging (meals, journals, chats) resumes when you upgrade.</p>
          <p><b className="text-ink">Do I need a card for the trial?</b><br/>No. Sign up and you're in for 30 days, no strings.</p>
          <p><b className="text-ink">Can I cancel anytime?</b><br/>Yes. One click — you'll retain Pro access until the paid period ends.</p>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ label, value, tone = 'ink' }) {
  return (
    <div className="card p-5" data-testid={`billing-pill-${label.toLowerCase().replace(/\s/g,'-')}`}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted">{label}</div>
      <div className={`mt-2 text-xl font-mono tabular text-${tone === 'ink' ? 'ink' : tone}`}>{value}</div>
    </div>
  )
}
