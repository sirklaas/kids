'use client'

import { useEffect, useState } from 'react'
import type { AILogEntry } from '@/lib/ai-logs'
import { formatRelativeTime } from '@/lib/ai-logs'

interface AILogPanelProps {
  logs: AILogEntry[]
}

function StatusIcon({ status }: { status: AILogEntry['status'] }) {
  if (status === 'pending') {
    return (
      <span className="animate-spin text-indigo-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </span>
    )
  }
  if (status === 'success') {
    return (
      <span className="text-green-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  return (
    <span className="text-red-400">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  )
}

function TokenBadge({ tokens, label }: { tokens?: number; label: 'in' | 'out' }) {
  if (!tokens) return null
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded ${
        label === 'in'
          ? 'bg-blue-500/15 text-blue-400/70'
          : 'bg-purple-500/15 text-purple-400/70'
      }`}
    >
      {label === 'in' ? '↑' : '↓'} {tokens < 1000 ? tokens : `${(tokens / 1000).toFixed(1)}k`}
    </span>
  )
}

function LogEntry({ log }: { log: AILogEntry }) {
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(log.timestamp))

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(log.timestamp))
    }, 5000)
    return () => clearInterval(interval)
  }, [log.timestamp])

  const totalTokens = (log.inputTokens || 0) + (log.outputTokens || 0)

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-white/[0.03] transition-colors">
      <StatusIcon status={log.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70 truncate">{log.actionName}</span>
          {log.model && (
            <span className="text-[10px] text-white/30 truncate">{log.model}</span>
          )}
        </div>
        {log.error && <div className="text-[10px] text-red-400/80 truncate">{log.error}</div>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {totalTokens > 0 && (
          <>
            <TokenBadge tokens={log.inputTokens} label="in" />
            <TokenBadge tokens={log.outputTokens} label="out" />
          </>
        )}
        <span className="text-[10px] text-white/25 w-14 text-right">{relativeTime}</span>
      </div>
    </div>
  )
}

export default function AILogPanel({ logs }: AILogPanelProps) {
  if (logs.length === 0) return null

  return (
    <div className="mt-3 border border-white/10 rounded-lg bg-black/20 overflow-hidden">
      <div className="px-3 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
          AI Operations
        </span>
        <span className="text-[10px] text-white/30">{logs.length}</span>
      </div>
      <div className="max-h-40 overflow-y-auto py-1">
        {logs.map((log) => (
          <LogEntry key={log.id} log={log} />
        ))}
      </div>
    </div>
  )
}
