'use client'

import { useState } from 'react'

interface StoryIdeaSectionProps {
  characterName: string
  characterProfile: string
  initialStoryIdea: string
  locked: boolean
  onGenerateTitles: (storyIdea: string) => Promise<void>
}

export default function StoryIdeaSection({
  characterName,
  characterProfile,
  initialStoryIdea,
  locked,
  onGenerateTitles,
}: StoryIdeaSectionProps) {
  const [storyIdea, setStoryIdea] = useState(initialStoryIdea)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage2_regenerate',
          values: {
            character_name: characterName,
            character_profile: characterProfile,
            current_idea: storyIdea,
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : ''
      setStoryIdea(text.trim())
    } catch {
      setError('Could not regenerate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateTitles() {
    if (!storyIdea.trim()) return
    setLoading(true)
    setError(null)
    try {
      await onGenerateTitles(storyIdea)
    } catch {
      setError('Could not generate titles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="label">Stage 2 — Story Idea</span>
        <span className="stage-label">{characterName}</span>
      </div>
      <div className="card-body flex flex-col gap-4">
        <textarea
          className="textarea"
          rows={4}
          placeholder="What is this video about? Describe the story direction…"
          value={storyIdea}
          onChange={(e) => setStoryIdea(e.target.value)}
          disabled={locked}
        />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-ghost"
              onClick={handleRegenerate}
              disabled={loading || locked}
            >
              ↻ Regenerate
            </button>
            {!locked && (
              <button
                className="btn btn-primary"
                onClick={handleGenerateTitles}
                disabled={loading || !storyIdea.trim()}
              >
                {loading ? 'Generating…' : 'Generate Titles →'}
              </button>
            )}
          </div>
          {error && <div className="text-xs text-red-400 text-right">{error}</div>}
        </div>
      </div>
    </div>
  )
}
