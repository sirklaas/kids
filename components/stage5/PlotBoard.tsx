'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PlotCard from './PlotCard'
import { updatePlotCard } from '@/lib/plot-cards'
import { updateProject } from '@/lib/projects'
import { createStoryCard, deleteStoryCardsForAct } from '@/lib/story-cards'
import type { Character, Project, PlotCard as PlotCardType, Act } from '@/lib/types'

const ACT_ORDER: Act[] = ['beginning', 'middle', 'end']
const ACT_LABELS: Record<Act, string> = {
  beginning: 'BEGINNING',
  middle: 'MIDDLE',
  end: 'END',
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

interface PlotBoardProps {
  project: Project
  character: Character
  act: Act
  initialCards: PlotCardType[]
}

export default function PlotBoard({ project, character, act, initialCards }: PlotBoardProps) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const [executing, setExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<string | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const cardsRef = useRef(initialCards)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kids:stage', { detail: 5 }))
  }, [])

  const actIndex = ACT_ORDER.indexOf(act)
  const prevAct = actIndex > 0 ? ACT_ORDER[actIndex - 1] : null
  const nextAct = actIndex < ACT_ORDER.length - 1 ? ACT_ORDER[actIndex + 1] : null
  const backHref = prevAct
    ? `/project/${project.id}/plotboard/${prevAct}`
    : `/project/${project.id}`

  function handleUpdate(id: string, sceneBeat: string, durationSec: number) {
    setCards((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, scene_beat: sceneBeat, duration_sec: durationSec } : c
      )
      cardsRef.current = next
      return next
    })
    updatePlotCard(id, { scene_beat: sceneBeat, duration_sec: durationSec })
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragOver(index: number) {
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    const fromIndex = dragIndexRef.current
    dragIndexRef.current = index
    setCards((prev) => {
      const next = [...prev]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(index, 0, removed)
      cardsRef.current = next
      return next
    })
  }

  async function handleDrop() {
    if (dragIndexRef.current === null) return
    dragIndexRef.current = null
    const currentCards = cardsRef.current
    try {
      await Promise.all(
        currentCards.map((card, i) => updatePlotCard(card.id, { order: i + 1 }))
      )
    } catch {
      setReorderError('Could not save new order. Please try again.')
    }
  }

  async function handleExecute() {
    setExecuting(true)
    setExecuteError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage6_write_scenes',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            scene_beats_json: JSON.stringify(cardsRef.current.map((c) => c.scene_beat)),
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '[]'
      let scenes: unknown[]
      try {
        scenes = JSON.parse(text)
      } catch {
        scenes = []
      }
      if (!Array.isArray(scenes)) scenes = []

      await deleteStoryCardsForAct(project.id, act)

      await Promise.all(
        cardsRef.current.map((card, i) => {
          const raw = scenes[i]
          const s =
            raw !== null && typeof raw === 'object'
              ? (raw as Record<string, unknown>)
              : {}
          const str = (v: unknown) => (typeof v === 'string' ? v : '')
          return createStoryCard({
            plot_card_id: card.id,
            project_id: project.id,
            written_scene: str(s.written_scene),
            environment: str(s.environment),
            characters: str(s.characters),
            voice_over: str(s.voice_over),
            spoken_text: str(s.spoken_text),
            sound_effects: str(s.sound_effects),
            music: str(s.music),
          })
        })
      )

      if (project.stage_reached < 6) {
        await updateProject(project.id, { stage_reached: 6 })
      }

      router.push(`/project/${project.id}/story/${act}`)
    } catch {
      setExecuteError('Could not generate scenes. Please try again.')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col gap-0.5">
          <div className="label mb-0.5">{character.name}</div>
          <h1 className="heading-2 leading-tight">{project.selected_title || 'Video Project'}</h1>
          {project.selected_subtitle && (
            <div className="text-sm text-white/40">{project.selected_subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={prevAct ? `/project/${project.id}/plotboard/${prevAct}` : `/project/${project.id}`}
            className="btn btn-ghost btn-sm"
          >
            ←
          </Link>
          {ACT_ORDER.map((a, i) => {
            const isActive = a === act
            const isLocked = i > actIndex
            if (isLocked) {
              return (
                <button key={a} className="btn btn-ghost btn-sm opacity-30" disabled>
                  {ACT_LABELS[a]}
                </button>
              )
            }
            return (
              <Link
                key={a}
                href={`/project/${project.id}/plotboard/${a}`}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              >
                {ACT_LABELS[a]}
              </Link>
            )
          })}
          {nextAct && actIndex >= ACT_ORDER.indexOf(nextAct) - 1 && (
            <Link href={`/project/${project.id}/plotboard/${nextAct}`} className="btn btn-ghost btn-sm">
              →
            </Link>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-3 gap-10">
          {cards.map((card, index) => (
            <PlotCard
              key={card.id}
              card={card}
              index={index}
              act={act}
              onUpdate={handleUpdate}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
        <div className="flex flex-col gap-2 items-start">
          <Link href={backHref} className="btn btn-ghost">
            ← Back
          </Link>
          {reorderError && (
            <div className="text-xs text-red-400">{reorderError}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={executing}
          >
            {executing
              ? 'Generating scenes…'
              : `Execute ${ACT_LABELS[act]} → Story Page`}
          </button>
          {executeError && (
            <div className="text-xs text-red-400">{executeError}</div>
          )}
        </div>
      </div>
    </div>
  )
}
