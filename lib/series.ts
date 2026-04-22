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
}

export async function createSeries(data: CreateSeriesInput): Promise<Series> {
  return pb.collection('kids_series').create<Series>({
    name: data.name,
    description: data.description || '',
    image_url: data.image_url || '',
  })
}

export async function getSeries(id: string, expand = false): Promise<Series> {
  const options = expand
    ? { expand: 'kids_series_characters_via_series_id.character_id' }
    : {}
  return pb.collection('kids_series').getOne<Series>(id, options)
}

export async function getAllSeries(): Promise<Series[]> {
  return pb.collection('kids_series').getFullList<Series>({
    sort: '-created',
  })
}

export async function updateSeries(
  id: string,
  data: UpdateSeriesInput
): Promise<Series> {
  return pb.collection('kids_series').update<Series>(id, data)
}

export async function deleteSeries(id: string): Promise<boolean> {
  return pb.collection('kids_series').delete(id)
}

export async function getSeriesWithCharacters(
  id: string
): Promise<Series & { characters: any[] }> {
  const series = await pb.collection('kids_series').getOne<Series & { expand?: Record<string, any> }>(id, {
    expand: 'kids_series_characters_via_series_id.character_id',
  })

  const linkRecords: any[] =
    series.expand?.['kids_series_characters_via_series_id'] || []
  const characters = linkRecords
    .sort((a: any, b: any) => a.character_order - b.character_order)
    .map((link: any) => ({
      ...link.expand?.character_id,
      character_order: link.character_order,
      is_main_character: link.is_main_character,
      link_id: link.id,
    }))
    .filter((c: any) => c.id)

  return { ...series, characters }
}
