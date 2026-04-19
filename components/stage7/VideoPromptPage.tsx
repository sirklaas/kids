'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import VideoPromptCard, { type PromptField } from './VideoPromptCard'
import { updateStoryCard } from '@/lib/story-cards'
import type { Character, Project, StoryCard as StoryCardType, Act } from '@/lib/types'

const ACT_ORDER: Act[] = ['beginning', 'middle', 'end']
const ACT_LABELS: Record<Act, string> = {
  beginning: 'BEGINNING',
  middle: 'MIDDLE',
  end: 'END',
}

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

function buildCharacterProfile(c: Character): string {
  return [
    c.personality && `Personality: ${c.personality}`,
    c.visual_description && `Appearance: ${c.visual_description}`,
    c.voice_style && `Voice: ${c.voice_style}`,
    c.backstory && `Backstory: ${c.backstory}`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface VideoPromptPageProps {
  project: Project
  character: Character
  act: Act
  initialCards: StoryCardType[]
}

export default function VideoPromptPage({
  project,
  character,
  act,
  initialCards,
}: VideoPromptPageProps) {
  const [cards, setCards] = useState(initialCards)
  const cardsRef = useRef(initialCards)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actIndex = ACT_ORDER.indexOf(act)
  const backHref = `/project/${project.id}/story/${act}`

  function handleUpdateField(id: string, field: PromptField, value: string) {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      cardsRef.current = next
      return next
    })
    updateStoryCard(id, { [field]: value })
  }

  async function handleRegenerate(id: string) {
    setRegeneratingId(id)
    setError(null)
    try {
      const card = cardsRef.current.find((c) => c.id === id)
      if (!card) return
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage7_regenerate_prompt',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            clip_label: clipLabel(act, card.expand?.plot_card_id?.order ?? 0),
            written_scene: card.written_scene,
            scene_beat: card.expand?.plot_card_id?.scene_beat ?? '',
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '{}'
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = {}
      }
      const str = (v: unknown) => (typeof v === 'string' ? v : '')
      const updated = {
        environment: str(parsed.environment),
        characters: str(parsed.characters),
        voice_over: str(parsed.voice_over),
        spoken_text: str(parsed.spoken_text),
        sound_effects: str(parsed.sound_effects),
        music: str(parsed.music),
      }
      await updateStoryCard(id, updated)
      setCards((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        cardsRef.current = next
        return next
      })
    } catch {
      setError('Could not regenerate prompt. Please try again.')
    } finally {
      setRegeneratingId(null)
    }
  }

  function handleSendToVideoAI(_id: string) {
    // Stubbed — Video AI integration not yet implemented
  }

  function handleSendAll() {
    // Stubbed — Video AI integration not yet implemented
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col gap-1.5">
          <div className="label">{project.selected_title || 'Video Project'}</div>
          <div className="act-indicator">
            {ACT_ORDER.map((a, i) => {
              const isActive = a === act
              const isDone = i < actIndex
              if (!isActive && !isDone) {
                return (
                  <span key={a} className="act-indicator-locked">
                    {ACT_LABELS[a]}
                  </span>
                )
              }
              return (
                <Link
                  key={a}
                  href={`/project/${project.id}/prompts/${a}`}
                  className={
                    isActive
                      ? 'act-indicator-active'
                      : 'act-indicator-done hover:text-white/60 transition-colors'
                  }
                >
                  {ACT_LABELS[a]}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <VideoPromptCard
              key={card.id}
              card={card}
              onUpdateField={handleUpdateField}
              onRegenerate={handleRegenerate}
              onSendToVideoAI={handleSendToVideoAI}
              regenerating={regeneratingId === card.id}
              sending={sendingId === card.id}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
        <Link href={backHref} className="btn btn-ghost">
          ← Back
        </Link>
        <div className="flex flex-col items-end gap-2">
          <button
            className="btn btn-primary"
            onClick={handleSendAll}
            disabled={regeneratingId !== null || sendingId !== null}
          >
            ▶ Send All to Video AI
          </button>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  )
}
