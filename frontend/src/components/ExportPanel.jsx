import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileJson, FileSpreadsheet, FileText, Download, Check, Loader2 } from 'lucide-react'
import { API_BASE } from '../lib/api.js'

const FORMATS = [
  { id: 'json', label: 'JSON', icon: FileJson, description: 'Machine-readable structured data', ext: 'json' },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet-compatible rows', ext: 'csv' },
  { id: 'pdf', label: 'PDF', icon: FileText, description: 'Formatted printable report', ext: 'pdf' },
]

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
]

const DATA_TYPES = ['Activity', 'Nutrition', 'Journal', 'Devices', 'Chat']

const ESTIMATES = {
  Activity: 30,
  Nutrition: 45,
  Journal: 12,
  Devices: 8,
  Chat: 156,
}

export default function ExportPanel() {
  const [selectedFormat, setSelectedFormat] = useState('json')
  const [dateRange, setDateRange] = useState('30d')
  const [selectedTypes, setSelectedTypes] = useState(['Activity', 'Nutrition', 'Journal', 'Chat'])
  const [loading, setLoading] = useState(false)

  const allSelected = selectedTypes.length === DATA_TYPES.length

  const toggleAll = () => {
    if (allSelected) setSelectedTypes([])
    else setSelectedTypes([...DATA_TYPES])
  }

  const toggleType = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  const estimatedTotal = useMemo(() => {
    return selectedTypes.reduce((sum, t) => sum + (ESTIMATES[t] || 0), 0)
  }, [selectedTypes])

  const handleDownload = () => {
    const format = FORMATS.find(f => f.id === selectedFormat)
    if (!format) return
    setLoading(true)
    const url = `${API_BASE}/api/export/all.${format.ext}`
    window.open(url, '_blank')
    setTimeout(() => setLoading(false), 1200)
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] } })
  }

  return (
    <div className="space-y-6" data-testid="export-panel">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="font-display text-2xl text-ink">Data Export</h2>
        <p className="text-sm text-muted mt-1">Download your complete health ledger</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        {FORMATS.map((fmt, i) => {
          const Icon = fmt.icon
          const active = selectedFormat === fmt.id
          return (
            <motion.div
              key={fmt.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="show"
              onClick={() => setSelectedFormat(fmt.id)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
                active ? 'border-teal bg-teal/[0.04] shadow-card' : 'border-border bg-white hover:border-teal/30'
              }`}
              data-testid={`export-format-${fmt.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-full grid place-items-center ${active ? 'bg-teal text-white' : 'bg-bg text-ink2'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {active && <Check className="w-4 h-4 text-teal" />}
              </div>
              <div className="font-medium text-ink text-sm mb-1">{fmt.label}</div>
              <div className="text-xs text-muted">{fmt.description}</div>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="card p-6"
        data-testid="export-options"
      >
        <h3 className="font-display text-lg mb-4">Date Range</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {DATE_RANGES.map(range => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                dateRange === range.id
                  ? 'bg-teal text-white'
                  : 'border border-border text-ink2 hover:border-teal/40 hover:text-teal'
              }`}
              data-testid={`date-range-${range.id}`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <h3 className="font-display text-lg mb-4">Data Types</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={toggleAll}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
              allSelected
                ? 'bg-teal text-white'
                : 'border border-border text-ink2 hover:border-teal/40 hover:text-teal'
            }`}
            data-testid="data-type-all"
          >
            All
          </button>
          {DATA_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                selectedTypes.includes(type)
                  ? 'bg-teal text-white'
                  : 'border border-border text-ink2 hover:border-teal/40 hover:text-teal'
              }`}
              data-testid={`data-type-${type.toLowerCase()}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="bg-bg rounded-2xl p-4 border border-border mb-6" data-testid="export-preview">
          <h4 className="text-[11px] uppercase tracking-[0.2em] text-muted mb-3">Estimated Export</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {selectedTypes.map(type => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-ink2">{type}:</span>
                <span className="font-mono text-ink tabular-nums">{ESTIMATES[type] || 0}</span>
                <span className="text-muted text-xs">records</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">Total estimated records</span>
            <span className="font-mono text-lg text-teal tabular-nums">{estimatedTotal}</span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={loading || selectedTypes.length === 0}
          className="w-full md:w-auto px-8 py-3 rounded-full bg-teal text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          data-testid="export-download"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download {FORMATS.find(f => f.id === selectedFormat)?.label}
        </button>
      </motion.div>
    </div>
  )
}
