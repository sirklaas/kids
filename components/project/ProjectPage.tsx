'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StoryIdeaSection from '@/components/stage2/StoryIdeaSection'
import TitlesSection from '@/components/stage3/TitlesSection'
import SynopsisSection from '@/components/stage4/SynopsisSection'
import { updateProject } from '@/lib/projects'
import { getSynopsesForProject, createSynopsis, updateSynopsis, deleteSynopsis } from '@/lib/synopses'
import { createPlotCardsForProject } from '@/lib/plot-cards'
import type { Character, Project, Synopsis } from '@/lib/types'

interface ProjectPageProps {
  project: Project
  character: Character
  initialSynopses: Synopsis[]
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

type Stage = 2 | 3 | 4

function computeInitialStage(synopses: Synopsis[]): Stage {
  if (synopses.length > 0 && synopses.some((s) => s.beginning)) return 4
  if (synopses.length > 0) return 3
  return 2
}

export default function ProjectPage({
  project,
  character,
  initialSynopses,
}: ProjectPageProps) {
  const router = useRouter()
  const initialStage = computeInitialStage(initialSynopses)
  const [stage, setStage] = useState<Stage>(initialStage)
  const [synopses, setSynopses] = useState<Synopsis[]>(initialSynopses)
  const [generatingSynopses, setGeneratingSynopses] = useState(false)
  const [storyIdea, setStoryIdea] = useState(project.story_idea || '')
  const [executeError, setExecuteError] = useState<string | null>(null)
  const [stage2Exiting, setStage2Exiting] = useState(false)
  const [stage2Gone, setStage2Gone] = useState(initialStage >= 3)
  const [titlesEntering, setTitlesEntering] = useState(false)
  const [stage3Exiting, setStage3Exiting] = useState(false)
  const [stage3Gone, setStage3Gone] = useState(initialStage >= 4)
  const [synopsesEntering, setSynopsesEntering] = useState(false)

  const profile = buildCharacterProfile(character)

  async function handleGenerateTitles(idea: string) {
    setStoryIdea(idea)

    const existing = await getSynopsesForProject(project.id)
    if (existing.length > 0) {
      await Promise.all(existing.map((s) => deleteSynopsis(s.id)))
    }

    await updateProject(project.id, { story_idea: idea, stage_reached: 3 })

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'stage3_generate_titles',
        values: { character_name: character.name, story_idea: idea },
      }),
    })
    if (!res.ok) throw new Error(res.statusText)
    const data = await res.json()
    const text = typeof data?.text === 'string' ? data.text : '[]'
    let pairs: { title: string; subtitle: string }[]
    try {
      pairs = JSON.parse(text)
    } catch {
      pairs = []
    }
    if (!Array.isArray(pairs)) pairs = []

    const created = await Promise.all(
      pairs.slice(0, 5).map((pair) =>
        createSynopsis({
          project_id: project.id,
          title: typeof pair.title === 'string' ? pair.title : '',
          subtitle: typeof pair.subtitle === 'string' ? pair.subtitle : '',
        })
      )
    )
    setSynopses(created)
    setStage2Exiting(true)
    setTimeout(() => {
      setStage2Gone(true)
      setTitlesEntering(true)
      setStage(3)
      setTimeout(() => setTitlesEntering(false), 450)
    }, 350)
  }

  function handleUpdateTitle(id: string, title: string, subtitle: string) {
    setSynopses((prev) => prev.map((s) => (s.id === id ? { ...s, title, subtitle } : s)))
    updateSynopsis(id, { title, subtitle })
  }

  async function handleSelectTitle(synopsisId: string) {
    const selected = synopses.find((s) => s.id === synopsisId)
    if (!selected) return

    // Start stage 3 exit immediately
    setStage3Exiting(true)
    setTimeout(() => setStage3Gone(true), 350)

    await updateProject(project.id, {
      selected_title: selected.title,
      selected_subtitle: selected.subtitle,
      stage_reached: 4,
    })

    // Delete all title-option synopses, create 4 new synopsis variations for the chosen title
    await Promise.all(synopses.map((s) => deleteSynopsis(s.id)))

    setGeneratingSynopses(true)
    const { title: chosenTitle, subtitle: chosenSubtitle } = selected
    const newSynopses = await Promise.all(
      Array.from({ length: 4 }, async () => {
        const syn = await createSynopsis({
          project_id: project.id,
          title: chosenTitle,
          subtitle: chosenSubtitle,
        })
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'stage4_regenerate_synopsis',
            values: {
              character_name: character.name,
              story_idea: storyIdea,
              title: chosenTitle,
              subtitle: chosenSubtitle,
            },
          }),
        })
        if (!res.ok) throw new Error(res.statusText)
        const resData = await res.json()
        const text = typeof resData?.text === 'string' ? resData.text : '{}'
        let parsed: { beginning?: unknown; middle?: unknown; end?: unknown }
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = {}
        }
        const synData = {
          beginning: typeof parsed.beginning === 'string' ? parsed.beginning : '',
          middle: typeof parsed.middle === 'string' ? parsed.middle : '',
          end: typeof parsed.end === 'string' ? parsed.end : '',
        }
        await updateSynopsis(syn.id, synData)
        return { ...syn, ...synData }
      })
    )
    setSynopses(newSynopses)
    setGeneratingSynopses(false)
    setSynopsesEntering(true)
    setStage(4)
    setTimeout(() => setSynopsesEntering(false), 450)
  }

  function handleUpdateSynopsis(
    id: string,
    data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>
  ) {
    setSynopses((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
    updateSynopsis(id, data)
  }

  async function handleExecuteSynopsis(synopsisId: string) {
    const selected = synopses.find((s) => s.id === synopsisId)
    if (!selected) return
    setExecuteError(null)
    try {
      await Promise.all([
        updateSynopsis(synopsisId, { selected: true }),
        updateProject(project.id, {
          selected_title: selected.title,
          selected_subtitle: selected.subtitle,
          stage_reached: 5,
        }),
      ])

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage5_generate_plotboard',
          values: {
            character_name: character.name,
            character_profile: profile,
            title: selected.title,
            synopsis_beginning: selected.beginning,
            synopsis_middle: selected.middle,
            synopsis_end: selected.end,
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const resData = await res.json()
      const text = typeof resData?.text === 'string' ? resData.text : '{}'
      let beats: { beginning?: unknown; middle?: unknown; end?: unknown }
      try {
        beats = JSON.parse(text)
      } catch {
        beats = {}
      }

      const toStringArray = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

      await createPlotCardsForProject(project.id, {
        beginning: toStringArray(beats.beginning),
        middle: toStringArray(beats.middle),
        end: toStringArray(beats.end),
      })
      router.push(`/project/${project.id}/plotboard/beginning`)
    } catch {
      setExecuteError('Could not generate plotboard. Please try again.')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="label mb-1">{character.name}</div>
          <h1 className="heading-2">Video Project</h1>
        </div>
      </div>

      <div className="page-body flex flex-col gap-6 max-w-6xl">
        {!stage2Gone && (
          <div className={stage2Exiting ? 'animate-exit-up' : ''}>
            <StoryIdeaSection
              characterName={character.name}
              characterProfile={profile}
              initialStoryIdea={storyIdea}
              locked={stage >= 3}
              onGenerateTitles={handleGenerateTitles}
            />
          </div>
        )}

        {stage >= 3 && !stage3Gone && (
          <div className={stage3Exiting ? 'animate-exit-up' : (titlesEntering ? 'animate-enter-up' : '')}>
            <TitlesSection
              synopses={synopses}
              characterName={character.name}
              storyIdea={storyIdea}
              onUpdateTitle={handleUpdateTitle}
              onSelectTitle={handleSelectTitle}
            />
          </div>
        )}

        {generatingSynopses && (
          <div className="stage-locked-banner">Generating synopses…</div>
        )}

        {stage >= 4 && !generatingSynopses && (
          <div className={synopsesEntering ? 'animate-enter-up' : ''}>
            <SynopsisSection
              synopses={synopses}
              characterName={character.name}
              storyIdea={storyIdea}
              onUpdateSynopsis={handleUpdateSynopsis}
              onExecuteSynopsis={handleExecuteSynopsis}
            />
          </div>
        )}

        {executeError && (
          <div className="text-xs text-red-400">{executeError}</div>
        )}
      </div>
    </div>
  )
}
