import { notFound } from 'next/navigation'
import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getStoryCardsForAct } from '@/lib/story-cards'
import StoryPage from '@/components/stage6/StoryPage'
import type { Act } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_ACTS: Act[] = ['beginning', 'middle', 'end']

export default async function StoryRoute({
  params,
}: {
  params: Promise<{ id: string; act: string }>
}) {
  const { id, act: actParam } = await params
  if (!VALID_ACTS.includes(actParam as Act)) notFound()
  const act = actParam as Act

  const project = await getProject(id).catch(() => notFound())
  const [character, cards] = await Promise.all([
    getCharacter(project.character_id),
    getStoryCardsForAct(id, act),
  ])

  return (
    <StoryPage
      project={project}
      character={character}
      act={act}
      initialCards={cards}
    />
  )
}
