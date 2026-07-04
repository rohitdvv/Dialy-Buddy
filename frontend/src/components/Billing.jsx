import React, { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Check, Loader2, CreditCard, ShieldCheck, Sparkles, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

const cardEnter = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

export default function Billing() {
  const { billing, refreshBilling } = useAuth()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [polling, setPolling] = useState(false)

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

  const isPaid = billing?.is_paid
  const inTrial = billing?.in_trial
  const isExpired = !isPaid && !inTrial
  const trialDays = billing?.trial_days_left || 0
  const paidDays = billing?.paid_days_left || 0
  const planPrice = billing?.plan_price_usd?.toFixed(2) || '10.00'

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="billing-view">
      <motion.div className="grid md:grid-cols-3 gap-4" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={cardEnter} className="card p-5" data-testid="billing-pill-plan">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">Plan</div>
          <div className={`mt-2 text-xl font-mono tabular-nums ${isPaid ? 'text-[#3D6B5A]' : inTrial ? 'text-[#C8A040]' : 'text-[#8B3D3D]'}`}>
            {isPaid ? 'Pro · Monthly' : inTrial ? 'Free Trial' : 'Expired'}
          </div>
        </motion.div>
        <motion.div variants={cardEnter} className="card p-5" data-testid="billing-pill-renews-in">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">{isPaid ? 'Renews in' : inTrial ? 'Trial ends in' : 'Ended'}</div>
          <div className="mt-2 text-xl font-mono tabular-nums text-[#0B4F5C]">
            {isPaid ? `${paidDays}d` : inTrial ? `${trialDays}d` : '—'}
          </div>
        </motion.div>
        <motion.div variants={cardEnter} className="card p-5" data-testid="billing-pill-price">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#8B92A5]">Price</div>
          <div className="mt-2 text-xl font-mono tabular-nums text-[#161B2E]">${planPrice} / mo</div>
        </motion.div>
      </motion.div>

      <motion.div variants={cardEnter} initial="hidden" animate="show" className="card p-8 grid md:grid-cols-2 gap-6 items-center relative overflow-hidden border-t-4 border-t-[#0B4F5C]">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0B4F5C]/30 bg-[#0B4F5C]/8 text-[10px] uppercase tracking-[0.25em] text-[#0B4F5C]">
            <Sparkles className="w-3 h-3" /> HealthGuard AI Pro
          </div>
          <h2 className="font-display font-display-title text-4xl md:text-5xl mt-4 leading-[1.05] text-[#161B2E]">Full access.<br/>Zero friction.</h2>
          <ul className="mt-6 space-y-2.5 text-sm text-[#3D4556]">
            {[
              'Unlimited AI food-image and voice-tone analyses',
              'All 40+ wearable integrations (Terra + Fitbit OAuth)',
              'Weekly wellness report PDF + full data export',
              'Priority AI companion responses',
              'Advanced trend analytics and streak insights',
            ].map(x => <li key={x} className="flex items-start gap-2"><Check className="w-4 h-4 text-[#3D6B5A] shrink-0 mt-0.5" /> {x}</li>)}
          </ul>
        </div>

        <div className="relative">
          <div className="card p-6 bg-[#F4F2ED] text-center">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#8B92A5]">Monthly</div>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="font-display font-display-title text-6xl tabular-nums text-[#161B2E]">$10</span>
              <span className="text-[#3D4556]">/mo</span>
            </div>
            <div className="text-xs text-[#8B92A5] mt-1">Billed monthly · cancel anytime</div>

            {inTrial && (
              <div className="mt-5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#C8A040]" />
                  <span className="font-display text-2xl text-[#C8A040]">{trialDays} days left</span>
                </div>
                <div className="h-2 rounded-full bg-[#EFEAE0] overflow-hidden mx-auto max-w-[200px]">
                  <motion.div className="h-full rounded-full bg-[#C8A040]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(trialDays / 30) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="text-[11px] text-[#8B92A5] mt-1">{trialDays} of 30 days remaining</div>
              </div>
            )}

            {isExpired && (
              <div className="mt-5 text-center">
                <div className="font-display text-xl text-[#8B3D3D]">Your trial has ended.</div>
                <p className="text-xs text-[#3D4556] mt-1">Upgrade to continue using all features.</p>
              </div>
            )}

            {isPaid ? (
              <div className="mt-6 flex items-center justify-center gap-2 text-[#3D6B5A] text-sm">
                <ShieldCheck className="w-4 h-4" /> You're on Pro until {new Date(billing.paid_until).toLocaleDateString()}
              </div>
            ) : (
              <button data-testid="billing-upgrade-btn" onClick={upgrade} disabled={loading || polling} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                {(loading || polling) && <Loader2 className="w-4 h-4 animate-spin" />}
                <CreditCard className="w-4 h-4" /> {inTrial ? `Upgrade Now — $10/month` : 'Upgrade now'}
              </button>
            )}

            {msg && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-xs px-3 py-2 rounded-xl border border-[#DDD8CF] bg-white text-[#3D4556]" data-testid="billing-msg">
                {msg}
              </motion.div>
            )}
            {polling && <div className="mt-3 text-[11px] text-[#8B92A5]">Verifying with Stripe…</div>}
            <div className="mt-6 text-[10px] uppercase tracking-[0.22em] text-[#8B92A5]">Secured by Stripe</div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={cardEnter} initial="hidden" animate="show" className="card p-6 text-sm text-[#3D4556]" data-testid="billing-faq">
        <h3 className="font-display text-lg text-[#161B2E]">FAQ</h3>
        <div className="mt-4 space-y-4">
          <p><b className="text-[#161B2E]">What happens after my trial ends?</b><br/>Your data stays. You can keep reading your history and reports; new logging (meals, journals, chats) resumes when you upgrade.</p>
          <p><b className="text-[#161B2E]">Do I need a card for the trial?</b><br/>No. Sign up and you're in for 30 days, no strings.</p>
          <p><b className="text-[#161B2E]">Can I cancel anytime?</b><br/>Yes. One click — you'll retain Pro access until the paid period ends.</p>
        </div>
      </motion.div>
    </div>
  )
}
