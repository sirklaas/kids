import pb from '@/lib/pocketbase'
import type { Character } from '@/lib/types'

export interface CreateCharacterInput {
  name: string
  visual_appearance?: string
  age_group?: string
  personality?: string
  catchphrases?: string
  voice_style?: string
  backstory?: string
  character_type?: string
  personality_type?: string
  nano_banana_prompt?: string
}

export async function createCharacter(data: CreateCharacterInput): Promise<Character> {
  return pb.collection('kids_characters').create<Character>({
    name: data.name,
    visual_appearance: data.visual_appearance || '',
    age_group: data.age_group || 'child',
    personality: data.personality || '',
    catchphrases: data.catchphrases || '',
    voice_style: data.voice_style || '',
    backstory: data.backstory || '',
    character_type: data.character_type || 'animal',
    personality_type: data.personality_type || 'brave',
    nano_banana_prompt: data.nano_banana_prompt || '',
  }, { requestKey: null })
}

export async function updateCharacter(
  id: string,
  data: Partial<CreateCharacterInput>
): Promise<Character> {
  return pb.collection('kids_characters').update<Character>(id, data, { requestKey: null })
}

export async function deleteCharacter(id: string): Promise<boolean> {
  return pb.collection('kids_characters').delete(id, { requestKey: null })
}

export async function getCharacter(id: string): Promise<Character> {
  return pb.collection('kids_characters').getOne<Character>(id, { requestKey: null })
}
