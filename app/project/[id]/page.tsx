import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getSynopsesForProject } from '@/lib/synopses'
import ProjectPage from '@/components/project/ProjectPage'

export const dynamic = 'force-dynamic'

export default async function ProjectRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)
  const [character, synopses] = await Promise.all([
    getCharacter(project.character_id),
    getSynopsesForProject(id),
  ])
  return <ProjectPage project={project} character={character} initialSynopses={synopses} />
}
