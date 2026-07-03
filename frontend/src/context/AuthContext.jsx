import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)

  const applyMe = (u) => {
    setUser(u)
    setBilling(u?.billing || null)
  }

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('hg_token')
    if (!token) { setUser(null); setBilling(null); setLoading(false); return }
    try {
      const { data } = await api.get('/auth/me')
      applyMe(data.user)
    } catch {
      localStorage.removeItem('hg_token'); setUser(null); setBilling(null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('hg_token', data.token); applyMe(data.user); return data.user
  }
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('hg_token', data.token); applyMe(data.user); return data.user
  }
  const logout = () => { localStorage.removeItem('hg_token'); setUser(null); setBilling(null) }
  const refreshBilling = async () => {
    try { const { data } = await api.get('/billing/status'); setBilling(data); return data } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, billing, loading, login, register, logout, refresh, refreshBilling }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
