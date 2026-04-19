import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      getFullList: vi.fn().mockResolvedValue([
        { id: '1', name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' },
        { id: '2', name: 'Daisy', title: 'The Dreamer', avatar_url: '' },
      ]),
      getOne: vi.fn().mockResolvedValue(
        { id: '1', name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' }
      ),
      update: vi.fn().mockResolvedValue(
        { id: '1', name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' }
      ),
    }),
  },
}))

import { getAllCharacters, getCharacter, updateCharacter } from '@/lib/characters'

describe('getAllCharacters', () => {
  it('returns array of characters', async () => {
    const result = await getAllCharacters()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('WackyWilliam')
  })
})

describe('getCharacter', () => {
  it('returns a single character by id', async () => {
    const result = await getCharacter('1')
    expect(result.id).toBe('1')
    expect(result.name).toBe('WackyWilliam')
  })
})

describe('updateCharacter', () => {
  it('calls update and returns updated record', async () => {
    const result = await updateCharacter('1', { name: 'NewName' })
    expect(result.id).toBe('1')
  })
})
