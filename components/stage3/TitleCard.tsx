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
      let parsed: { title?: unknown; subtitle?: unknown }
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = {}
      }
      const newTitle = typeof parsed.title === 'string' ? parsed.title : title
      const newSubtitle = typeof parsed.subtitle === 'string' ? parsed.subtitle : subtitle
      setTitle(newTitle)
      setSubtitle(newSubtitle)
      onUpdate(synopsis.id, newTitle, newSubtitle)
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
      <div className="card-body flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-2">
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
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            className="btn btn-primary"
            onClick={handleUse}
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Use this →'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
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
