'use client'

import { useState } from 'react'
import type { Synopsis } from '@/lib/types'

interface SynopsisCardProps {
  synopsis: Synopsis
  characterName: string
  storyIdea: string
  onUpdate: (id: string, data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>) => void
  onExecute: (id: string) => Promise<void>
}

export default function SynopsisCard({
  synopsis,
  characterName,
  storyIdea,
  onUpdate,
  onExecute,
}: SynopsisCardProps) {
  const [beginning, setBeginning] = useState(synopsis.beginning)
  const [middle, setMiddle] = useState(synopsis.middle)
  const [end, setEnd] = useState(synopsis.end)
  const [loading, setLoading] = useState(false)

  function getField(label: string): string {
    if (label === 'Beginning') return beginning
    if (label === 'Middle') return middle
    return end
  }

  function setField(label: string, value: string) {
    if (label === 'Beginning') setBeginning(value)
    else if (label === 'Middle') setMiddle(value)
    else setEnd(value)
    onUpdate(synopsis.id, {
      beginning: label === 'Beginning' ? value : beginning,
      middle: label === 'Middle' ? value : middle,
      end: label === 'End' ? value : end,
    })
  }

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage4_regenerate_synopsis',
          values: {
            character_name: characterName,
            story_idea: storyIdea,
            title: synopsis.title,
            subtitle: synopsis.subtitle,
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : ''
      let parsed: { beginning?: unknown; middle?: unknown; end?: unknown }
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = {}
      }
      const newBeginning = typeof parsed.beginning === 'string' ? parsed.beginning : beginning
      const newMiddle = typeof parsed.middle === 'string' ? parsed.middle : middle
      const newEnd = typeof parsed.end === 'string' ? parsed.end : end
      setBeginning(newBeginning)
      setMiddle(newMiddle)
      setEnd(newEnd)
      onUpdate(synopsis.id, { beginning: newBeginning, middle: newMiddle, end: newEnd })
    } finally {
      setLoading(false)
    }
  }

  async function handleExecute() {
    setLoading(true)
    try {
      await onExecute(synopsis.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="heading-3 text-sm">{synopsis.title}</div>
          {synopsis.subtitle && (
            <div className="text-xs text-white/40 mt-0.5">{synopsis.subtitle}</div>
          )}
        </div>
      </div>
      <div className="card-body flex flex-col gap-4">
        {(['Beginning', 'Middle', 'End'] as const).map((label) => (
          <div key={label}>
            <label className="field-label">{label}</label>
            <textarea
              className="textarea"
              rows={3}
              value={getField(label)}
              onChange={(e) => setField(label, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="card-footer">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRegenerate}
          disabled={loading}
        >
          ↻ Regenerate
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleExecute}
          disabled={loading || !beginning || !middle || !end}
        >
          {loading ? 'Generating Plotboard…' : 'Execute →'}
        </button>
      </div>
    </div>
  )
}
