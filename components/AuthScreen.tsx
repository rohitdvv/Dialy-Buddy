
import React, { useState } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  // OTP State
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    if (!isLogin && !formData.name) return;

    if (isLogin) {
      // Direct login for existing users (skipping OTP for simplicity unless 2FA is desired later)
      completeAuth();
    } else {
      // Signup Flow: Generate OTP
      setLoading(true);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      
      // Simulate network delay for sending email
      setTimeout(() => {
        setLoading(false);
        setAuthStep('OTP');
        // In a real app, this would be an email. For demo, we use alert.
        alert(`[HealthGuardAI] Your verification code is: ${code}`);
      }, 1500);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOtp) {
      completeAuth();
    } else {
      alert("Invalid Code. Please try again.");
      setOtpInput('');
    }
  };

  const completeAuth = () => {
    const user: User = {
      id: Date.now().toString(),
      name: isLogin ? (formData.email.split('@')[0]) : formData.name,
      email: formData.email
    };
    onLogin(user);
  };

  const resendOtp = () => {
     const code = Math.floor(100000 + Math.random() * 900000).toString();
     setGeneratedOtp(code);
     alert(`[HealthGuardAI] Your new verification code is: ${code}`);
  };

  // Reset state when switching between Login/Signup
  const toggleMode = (mode: boolean) => {
    setIsLogin(mode);
    setAuthStep('CREDENTIALS');
    setFormData({ name: '', email: '', password: '' });
    setOtpInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-2">HealthGuard<span className="font-light opacity-80">AI</span></h1>
          <p className="text-indigo-100">Your Personal Wellness Assistant</p>
        </div>
        
        <div className="p-8">
          {authStep === 'CREDENTIALS' ? (
            <>
              <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-lg">
                <button 
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  onClick={() => toggleMode(true)}
                >
                  Log In
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isLogin ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  onClick={() => toggleMode(false)}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmitCredentials} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 flex justify-center items-center"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    isLogin ? 'Access Dashboard' : 'Create Account'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setAuthStep('CREDENTIALS')} 
                className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to details
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                   </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Verify Email</h2>
                <p className="text-sm text-slate-500 mt-1">
                  We've sent a 6-digit code to <span className="font-semibold">{formData.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="text-center text-3xl tracking-widest font-bold w-48 py-3 border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none bg-transparent placeholder-slate-300"
                    autoFocus
                  />
                </div>

                <button 
                  type="submit"
                  disabled={otpInput.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Verify Code
                </button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-500">
                  Didn't receive code?{' '}
                  <button onClick={resendOtp} className="text-indigo-600 font-semibold hover:underline">
                    Resend
                  </button>
                </p>
              </div>
            </div>
          )}
          
          <p className="text-xs text-center text-slate-400 mt-6">
            By continuing, you agree to allow AI analysis of your health data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
