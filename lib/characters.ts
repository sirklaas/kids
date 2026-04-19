import pb from '@/lib/pocketbase'
import type { Character } from '@/lib/types'

export async function getAllCharacters(): Promise<Character[]> {
  return pb.collection('kids_characters').getFullList<Character>({ sort: 'created' })
}

export async function getCharacter(id: string): Promise<Character> {
  return pb.collection('kids_characters').getOne<Character>(id)
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<Character, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'>>
): Promise<Character> {
  return pb.collection('kids_characters').update<Character>(id, data)
}
