import pb from '@/lib/pocketbase'
import type { PlotCard, Act } from '@/lib/types'
import { ACT_CLIP_COUNTS } from '@/lib/types'

export async function getPlotCardsForProject(projectId: string): Promise<PlotCard[]> {
  return pb.collection('kids_plot_cards').getFullList<PlotCard>({
    filter: pb.filter('project_id = {:id}', { id: projectId }),
    sort: 'act,order',
  })
}

export async function createPlotCardsForProject(
  projectId: string,
  beats: { beginning: string[]; middle: string[]; end: string[] }
): Promise<PlotCard[]> {
  const acts: Array<{ act: Act; list: string[] }> = [
    { act: 'beginning', list: beats.beginning },
    { act: 'middle', list: beats.middle },
    { act: 'end', list: beats.end },
  ]

  for (const { act, list } of acts) {
    if (list.length !== ACT_CLIP_COUNTS[act]) {
      throw new Error(
        `Expected ${ACT_CLIP_COUNTS[act]} beats for act "${act}", got ${list.length}`
      )
    }
  }

  const allCards: PlotCard[] = []
  for (const { act, list } of acts) {
    const cards = await Promise.all(
      list.map((beat, i) =>
        pb.collection('kids_plot_cards').create<PlotCard>({
          project_id: projectId,
          act,
          order: i + 1,
          scene_beat: beat,
          duration_sec: 15,
        })
      )
    )
    allCards.push(...cards)
  }
  return allCards
}
