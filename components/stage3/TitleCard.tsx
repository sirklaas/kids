'use client'

import { useState } from 'react'
import type { Synopsis } from '@/lib/types'

interface TitleCardProps {
  synopsis: Synopsis
  characterName: string
  storyIdea: string
  onUpdate: (id: string, title: string, subtitle: string) => void
  onUse: (id: string) => Promise<void>
}

export default function TitleCard({
  synopsis,
  characterName,
  storyIdea,
  onUpdate,
  onUse,
}: TitleCardProps) {
  const [title, setTitle] = useState(synopsis.title)
  const [subtitle, setSubtitle] = useState(synopsis.subtitle)
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage3_regenerate_title',
          values: {
            character_name: characterName,
            story_idea: storyIdea,
            current_title: title,
            current_subtitle: subtitle,
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : ''
      const parsed = JSON.parse(text) as { title: string; subtitle: string }
      setTitle(parsed.title)
      setSubtitle(parsed.subtitle)
      onUpdate(synopsis.id, parsed.title, parsed.subtitle)
    } finally {
      setLoading(false)
    }
  }

  async function handleUse() {
    setLoading(true)
    try {
      await onUse(synopsis.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-body flex flex-col gap-3">
        <input
          className="input"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            onUpdate(synopsis.id, e.target.value, subtitle)
          }}
          placeholder="Title"
        />
        <input
          className="input"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value)
            onUpdate(synopsis.id, title, e.target.value)
          }}
          placeholder="Subtitle"
        />
      </div>
      <div className="card-footer">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRegenerate}
          disabled={loading}
        >
          ↻ Regenerate This
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleUse}
          disabled={loading}
        >
          {loading ? 'Generating synopses…' : 'Use →'}
        </button>
      </div>
    </div>
  )
}
