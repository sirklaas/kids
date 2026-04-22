import pb from '@/lib/pocketbase'
import type { SeriesCharacter, Character } from '@/lib/types'

export interface AddCharacterToSeriesInput {
  series_id: string
  character_id: string
  character_order: number
  is_main_character?: boolean
}

export interface UpdateSeriesCharacterInput {
  character_order?: number
  is_main_character?: boolean
}

export async function addCharacterToSeries(
  data: AddCharacterToSeriesInput
): Promise<SeriesCharacter> {
  return pb.collection('kids_series_characters').create<SeriesCharacter>({
    series_id: data.series_id,
    character_id: data.character_id,
    character_order: data.character_order,
    is_main_character: data.is_main_character ?? false,
  })
}

export async function removeCharacterFromSeries(linkId: string): Promise<boolean> {
  return pb.collection('kids_series_characters').delete(linkId)
}

export async function updateSeriesCharacter(
  linkId: string,
  data: UpdateSeriesCharacterInput
): Promise<SeriesCharacter> {
  return pb
    .collection('kids_series_characters')
    .update<SeriesCharacter>(linkId, data)
}

export async function getSeriesCharacters(
  seriesId: string
): Promise<
  Array<
    Character & {
      link_id: string
      character_order: number
      is_main_character: boolean
    }
  >
> {
  const records = await pb.collection('kids_series_characters').getFullList({
    filter: pb.filter('series_id = {:id}', { id: seriesId }),
    expand: 'character_id',
    sort: 'character_order',
  })

  return records
    .map((record: any) => ({
      ...record.expand?.character_id,
      link_id: record.id,
      character_order: record.character_order,
      is_main_character: record.is_main_character,
    }))
    .filter((c: any) => c.id)
}

export async function reorderCharacters(
  seriesId: string,
  newOrder: Array<{ link_id: string; character_order: number }>
): Promise<void> {
  const promises = newOrder.map(({ link_id, character_order }) =>
    pb.collection('kids_series_characters').update(link_id, { character_order })
  )
  await Promise.all(promises)
}

export async function canAddCharacterToSeries(seriesId: string): Promise<boolean> {
  const count = await pb.collection('kids_series_characters').getList(1, 1, {
    filter: pb.filter('series_id = {:id}', { id: seriesId }),
  })
  return count.totalItems < 8
}

export async function getCharacterCount(seriesId: string): Promise<number> {
  const result = await pb.collection('kids_series_characters').getList(1, 1, {
    filter: pb.filter('series_id = {:id}', { id: seriesId }),
  })
  return result.totalItems
}
