import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { formatApiError } from '../lib/api.js'
import { Shield, Loader2, Check, ArrowRight, Sparkle } from 'lucide-react'

export default function AuthScreen() {
  const { login, requestOtp, resendOtp, verifyOtp } = useAuth()
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('CRED') // CRED | OTP
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [devCode, setDevCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [otp, setOtp] = useState('')

  const switchMode = (m) => { setMode(m); setError(''); setNotice(''); setDevCode(''); setStep('CRED') }

  const applyOtpResponse = (data) => {
    if (data?.dev_mode && data?.dev_code) {
      setDevCode(data.dev_code)
      setNotice(`Email delivery isn't configured yet, so here's your code for testing: ${data.dev_code}`)
    } else {
      setDevCode('')
      setNotice(`We sent a 6-digit code to ${data?.email || form.email}. It expires in ${data?.expires_in_minutes || 10} minutes.`)
    }
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setNotice(''); setDevCode('')
    if (mode === 'login') {
      setLoading(true)
      try { await login(form.email.trim().toLowerCase(), form.password) }
      catch (err) { setError(formatApiError(err)) }
      finally { setLoading(false) }
    } else {
      if (!form.firstName.trim() || !form.lastName.trim()) return setError('Please enter your first and last name.')
      if (!form.dob) return setError('Please enter your date of birth.')
      setLoading(true)
      try {
        const data = await requestOtp({
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          dateOfBirth: form.dob, email: form.email.trim().toLowerCase(), password: form.password,
        })
        setOtp(''); setStep('OTP'); applyOtpResponse(data)
      } catch (err) { setError(formatApiError(err)) }
      finally { setLoading(false) }
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try { await verifyOtp(form.email.trim().toLowerCase(), otp) }
    catch (err) { setError(formatApiError(err)) }
    finally { setLoading(false) }
  }

  const resend = async () => {
    setResending(true); setError('')
    try { const data = await resendOtp(form.email.trim().toLowerCase()); applyOtpResponse(data); setOtp('') }
    catch (err) { setError(formatApiError(err)) }
    finally { setResending(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="auth-screen">
      {/* Left: brand */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-teal to-emerald text-white">
        <div className="absolute inset-0 opacity-25 pointer-events-none"
             style={{background:'radial-gradient(600px 400px at 20% 10%, rgba(198,151,73,0.35), transparent), radial-gradient(500px 400px at 80% 90%, rgba(185,106,58,0.30), transparent)'}} />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 grid place-items-center backdrop-blur">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display text-2xl tracking-tight">HealthGuard<span className="opacity-70">AI</span></div>
            <div className="text-[11px] uppercase tracking-[0.28em] opacity-70 mt-0.5">Preventive Wellness</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl xl:text-6xl leading-[1.05] tracking-tight">
            The quietest health<br/>system you'll ever own.
          </h1>
          <p className="mt-5 text-white/80 text-lg leading-relaxed max-w-md font-light">
            Voice tone, meal vision, and 40+ wearables — analysed against your history to surface risk before it becomes a diagnosis.
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-white/85">
            {['30-day free trial · then $10 / month','Encrypted, private-by-design','Real Fitbit, Oura, Whoop, Apple Watch sync'].map(x => (
              <li key={x} className="flex items-center gap-2"><Check className="w-4 h-4" /> {x}</li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/60">© {new Date().getFullYear()} HealthGuardAI · SOC-2 aligned</div>
      </div>

      {/* Right: auth */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-bg">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-teal grid place-items-center"><Shield className="w-4 h-4 text-white" /></div>
            <span className="font-display text-xl">HealthGuardAI</span>
          </div>

          {step === 'CRED' ? (
            <>
              <div className="mb-6">
                <h2 className="font-display font-display-title text-4xl">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2>
                <p className="text-ink2 mt-2">{mode === 'login' ? 'Sign in to continue your wellness ledger.' : 'Start your 30-day trial — no card required.'}</p>
              </div>

              <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="First name" data-testid="auth-firstname-input" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} placeholder="Elena" />
                      <Field label="Last name" data-testid="auth-lastname-input" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} placeholder="Rossi" />
                    </div>
                    <Field label="Date of birth" type="date" data-testid="auth-dob-input" value={form.dob} onChange={v => setForm({ ...form, dob: v })} />
                  </>
                )}
                <Field label="Email" type="email" data-testid="auth-email-input" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="you@work.com" />
                <Field label="Password" type="password" data-testid="auth-password-input" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="Minimum 6 characters" />
                {notice && <div className="text-xs px-3 py-2.5 rounded-xl border border-amber/40 bg-amber/10 text-ink2" data-testid="auth-notice">{notice}</div>}
                {error && <div className="text-xs px-3 py-2.5 rounded-xl border border-rust/30 bg-rust/10 text-rust" data-testid="auth-error">{error}</div>}
                <button data-testid="auth-submit-btn" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'login' ? 'Sign in' : 'Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-8 text-sm text-ink2 text-center">
                {mode === 'login' ? (
                  <>New here? <button data-testid="auth-tab-signup" onClick={() => switchMode('signup')} className="text-teal font-medium hover:underline">Create an account</button></>
                ) : (
                  <>Already have one? <button data-testid="auth-tab-login" onClick={() => switchMode('login')} className="text-teal font-medium hover:underline">Sign in</button></>
                )}
              </div>

              <div className="mt-10 p-4 rounded-2xl bg-white border border-border flex items-start gap-3">
                <Sparkle className="w-5 h-5 text-copper shrink-0 mt-0.5" />
                <div className="text-sm text-ink2">
                  <div className="font-medium text-ink">30-day free trial</div>
                  <div className="text-xs text-muted mt-0.5">Full access to AI vision, tone analysis, wearable sync, and PDF exports. Then $10/month — cancel anytime.</div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <button onClick={() => { setStep('CRED'); setError(''); setNotice(''); setDevCode('') }} className="text-sm text-ink2 hover:text-ink" data-testid="auth-otp-back">← Back</button>
              <div>
                <h2 className="font-display font-display-title text-4xl">Check your email</h2>
                <p className="text-ink2 mt-2 text-sm">We sent a 6-digit code to <span className="text-ink">{form.email}</span></p>
                {notice && <p className="mt-2 text-xs text-copper" data-testid="auth-notice">{notice}</p>}
                {devCode && (
                  <div className="mt-3 px-3 py-2.5 rounded-xl border border-amber/40 bg-amber/10 text-ink2 text-xs" data-testid="auth-dev-code">
                    <span className="uppercase tracking-[0.2em] text-[10px] text-muted">Test mode</span>
                    <div className="font-mono text-lg text-ink mt-0.5 tracking-[0.3em]">{devCode}</div>
                  </div>
                )}
              </div>
              <form onSubmit={verify} className="space-y-4">
                <input data-testid="auth-otp-input" value={otp} maxLength={6} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g,''))}
                       className="field text-center tracking-[0.5em] font-mono text-3xl py-4" placeholder="000000" autoFocus />
                {error && <div className="text-xs px-3 py-2 rounded-xl border border-rust/30 bg-rust/10 text-rust" data-testid="auth-error">{error}</div>}
                <button data-testid="auth-verify-btn" disabled={otp.length !== 6 || loading} className="btn-primary w-full">
                  {loading ? 'Creating account…' : 'Verify & Continue'}
                </button>
              </form>
              <div className="text-center text-sm text-ink2">
                Didn't get it?{' '}
                <button onClick={resend} disabled={resending} data-testid="auth-otp-resend" className="text-teal font-medium hover:underline disabled:opacity-50">
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, ...rest }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.22em] text-muted mb-1.5">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="field" required {...rest} />
    </label>
  )
}
