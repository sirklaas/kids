'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StoryCard from './StoryCard'
import { updateStoryCard } from '@/lib/story-cards'
import { updateProject } from '@/lib/projects'
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

interface StoryPageProps {
  project: Project
  character: Character
  act: Act
  initialCards: StoryCardType[]
}

export default function StoryPage({ project, character, act, initialCards }: StoryPageProps) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const cardsRef = useRef(initialCards)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [generatingPromptId, setGeneratingPromptId] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kids:stage', { detail: 6 }))
  }, [])

  // Auto-regenerate stories that are empty on initial load
  const [autoGenerating, setAutoGenerating] = useState(false)
  useEffect(() => {
    async function fillEmptyStories() {
      const emptyCards = cardsRef.current.filter((c) => !c.written_scene || c.written_scene.trim() === '')
      if (emptyCards.length === 0) return

      setAutoGenerating(true)
      setError(null)
      let hasError = false

      for (const card of emptyCards) {
        try {
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'stage6_regenerate_scene',
              values: {
                character_name: character.name,
                character_profile: buildCharacterProfile(character),
                act,
                scene_beat: card.expand?.plot_card_id?.scene_beat ?? '',
                clip_label: clipLabel(act, card.expand?.plot_card_id?.order ?? 0),
              },
            }),
          })
          if (!res.ok) throw new Error(res.statusText)
          const data = await res.json()
          const writtenScene = typeof data?.text === 'string' ? data.text : ''
          await updateStoryCard(card.id, { written_scene: writtenScene })
          setCards((prev) => {
            const next = prev.map((c) => (c.id === card.id ? { ...c, written_scene: writtenScene } : c))
            cardsRef.current = next
            return next
          })
        } catch {
          hasError = true
        }
      }

      if (hasError) {
        setError('Some stories could not be generated. Click "Regenerate" to try again.')
      }
      setAutoGenerating(false)
    }
    fillEmptyStories()
  }, [])

  const actIndex = ACT_ORDER.indexOf(act)
  const backHref = `/project/${project.id}/plotboard/${act}`

  function handleUpdate(id: string, writtenScene: string) {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, written_scene: writtenScene } : c))
      cardsRef.current = next
      return next
    })
    updateStoryCard(id, { written_scene: writtenScene })
  }

  async function handleRegenerate(id: string) {
    const card = cardsRef.current.find((c) => c.id === id)
    if (!card) return
    setRegeneratingId(id)
    setError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage6_regenerate_scene',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            scene_beat: card.expand?.plot_card_id?.scene_beat ?? '',
            clip_label: clipLabel(act, card.expand?.plot_card_id?.order ?? 0),
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const writtenScene = typeof data?.text === 'string' ? data.text : ''
      await updateStoryCard(id, { written_scene: writtenScene })
      setCards((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, written_scene: writtenScene } : c))
        cardsRef.current = next
        return next
      })
    } catch {
      setError('Could not regenerate scene. Please try again.')
    } finally {
      setRegeneratingId(null)
    }
  }

  async function handleGeneratePrompt(id: string) {
    const card = cardsRef.current.find((c) => c.id === id)
    if (!card) return
    setGeneratingPromptId(id)
    setError(null)
    try {
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
      await updateStoryCard(id, {
        environment: str(parsed.environment),
        characters: str(parsed.characters),
        voice_over: str(parsed.voice_over),
        spoken_text: str(parsed.spoken_text),
        sound_effects: str(parsed.sound_effects),
        music: str(parsed.music),
      })
      router.push(`/project/${project.id}/prompts/${act}`)
    } catch {
      setError('Could not generate video prompt. Please try again.')
    } finally {
      setGeneratingPromptId(null)
    }
  }

  async function handleExecuteAll() {
    setExecuting(true)
    setError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage7_generate_prompts',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            scenes_json: JSON.stringify(
              cardsRef.current.map((c) => ({
                clip_label: clipLabel(act, c.expand?.plot_card_id?.order ?? 0),
                written_scene: c.written_scene,
                scene_beat: c.expand?.plot_card_id?.scene_beat ?? '',
              }))
            ),
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '[]'
      let prompts: unknown[]
      try {
        prompts = JSON.parse(text)
      } catch {
        prompts = []
      }
      if (!Array.isArray(prompts)) prompts = []

      await Promise.all(
        cardsRef.current.map((card, i) => {
          const raw = prompts[i]
          const s =
            raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
          const str = (v: unknown) => (typeof v === 'string' ? v : '')
          return updateStoryCard(card.id, {
            environment: str(s.environment),
            characters: str(s.characters),
            voice_over: str(s.voice_over),
            spoken_text: str(s.spoken_text),
            sound_effects: str(s.sound_effects),
            music: str(s.music),
          })
        })
      )

      if (project.stage_reached < 7) {
        await updateProject(project.id, { stage_reached: 7 })
      }

      router.push(`/project/${project.id}/prompts/${act}`)
    } catch {
      setError('Could not generate video prompts. Please try again.')
    } finally {
      setExecuting(false)
    }
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
                  href={`/project/${project.id}/story/${a}`}
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
        <div className={`grid gap-6 ${act === 'middle' ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {cards.map((card) => (
            <StoryCard
              key={card.id}
              card={card}
              onUpdate={handleUpdate}
              onRegenerate={handleRegenerate}
              onGeneratePrompt={handleGeneratePrompt}
              regenerating={regeneratingId === card.id || (autoGenerating && (!card.written_scene || card.written_scene.trim() === ''))}
              generatingPrompt={generatingPromptId === card.id}
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
            onClick={handleExecuteAll}
            disabled={executing || regeneratingId !== null || generatingPromptId !== null}
          >
            {executing ? 'Generating prompts…' : `Execute ${ACT_LABELS[act]} → Video Prompts`}
          </button>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  )
}
