import { redirect } from 'next/navigation'
import { getProject, createProject } from '@/lib/projects'
import { getSynopsesForProject } from '@/lib/synopses'
import { getSeriesCharacters } from '@/lib/series-characters'
import { getSeries } from '@/lib/series'
import ProjectPage from '@/components/project/ProjectPage'

export const dynamic = 'force-dynamic'

export default async function ProjectRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ series_id?: string }>
}) {
  const { id } = await params
  const { series_id } = await searchParams

  // Handle creating a new project
  if (id === 'new') {
    if (!series_id) {
      throw new Error('series_id is required to create a new project')
    }

    // Get characters for this series to find the main character
    const characters = await getSeriesCharacters(series_id)
    const mainCharacter = characters.find(c => c.is_main_character) || characters[0]

    if (!mainCharacter) {
      throw new Error('No characters found for this series')
    }

    // Create the project
    const project = await createProject(series_id)

    // Redirect to the new project page
    redirect(`/project/${project.id}`)
  }

  const project = await getProject(id)

  // Handle old projects without series_id
  if (!project.series_id) {
    throw new Error('This project is missing series_id. Please create a new project from a series.')
  }

  const [characters, synopses, series] = await Promise.all([
    getSeriesCharacters(project.series_id),
    getSynopsesForProject(id),
    getSeries(project.series_id),
  ])

  // Get the main character, or fall back to the first character
  const mainCharacter = characters.find(c => c.is_main_character) || characters[0]

  if (!mainCharacter) {
    throw new Error('No characters found for this series')
  }

  // Get scene counts from series (with defaults)
  const sceneCounts = {
    beginning: series.beginning_scenes ?? 8,
    middle: series.middle_scenes ?? 10,
    end: series.end_scenes ?? 8,
  }

  return <ProjectPage project={project} character={mainCharacter} initialSynopses={synopses} sceneCounts={sceneCounts} />
}
