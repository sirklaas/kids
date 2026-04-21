'use client'

import { useState, useCallback } from 'react'

export interface AILogEntry {
  id: string
  timestamp: Date
  stage: number
  promptKey: string
  actionName: string
  status: 'pending' | 'success' | 'error'
  model?: string
  provider?: 'anthropic' | 'openrouter'
  inputTokens?: number
  outputTokens?: number
  error?: string
}

// Simple token estimator: ~4 characters per token for English text
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Generate a short ID
function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

// Format relative time like "2s ago"
export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 120) return '1m ago'
  return `${Math.floor(seconds / 60)}m ago`
}

// Get human-readable action name from prompt key
export function getActionName(promptKey: string): string {
  const names: Record<string, string> = {
    stage2_regenerate: 'Regenerate Story Idea',
    stage3_generate_titles: 'Generate Titles',
    stage4_regenerate_synopsis: 'Regenerate Synopsis',
    stage5_generate_plotboard: 'Generate Plotboard',
    stage6_write_scenes: 'Write Scenes',
    stage6_regenerate_scene: 'Regenerate Scene',
    stage7_generate_prompts: 'Generate Video Prompts',
    stage7_regenerate_prompt: 'Regenerate Prompt',
  }
  return names[promptKey] || promptKey
}

export function useAILogs(stage: number) {
  const [logs, setLogs] = useState<AILogEntry[]>([])

  const addLog = useCallback((log: Omit<AILogEntry, 'id' | 'timestamp'>) => {
    const entry: AILogEntry = {
      ...log,
      id: generateId(),
      timestamp: new Date(),
    }
    setLogs((prev) => [entry, ...prev])
    return entry.id
  }, [])

  const updateLog = useCallback((id: string, updates: Partial<AILogEntry>) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, ...updates } : log))
    )
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return { logs, addLog, updateLog, clearLogs }
}

// Helper to wrap an AI call with logging
interface AICallOptions {
  stage: number
  promptKey: string
  values: Record<string, string>
  addLog: (log: Omit<AILogEntry, 'id' | 'timestamp'>) => string
  updateLog: (id: string, updates: Partial<AILogEntry>) => void
}

interface AIResponse {
  text: string
  model?: string
  provider?: 'anthropic' | 'openrouter'
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

export async function callAIWithLogging(
  options: AICallOptions,
  fetchFn: () => Promise<Response>
): Promise<AIResponse> {
  const { promptKey, values, addLog, updateLog } = options

  // Calculate estimated input tokens from values
  const inputText = Object.values(values).join(' ')
  const estimatedInputTokens = estimateTokens(inputText)

  const logId = addLog({
    stage: options.stage,
    promptKey,
    actionName: getActionName(promptKey),
    status: 'pending',
    inputTokens: estimatedInputTokens,
  })

  try {
    const res = await fetchFn()

    if (!res.ok) {
      const error = `HTTP ${res.status}`
      updateLog(logId, { status: 'error', error })
      throw new Error(error)
    }

    const data: AIResponse = await res.json()

    // Use actual token counts if available, otherwise estimate from output
    const inputTokens = data.usage?.input_tokens ?? estimatedInputTokens
    const outputTokens = data.usage?.output_tokens ?? estimateTokens(data.text)

    updateLog(logId, {
      status: 'success',
      model: data.model,
      provider: data.provider,
      inputTokens,
      outputTokens,
    })

    return data
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    updateLog(logId, { status: 'error', error })
    throw err
  }
}
