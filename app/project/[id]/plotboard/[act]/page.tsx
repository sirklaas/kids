import { notFound } from 'next/navigation'
import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getPlotCardsForProject } from '@/lib/plot-cards'
import PlotBoard from '@/components/stage5/PlotBoard'
import type { Act } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_ACTS: Act[] = ['beginning', 'middle', 'end']

export default async function PlotboardRoute({
  params,
}: {
  params: Promise<{ id: string; act: string }>
}) {
  const { id, act: actParam } = await params
  if (!VALID_ACTS.includes(actParam as Act)) notFound()
  const act = actParam as Act

  const project = await getProject(id).catch(() => notFound())
  const [character, allCards] = await Promise.all([
    getCharacter(project.character_id),
    getPlotCardsForProject(id),
  ])

  const cards = allCards
    .filter((c) => c.act === act)
    .sort((a, b) => a.order - b.order)

  return (
    <PlotBoard
      project={project}
      character={character}
      act={act}
      initialCards={cards}
    />
  )
}
