import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { formatApiError } from '../lib/api.js'
import { Shield, Sparkles, Loader2 } from 'lucide-react'

export default function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('CRED') // CRED | OTP
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      setLoading(true)
      try { await login(form.email.trim(), form.password) }
      catch (err) { setError(formatApiError(err)) }
      finally { setLoading(false) }
    } else {
      if (!form.name.trim()) return setError('Name is required.')
      // simulate OTP send
      const code = String(Math.floor(100000 + Math.random() * 900000))
      setGeneratedOtp(code)
      setStep('OTP')
      // Show OTP visibly (dev)
      setError(`Verification code sent: ${code}`)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    if (otp !== generatedOtp) { setError('Invalid code. Please try again.'); return }
    setLoading(true); setError('')
    try { await register(form.name, form.email.trim(), form.password) }
    catch (err) { setError(formatApiError(err)); setStep('CRED') }
    finally { setLoading(false) }
  }

  const useDemo = async () => {
    setLoading(true); setError('')
    try { await login('demo@healthguard.ai', 'Demo2026!') }
    catch (err) { setError(formatApiError(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-4 relative overflow-hidden" data-testid="auth-screen">
      <div className="absolute inset-0 opacity-30">
        <img src="https://images.pexels.com/photos/7505924/pexels-photo-7505924.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-bg/85" />
      </div>

      <div className="relative w-full max-w-md fade-up">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-11 h-11 rounded-2xl border border-white/10 grid place-items-center bg-surface shadow-glow-terracotta">
            <Shield className="w-5 h-5 text-terracotta" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-tight">HealthGuard<span className="text-terracotta">AI</span></h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Preventive Wellness Intelligence</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 relative">
          {step === 'CRED' ? (
            <>
              <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-full mb-6" role="tablist">
                <button data-testid="auth-tab-login" onClick={() => { setMode('login'); setError('') }} className={`py-2 rounded-full text-sm font-medium transition ${mode === 'login' ? 'bg-terracotta text-bg' : 'text-muted hover:text-ink'}`}>Log In</button>
                <button data-testid="auth-tab-signup" onClick={() => { setMode('signup'); setError('') }} className={`py-2 rounded-full text-sm font-medium transition ${mode === 'signup' ? 'bg-terracotta text-bg' : 'text-muted hover:text-ink'}`}>Sign Up</button>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {mode === 'signup' && (
                  <Field label="Full name" data-testid="auth-name-input" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Elena Rossi" />
                )}
                <Field label="Email" type="email" data-testid="auth-email-input" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="you@company.com" />
                <Field label="Password" type="password" data-testid="auth-password-input" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="••••••••" />
                {error && <div className={`text-xs px-3 py-2 rounded-lg border ${error.startsWith('Verification') ? 'border-gold/40 bg-gold/10 text-gold' : 'border-rose/40 bg-rose/10 text-rose'}`} data-testid="auth-error">{error}</div>}
                <button data-testid="auth-submit-btn" disabled={loading} className="w-full mt-2 py-3 rounded-full bg-terracotta text-bg font-semibold hover:brightness-110 transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted">
                <span className="flex-1 h-px bg-white/10" /> or <span className="flex-1 h-px bg-white/10" />
              </div>
              <button data-testid="auth-demo-btn" onClick={useDemo} className="w-full py-3 rounded-full border border-white/10 hover:bg-white/5 text-ink font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> Continue with Demo account
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <button onClick={() => { setStep('CRED'); setError('') }} className="text-xs text-muted hover:text-ink" data-testid="auth-otp-back">← Back</button>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 grid place-items-center mx-auto">
                  <Sparkles className="w-6 h-6 text-gold" />
                </div>
                <h3 className="mt-3 font-display text-lg">Verify email</h3>
                <p className="text-sm text-muted">Enter the 6-digit code sent to <span className="text-ink">{form.email}</span></p>
                <p className="text-[10px] text-gold mt-1">(Dev demo: code shown above)</p>
              </div>
              <form onSubmit={verify} className="space-y-4">
                <input data-testid="auth-otp-input" value={otp} maxLength={6} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g,''))} className="w-full text-center tracking-[0.4em] font-mono text-2xl bg-white/5 border border-white/10 rounded-xl py-3 focus:outline-none focus:border-terracotta" placeholder="000000" autoFocus />
                {error && <div className="text-xs px-3 py-2 rounded-lg border border-rose/40 bg-rose/10 text-rose" data-testid="auth-error">{error}</div>}
                <button data-testid="auth-verify-btn" disabled={otp.length !== 6 || loading} className="w-full py-3 rounded-full bg-terracotta text-bg font-semibold disabled:opacity-50">Verify & Continue</button>
              </form>
            </div>
          )}

          <p className="text-[11px] text-muted text-center mt-6">By continuing you agree to allow AI analysis of your health data.</p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, ...rest }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.2em] text-muted mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ink placeholder-white/25 focus:outline-none focus:border-terracotta transition"
        required
        {...rest}
      />
    </label>
  )
}
