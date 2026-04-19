import { getCharacter } from '@/lib/characters'
import { getProjectsForCharacter } from '@/lib/projects'
import ProjectList from '@/components/stage1b/ProjectList'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [character, projects] = await Promise.all([
    getCharacter(id),
    getProjectsForCharacter(id),
  ])
  return <ProjectList character={character} projects={projects} />
}
