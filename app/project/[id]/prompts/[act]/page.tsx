import { notFound } from 'next/navigation'
import { getProject, getProjectsForSeries } from '@/lib/projects'
import { getSeriesCharacters } from '@/lib/series-characters'
import { getStoryCardsForAct } from '@/lib/story-cards'
import VideoPromptPage from '@/components/stage7/VideoPromptPage'
import type { Act } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_ACTS: Act[] = ['beginning', 'middle', 'end']

export default async function PromptsRoute({
  params,
}: {
  params: Promise<{ id: string; act: string }>
}) {
  const { id, act: actParam } = await params
  if (!VALID_ACTS.includes(actParam as Act)) notFound()
  const act = actParam as Act

  const project = await getProject(id).catch(() => notFound())
  
  // Get project number for readable ID
  const projects = await getProjectsForSeries(project.series_id)
  const projectIndex = projects.findIndex(p => p.id === project.id)
  const projectNumber = projectIndex >= 0 ? projectIndex + 1 : projects.length
  
  const [characters, cards] = await Promise.all([
    getSeriesCharacters(project.series_id),
    getStoryCardsForAct(id, act),
  ])

  const character = characters.find(c => c.is_main_character) || characters[0]

  if (!character) {
    throw new Error('No characters found for this series')
  }

  // Generate readable ID
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth() + 1
  const readableId = `${character.name?.split(' ')[0] || 'Story'}/${day}/${month} - ${String(projectNumber).padStart(3, '0')}`

  return (
    <VideoPromptPage
      project={project}
      character={character}
      act={act}
      initialCards={cards}
      readableId={readableId}
    />
  )
}
