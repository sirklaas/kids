import pb from '@/lib/pocketbase'
import type { StoryCard, Act } from '@/lib/types'

export async function createStoryCard(data: {
  plot_card_id: string
  project_id: string
  written_scene: string
  environment: string
  characters: string
  voice_over: string
  spoken_text: string
  sound_effects: string
  music: string
}): Promise<StoryCard> {
  return pb.collection('kids_story_cards').create<StoryCard>(data, { requestKey: null })
}

export async function getStoryCardsForAct(projectId: string, act: Act): Promise<StoryCard[]> {
  console.log(`[StoryCards] 🔍 Fetching for project ${projectId}, act ${act}`)
  
  // Fetch plot cards for this project/act first
  const { getPlotCardsForProject } = await import('./plot-cards')
  const plotCards = await getPlotCardsForProject(projectId)
  const actPlotCards = plotCards.filter(pc => pc.act === act)
  const plotCardIds = new Set(actPlotCards.map(pc => pc.id))
  
  console.log(`[StoryCards] 📊 Found ${actPlotCards.length} plot cards for act ${act}`)
  
  if (actPlotCards.length === 0) {
    console.log(`[StoryCards] ⚠️ No plot cards for act ${act}, returning empty`)
    return []
  }
  
  // Fetch only story cards for this project (much more efficient)
  const all = await pb.collection('kids_story_cards').getFullList<StoryCard>({
    requestKey: null,
    filter: `project_id ~ "${projectId}"`,
    expand: 'plot_card_id',
  })
  
  console.log(`[StoryCards] 📊 Found ${all.length} story cards for project`)
  
  // Filter by plot_card_id belonging to this act
  const filtered = all.filter((sc) => {
    const plotId = sc.plot_card_id
    if (typeof plotId === 'string') return plotCardIds.has(plotId)
    if (Array.isArray(plotId)) return plotCardIds.has(plotId[0])
    if (plotId && typeof plotId === 'object' && 'id' in plotId) return plotCardIds.has((plotId as any).id)
    return false
  })
  
  console.log(`[StoryCards] ✅ Found ${filtered.length} cards for act ${act}`)
  
  // Sort by plot card order
  const plotCardOrder = new Map(actPlotCards.map(pc => [pc.id, pc.order]))
  return filtered.sort((a, b) => {
    const aPlotId = typeof a.plot_card_id === 'string' ? a.plot_card_id :
                   Array.isArray(a.plot_card_id) ? a.plot_card_id[0] :
                   (a.plot_card_id as any)?.id
    const bPlotId = typeof b.plot_card_id === 'string' ? b.plot_card_id :
                   Array.isArray(b.plot_card_id) ? b.plot_card_id[0] :
                   (b.plot_card_id as any)?.id
    return (plotCardOrder.get(aPlotId) ?? 0) - (plotCardOrder.get(bPlotId) ?? 0)
  })
}

export async function deleteStoryCardsForAct(projectId: string, act: Act): Promise<void> {
  const cards = await getStoryCardsForAct(projectId, act)
  await Promise.all(cards.map((sc) => pb.collection('kids_story_cards').delete(sc.id, { requestKey: null })))
}

export async function updateStoryCard(
  id: string,
  data: Partial<Pick<StoryCard, 'written_scene' | 'environment' | 'characters' | 'voice_over' | 'spoken_text' | 'sound_effects' | 'music'>>
): Promise<StoryCard> {
  return pb.collection('kids_story_cards').update<StoryCard>(id, data, { requestKey: null })
}
