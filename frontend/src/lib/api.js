import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) || ''

// Vite uses import.meta.env, prefixed with VITE_. But we want to use REACT_APP_BACKEND_URL directly.
// Read directly from environment via a runtime-safe way.
function resolveBackend() {
  try {
    if (import.meta && import.meta.env) {
      return import.meta.env.REACT_APP_BACKEND_URL
        || import.meta.env.VITE_REACT_APP_BACKEND_URL
        || ''
    }
  } catch {}
  return ''
}

export const API_BASE = (resolveBackend() || '').replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 120000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function formatApiError(err) {
  const detail = err?.response?.data?.detail
  if (detail == null) return err?.message || 'Something went wrong.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(e => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).join(' ')
  if (detail && typeof detail.msg === 'string') return detail.msg
  return String(detail)
}
