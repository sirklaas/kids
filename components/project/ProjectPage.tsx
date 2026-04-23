'use client'

import { useState, useEffect } from 'react'
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
  sceneCounts?: {
    beginning: number
    middle: number
    end: number
  }
}

function buildCharacterProfile(c: Character | undefined): string {
  if (!c) {
    return ''
  }
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
  sceneCounts = { beginning: 8, middle: 10, end: 8 },
}: ProjectPageProps) {
  console.log('[ProjectPage] Scene counts received:', sceneCounts)
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
  const [selectedTitle, setSelectedTitle] = useState(project.selected_title || '')
  const [selectedSubtitle, setSelectedSubtitle] = useState(project.selected_subtitle || '')

  const profile = buildCharacterProfile(character)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('kids:stage', { detail: stage }))
  }, [stage])

  async function handleGenerateTitles(idea: string) {
    try {
      setStoryIdea(idea)
      console.log('[Stage 3] 🚀 Starting title generation for idea:', idea.slice(0, 50) + '...')

      console.log('[Stage 3] 🗑️ Deleting existing synopses...')
      const existing = await getSynopsesForProject(project.id)
      if (existing.length > 0) {
        await Promise.all(existing.map((s) => deleteSynopsis(s.id)))
      }
      console.log('[Stage 3] ✅ Deleted', existing.length, 'existing synopses')

      console.log('[Stage 3] 💾 Updating project to stage 3...')
      await updateProject(project.id, { story_idea: idea, stage_reached: 3 })
      console.log('[Stage 3] ✅ Project updated')

      console.log('[Stage 3] 🤖 Calling AI to generate 5 titles...')
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage3_generate_titles',
          values: { character_name: character.name, story_idea: idea },
        }),
      })
      if (!res.ok) throw new Error(`AI request failed: ${res.status} ${res.statusText}`)
      const data = await res.json()
      console.log('[Stage 3] 📥 AI raw response:', data.text?.slice(0, 200) + '...')
      
      const text = typeof data?.text === 'string' ? data.text : '[]'
      let pairs: { title: string; subtitle: string }[]
      try {
        pairs = JSON.parse(text)
        console.log('[Stage 3] ✅ Parsed', pairs.length, 'title pairs')
      } catch (parseErr) {
        console.error('[Stage 3] ❌ JSON parse error:', parseErr)
        throw new Error('AI returned invalid JSON. Check the prompt.')
      }
      
      if (!Array.isArray(pairs)) {
        console.error('[Stage 3] ❌ AI response is not an array:', pairs)
        throw new Error('AI did not return an array of titles')
      }

      if (pairs.length === 0) {
        console.error('[Stage 3] ❌ AI returned empty array')
        throw new Error('AI returned no titles. Please try again.')
      }

      // Check for empty titles
      const emptyTitles = pairs.filter(p => !p.title || !p.subtitle)
      if (emptyTitles.length > 0) {
        console.warn('[Stage 3] ⚠️ Some titles are empty:', emptyTitles)
      }

      console.log('[Stage 3] 💾 Saving', pairs.length, 'synopses to PocketBase...')
      const created = await Promise.all(
        pairs.slice(0, 5).map((pair, i) => {
          const title = typeof pair.title === 'string' ? pair.title : ''
          const subtitle = typeof pair.subtitle === 'string' ? pair.subtitle : ''
          console.log(`[Stage 3] 💾 Creating synopsis ${i + 1}:`, { title, subtitle })
          return createSynopsis({
            project_id: project.id,
            title,
            subtitle,
          }).then(record => {
            // PocketBase might not return all fields, so merge with what we sent
            return { ...record, title, subtitle }
          })
        })
      )
      console.log('[Stage 3] ✅ Created', created.length, 'synopses:', created.map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle })))
      
      setSynopses(created)
      setStage2Exiting(true)
      setTimeout(() => {
        setStage2Gone(true)
        setTitlesEntering(true)
        setStage(3)
        setTimeout(() => setTitlesEntering(false), 450)
      }, 350)
    } catch (err) {
      console.error('[Stage 3] ❌ Error in handleGenerateTitles:', err)
      alert('❌ Error generating titles: ' + (err as Error).message)
    }
  }

  function handleUpdateTitle(id: string, title: string, subtitle: string) {
    setSynopses((prev) => prev.map((s) => (s.id === id ? { ...s, title, subtitle } : s)))
    updateSynopsis(id, { title, subtitle })
  }

  const [isProcessing, setIsProcessing] = useState(false)

  async function handleSelectTitle(synopsisId: string) {
    if (isProcessing) {
      console.log('[Stage 4] ⚠️ Already processing, ignoring click')
      return
    }
    setIsProcessing(true)
    
    try {
      const selected = synopses.find((s) => s.id === synopsisId)
      if (!selected) {
        throw new Error('Selected synopsis not found')
      }

      console.log('[Stage 4] 🚀 Starting synopsis generation for title:', selected.title)

      // Start stage 3 exit immediately
      setStage3Exiting(true)
      setTimeout(() => setStage3Gone(true), 350)

      console.log('[Stage 4] 💾 Updating project with selected title...')
      await updateProject(project.id, {
        selected_title: selected.title,
        selected_subtitle: selected.subtitle,
        stage_reached: 4,
      })
      console.log('[Stage 4] ✅ Project updated')

      // Delete all title-option synopses, create 4 new synopsis variations for the chosen title
      const validSynopses = synopses.filter(s => s.id)
      console.log('[Stage 4] 🗑️ Deleting', validSynopses.length, 'old title synopses...')
      try {
        // Delete one by one with small delay to avoid rate limits
        for (const s of validSynopses) {
          await deleteSynopsis(s.id)
          await new Promise(r => setTimeout(r, 100))
        }
        console.log('[Stage 4] ✅ Deleted', validSynopses.length, 'synopses')
      } catch (deleteErr) {
        console.error('[Stage 4] ❌ Failed to delete synopses:', deleteErr)
        throw new Error('Failed to delete old synopses: ' + (deleteErr as Error).message)
      }

      setSelectedTitle(selected.title)
      setSelectedSubtitle(selected.subtitle)
      setGeneratingSynopses(true)
      
      const { title: chosenTitle, subtitle: chosenSubtitle } = selected
      const ANGLES = [
        'emotional and heartfelt',
        'funny and playful',
        'action-packed and exciting',
        'mysterious with a surprise twist',
      ]
      
      console.log('[Stage 4] 🤖 Generating 4 synopsis variations with AI...')
      const newSynopses: Synopsis[] = []
      for (let i = 0; i < ANGLES.length; i++) {
        const angle = ANGLES[i]
        console.log(`[Stage 4] 💾 Creating synopsis ${i + 1}/4 with angle:`, angle)
        
        // Small delay between creations to avoid rate limits
        if (i > 0) await new Promise(r => setTimeout(r, 200))
        
        const syn = await createSynopsis({
          project_id: project.id,
          title: chosenTitle,
          subtitle: chosenSubtitle,
        })
          
        console.log(`[Stage 4] 🤖 Calling AI for angle "${angle}"...`)
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
              variation_angle: angle,
            },
          }),
        })
        if (!res.ok) throw new Error(`AI failed for angle "${angle}": ${res.status}`)
        
        const resData = await res.json()
        console.log(`[Stage 4] 📥 AI response for "${angle}":`, resData.text?.slice(0, 100) + '...')
        
        const text = typeof resData?.text === 'string' ? resData.text : '{}'
        let parsed: { beginning?: unknown; middle?: unknown; end?: unknown }
        try {
          parsed = JSON.parse(text)
        } catch {
          console.error(`[Stage 4] ❌ JSON parse failed for "${angle}"`)
          parsed = {}
        }
        
        const synData = {
          beginning: typeof parsed.beginning === 'string' ? parsed.beginning : '',
          middle: typeof parsed.middle === 'string' ? parsed.middle : '',
          end: typeof parsed.end === 'string' ? parsed.end : '',
        }
        
        console.log(`[Stage 4] 💾 Saving synopsis ${i + 1} with`, { beginning: synData.beginning?.slice(0, 30), middle: synData.middle?.slice(0, 30), end: synData.end?.slice(0, 30) })
        await updateSynopsis(syn.id, synData)
        newSynopses.push({ ...syn, ...synData, title: chosenTitle, subtitle: chosenSubtitle })
      }
      
      console.log('[Stage 4] ✅ Created', newSynopses.length, 'synopsis variations')
      setSynopses(newSynopses)
      setGeneratingSynopses(false)
      setSynopsesEntering(true)
      setStage(4)
      setTimeout(() => setSynopsesEntering(false), 450)
    } catch (err) {
      console.error('[Stage 4] ❌ Error in handleSelectTitle:', err)
      alert('❌ Error generating synopses: ' + (err as Error).message)
      setGeneratingSynopses(false)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleUpdateSynopsis(
    id: string,
    data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>
  ) {
    setSynopses((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
    updateSynopsis(id, data)
  }

  async function handleExecuteSynopsis(synopsisId: string) {
    console.log('[Stage 5] 🔍 Looking for synopsis ID:', synopsisId)
    console.log('[Stage 5] 📋 Available synopses:', synopses.map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle })))
    
    const selected = synopses.find((s) => s.id === synopsisId)
    if (!selected) {
      console.error('[Stage 5] ❌ Selected synopsis not found in state')
      return
    }
    
    console.log('[Stage 5] 🚀 Generating plotboard for:', selected.title, '| subtitle:', selected.subtitle)
    console.log('[Stage 5] 📄 Synopsis has:', { beginning: selected.beginning?.slice(0, 30), middle: selected.middle?.slice(0, 30), end: selected.end?.slice(0, 30) })
    setExecuteError(null)
    
    try {
      console.log('[Stage 5] 💾 Marking synopsis as selected and updating project...')
      await Promise.all([
        updateSynopsis(synopsisId, { selected: true }),
        updateProject(project.id, {
          selected_title: selected.title,
          selected_subtitle: selected.subtitle,
          stage_reached: 5,
        }),
      ])
      console.log('[Stage 5] ✅ Project updated to stage 5')

      // Fetch CURRENT scene counts from series (not cached values)
      console.log('[Stage 5] 📊 Fetching current scene counts from series...')
      const { getSeries } = await import('@/lib/series')
      const series = await getSeries(project.series_id)
      const currentSceneCounts = {
        beginning: series.beginning_scenes ?? 8,
        middle: series.middle_scenes ?? 10,
        end: series.end_scenes ?? 8,
      }
      console.log('[Stage 5] 📊 Current scene counts:', currentSceneCounts)

      console.log('[Stage 5] 🤖 Calling AI to generate plotboard beats...')
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
            beginning_count: currentSceneCounts.beginning,
            middle_count: currentSceneCounts.middle,
            end_count: currentSceneCounts.end,
            total_count: currentSceneCounts.beginning + currentSceneCounts.middle + currentSceneCounts.end,
          },
        }),
      })
      if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
      
      const resData = await res.json()
      console.log('[Stage 5] 📥 AI raw response:', resData.text?.slice(0, 200) + '...')
      
      const text = typeof resData?.text === 'string' ? resData.text : '{}'
      let beats: { beginning?: unknown; middle?: unknown; end?: unknown }
      try {
        beats = JSON.parse(text)
        console.log('[Stage 5] ✅ Parsed beats:', { 
          beginning: Array.isArray(beats.beginning) ? beats.beginning.length : 0, 
          middle: Array.isArray(beats.middle) ? beats.middle.length : 0, 
          end: Array.isArray(beats.end) ? beats.end.length : 0 
        })
      } catch (parseErr) {
        console.error('[Stage 5] ❌ JSON parse error:', parseErr)
        beats = {}
      }

      const toStringArray = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

      const beginning = toStringArray(beats.beginning)
      const middle = toStringArray(beats.middle)
      const end = toStringArray(beats.end)
      
      console.log('[Stage 5] 💾 Creating plot cards:', { beginning: beginning.length, middle: middle.length, end: end.length })
      
      await createPlotCardsForProject(project.id, {
        beginning,
        middle,
        end,
      }, currentSceneCounts)
      
      console.log('[Stage 5] ✅ Plot cards created! Navigating to plotboard...')
      router.push(`/project/${project.id}/plotboard/beginning`)
    } catch (err) {
      console.error('[Stage 5] ❌ Error in handleExecuteSynopsis:', err)
      setExecuteError('❌ Could not generate plotboard: ' + (err as Error).message)
    }
  }

  // Generate readable story ID like "Dora/26/4 - 015" 
  // Shows sequential number within this series for easy tracking
  const [projectNumber, setProjectNumber] = useState<number>(0)
  
  useEffect(() => {
    async function fetchProjectNumber() {
      try {
        const { getProjectsForSeries } = await import('@/lib/projects')
        const projects = await getProjectsForSeries(project.series_id)
        // Find this project's position in the list (sorted by created date)
        const index = projects.findIndex(p => p.id === project.id)
        setProjectNumber(index >= 0 ? index + 1 : projects.length)
      } catch (err) {
        console.error('Failed to fetch project number:', err)
        setProjectNumber(0)
      }
    }
    fetchProjectNumber()
  }, [project.id, project.series_id])
  
  const readableId = (() => {
    const seriesName = character.name?.split(' ')[0] || 'Story'
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const num = projectNumber.toString().padStart(3, '0')
    return `${seriesName}/${day}/${month} - ${num}`
  })()

  return (
    <div className={stage >= 4 ? 'flex flex-col h-screen' : ''}>
      <div className="page-header">
        <div>
          <div className="label mb-1">{character.name}</div>
          {stage >= 4 && selectedTitle ? (
            <>
              <h1 className="heading-2">{selectedTitle}</h1>
              {selectedSubtitle && (
                <div className="text-sm text-white/40 mt-0.5">{selectedSubtitle}</div>
              )}
            </>
          ) : (
            <h1 className="heading-2">Video Project</h1>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-white/40 font-mono">{readableId}</div>
        </div>
      </div>

      <div className={`page-body flex flex-col gap-6 max-w-6xl${stage >= 4 ? ' flex-1 overflow-hidden' : ''}`}>
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
          <div className={`flex-1 overflow-hidden${synopsesEntering ? ' animate-enter-up' : ''}`}>
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
          <div className="card bg-red-500/10 border-red-500/30 p-4 my-4">
            <div className="text-red-400 font-medium">❌ Error</div>
            <div className="text-red-300 text-sm mt-1">{executeError}</div>
          </div>
        )}
      </div>
    </div>
  )
}
