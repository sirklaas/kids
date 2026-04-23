import pb from '@/lib/pocketbase'
import type { PlotCard, Act } from '@/lib/types'
import { ACT_CLIP_COUNTS } from '@/lib/types'

export async function getPlotCardsForProject(projectId: string): Promise<PlotCard[]> {
  console.log(`[PlotCards] 🔍 Fetching cards for project: ${projectId}`)
  
  // Use PocketBase filter for project_id (much more efficient)
  // PocketBase stores relations as arrays, so we use ?~ (contains) operator
  const cards = await pb.collection('kids_plot_cards').getFullList<PlotCard>({
    requestKey: null,
    filter: `project_id ~ "${projectId}"`,
  })
  
  console.log(`[PlotCards] ✅ Found ${cards.length} cards for project ${projectId}`)
  
  return cards.sort((a, b) => {
    const actOrder = { beginning: 0, middle: 1, end: 2 }
    if (actOrder[a.act] !== actOrder[b.act]) {
      return actOrder[a.act] - actOrder[b.act]
    }
    return a.order - b.order
  })
}

export async function deletePlotCardsForProject(projectId: string): Promise<void> {
  console.log(`[PlotCards] 🗑️ Deleting existing cards for project: ${projectId}`)
  const existing = await getPlotCardsForProject(projectId)
  console.log(`[PlotCards] Found ${existing.length} cards to delete`)
  await Promise.all(
    existing.map(card => pb.collection('kids_plot_cards').delete(card.id, { requestKey: null }))
  )
  console.log(`[PlotCards] ✅ Deleted ${existing.length} cards`)
}

export async function createPlotCardsForProject(
  projectId: string,
  beats: { beginning: string[]; middle: string[]; end: string[] },
  expectedCounts?: { beginning: number; middle: number; end: number }
): Promise<PlotCard[]> {
  console.log(`[PlotCards] Creating cards for project: ${projectId}`)
  console.log(`[PlotCards] 📊 Expected counts:`, expectedCounts)
  console.log(`[PlotCards] 📊 Received beats:`, { beginning: beats.beginning.length, middle: beats.middle.length, end: beats.end.length })
  
  // Use provided counts or fall back to defaults
  const counts = expectedCounts || ACT_CLIP_COUNTS
  console.log(`[PlotCards] 📊 Using counts:`, counts)
  
  // First delete existing cards for this project
  await deletePlotCardsForProject(projectId)
  
  const acts: Array<{ act: Act; list: string[] }> = [
    { act: 'beginning', list: beats.beginning },
    { act: 'middle', list: beats.middle },
    { act: 'end', list: beats.end },
  ]

  for (const { act, list } of acts) {
    if (list.length !== counts[act]) {
      const errorMsg = `Expected ${counts[act]} beats for act "${act}", got ${list.length}. Make sure your series scene counts match what the AI was asked to generate.`
      console.error(`[PlotCards] ❌ ${errorMsg}`)
      throw new Error(errorMsg)
    }
  }

  const allCards: PlotCard[] = []
  for (const { act, list } of acts) {
    console.log(`[PlotCards] Creating ${list.length} cards for act: ${act}`)
    const cards = await Promise.all(
      list.map((beat, i) =>
        pb.collection('kids_plot_cards').create<PlotCard>(
          {
            project_id: projectId,
            act,
            order: i + 1,
            scene_beat: beat,
            duration_sec: 15,
          },
          { requestKey: null }
        ).then(card => {
          console.log(`[PlotCards] Created card: ${card.id} for act ${act}, order ${i + 1}`)
          return card
        })
      )
    )
    allCards.push(...cards)
  }
  
  console.log(`[PlotCards] ✅ Created ${allCards.length} total cards`)
  return allCards
}

export async function updatePlotCard(
  id: string,
  data: Partial<Pick<PlotCard, 'scene_beat' | 'duration_sec' | 'order'>>
): Promise<PlotCard> {
  return pb.collection('kids_plot_cards').update<PlotCard>(id, data, { requestKey: null })
}
