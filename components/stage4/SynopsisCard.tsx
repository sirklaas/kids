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

function mergeText(b: string, m: string, e: string): string {
  return [b, m, e].filter(Boolean).join('\n\n')
}

function splitText(text: string): [string, string, string] {
  const parts = text.split(/\n\n+/)
  return [parts[0] ?? '', parts[1] ?? '', parts[2] ?? '']
}

export default function SynopsisCard({
  synopsis,
  characterName,
  storyIdea,
  onUpdate,
  onExecute,
}: SynopsisCardProps) {
  const [beginning, setBeginning] = useState(synopsis.beginning ?? '')
  const [middle, setMiddle] = useState(synopsis.middle ?? '')
  const [end, setEnd] = useState(synopsis.end ?? '')
  const [loading, setLoading] = useState(false)

  function handleChange(value: string) {
    const [b, m, e] = splitText(value)
    setBeginning(b)
    setMiddle(m)
    setEnd(e)
    onUpdate(synopsis.id, { beginning: b, middle: m, end: e })
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
            variation_angle: 'fresh and different from the current version',
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
    <div className="card flex flex-col h-full">
      <div className="card-body flex flex-col gap-3 flex-1">
        <textarea
          className="textarea text-xs flex-1"
          rows={4}
          value={mergeText(beginning, middle, end)}
          onChange={(e) => handleChange(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <button
            className="btn btn-primary btn-sm w-full"
            onClick={handleExecute}
            disabled={loading || !beginning}
          >
            {loading ? 'Generating…' : 'Execute →'}
          </button>
          <button
            className="btn btn-ghost btn-sm w-full"
            onClick={handleRegenerate}
            disabled={loading}
          >
            ↻ Regenerate
          </button>
        </div>
      </div>
    </div>
  )
}
