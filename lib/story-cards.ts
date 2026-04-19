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
  return pb.collection('kids_story_cards').create<StoryCard>(data)
}

export async function getStoryCardsForAct(projectId: string, act: Act): Promise<StoryCard[]> {
  const all = await pb.collection('kids_story_cards').getFullList<StoryCard>({
    filter: pb.filter('project_id = {:id}', { id: projectId }),
    expand: 'plot_card_id',
  })
  return all
    .filter((sc) => sc.expand?.plot_card_id?.act === act)
    .sort((a, b) => (a.expand?.plot_card_id?.order ?? 0) - (b.expand?.plot_card_id?.order ?? 0))
}

export async function deleteStoryCardsForAct(projectId: string, act: Act): Promise<void> {
  const cards = await getStoryCardsForAct(projectId, act)
  await Promise.all(cards.map((sc) => pb.collection('kids_story_cards').delete(sc.id)))
}

export async function updateStoryCard(
  id: string,
  data: Partial<Pick<StoryCard, 'written_scene' | 'environment' | 'characters' | 'voice_over' | 'spoken_text' | 'sound_effects' | 'music'>>
): Promise<StoryCard> {
  return pb.collection('kids_story_cards').update<StoryCard>(id, data)
}
