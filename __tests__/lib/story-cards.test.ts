import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate, mockUpdate, mockDelete, mockGetFullList } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockGetFullList: vi.fn(),
}))

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      getFullList: mockGetFullList,
    }),
    filter: vi.fn((q: string, params?: Record<string, string>) =>
      params?.id ? q.replace('{:id}', params.id) : q
    ),
  },
}))

import { createStoryCard, getStoryCardsForAct, deleteStoryCardsForAct, updateStoryCard } from '@/lib/story-cards'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createStoryCard', () => {
  it('creates a story card with all fields', async () => {
    const data = {
      plot_card_id: 'plot1',
      project_id: 'proj1',
      written_scene: 'The character walks in.',
      environment: 'Indoor classroom',
      characters: 'WackyWilliam',
      voice_over: 'Hello everyone!',
      spoken_text: '',
      sound_effects: 'footsteps',
      music: 'upbeat',
    }
    mockCreate.mockResolvedValue({ id: 'sc1', ...data })
    const result = await createStoryCard(data)
    expect(mockCreate).toHaveBeenCalledWith(data)
    expect(result.id).toBe('sc1')
    expect(result.written_scene).toBe('The character walks in.')
  })
})

describe('getStoryCardsForAct', () => {
  it('returns only story cards matching the act', async () => {
    mockGetFullList.mockResolvedValue([
      {
        id: 'sc1',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'beginning', order: 1 } },
      },
      {
        id: 'sc2',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'middle', order: 1 } },
      },
    ])
    const result = await getStoryCardsForAct('proj1', 'beginning')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sc1')
  })

  it('sorts by plot card order ascending', async () => {
    mockGetFullList.mockResolvedValue([
      {
        id: 'sc2',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'beginning', order: 2 } },
      },
      {
        id: 'sc1',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'beginning', order: 1 } },
      },
    ])
    const result = await getStoryCardsForAct('proj1', 'beginning')
    expect(result[0].id).toBe('sc1')
    expect(result[1].id).toBe('sc2')
  })

  it('uses pb.filter for project_id', async () => {
    mockGetFullList.mockResolvedValue([])
    await getStoryCardsForAct('proj1', 'beginning')
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining('proj1'),
        expand: 'plot_card_id',
      })
    )
  })
})

describe('deleteStoryCardsForAct', () => {
  it('deletes all story cards for the given act', async () => {
    mockGetFullList.mockResolvedValue([
      { id: 'sc1', project_id: 'proj1', expand: { plot_card_id: { act: 'beginning', order: 1 } } },
      { id: 'sc2', project_id: 'proj1', expand: { plot_card_id: { act: 'beginning', order: 2 } } },
    ])
    await deleteStoryCardsForAct('proj1', 'beginning')
    expect(mockDelete).toHaveBeenCalledTimes(2)
    expect(mockDelete).toHaveBeenCalledWith('sc1')
    expect(mockDelete).toHaveBeenCalledWith('sc2')
  })

  it('does nothing if no story cards exist for the act', async () => {
    mockGetFullList.mockResolvedValue([])
    await deleteStoryCardsForAct('proj1', 'end')
    expect(mockDelete).not.toHaveBeenCalled()
  })
})

describe('updateStoryCard', () => {
  it('updates written_scene', async () => {
    mockUpdate.mockResolvedValue({ id: 'sc1', written_scene: 'Updated scene.' })
    const result = await updateStoryCard('sc1', { written_scene: 'Updated scene.' })
    expect(mockUpdate).toHaveBeenCalledWith('sc1', { written_scene: 'Updated scene.' })
    expect(result.written_scene).toBe('Updated scene.')
  })
})
