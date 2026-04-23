import pb from '@/lib/pocketbase'
import type { Series } from '@/lib/types'

export interface CreateSeriesInput {
  name: string
  description?: string
  image_url?: string
}

export interface UpdateSeriesInput {
  name?: string
  description?: string
  image_url?: string
  beginning_scenes?: number
  middle_scenes?: number
  end_scenes?: number
}

export async function createSeries(data: CreateSeriesInput): Promise<Series> {
  return pb.collection('kids_series').create<Series>({
    name: data.name,
    description: data.description || '',
    image_url: data.image_url || '',
  }, { requestKey: null })
}

export async function getSeries(id: string, expand = false): Promise<Series> {
  const options: any = { requestKey: null }
  if (expand) {
    options.expand = 'kids_series_characters_via_series_id.character_id'
  }
  return pb.collection('kids_series').getOne<Series>(id, options)
}

export async function getAllSeries(): Promise<Series[]> {
  return pb.collection('kids_series').getFullList<Series>({
    sort: '-created',
    requestKey: null,
  })
}

export async function updateSeries(
  id: string,
  data: UpdateSeriesInput
): Promise<Series> {
  return pb.collection('kids_series').update<Series>(id, data, { requestKey: null })
}

export async function deleteSeries(id: string): Promise<boolean> {
  return pb.collection('kids_series').delete(id, { requestKey: null })
}

export async function getSeriesWithCharacters(
  id: string
): Promise<Series & { characters: any[] }> {
  const series = await pb.collection('kids_series').getOne<Series & { expand?: Record<string, any> }>(id, {
    expand: 'kids_series_characters_via_series_id.character_id',
    requestKey: null,
  })

  const linkRecords: any[] =
    series.expand?.['kids_series_characters_via_series_id'] || []
  const characters = linkRecords
    .sort((a: any, b: any) => a.character_order - b.character_order)
    .map((link: any) => {
      const char = link.expand?.character_id || {}
      return {
        id: char.id,
        name: char.name,
        title: char.title,
        avatar_url: char.avatar_url,
        age: char.age_group,
        personality: char.personality,
        visual_description: char.visual_appearance,
        voice_style: char.voice_style,
        catchphrases: char.catchphrases,
        backstory: char.backstory,
        nano_banana_prompt: char.nano_banana_prompt,
        character_type: char.character_type,
        personality_type: char.personality_type,
        character_order: link.character_order,
        is_main_character: link.is_main_character,
        link_id: link.id,
      }
    })
    .filter((c: any) => c.id)

  return { ...series, characters }
}
