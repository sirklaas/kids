import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase', () => {
  return {
    default: {
      collection: vi.fn().mockReturnValue({
        create: vi.fn(),
        getFullList: vi.fn(),
      }),
      filter: vi.fn((raw: string, params?: any) => {
        if (params && params.id) {
          return raw.replace('{:id}', params.id)
        }
        return raw
      }),
    },
  }
})

import pb from '@/lib/pocketbase'
import { createPlotCardsForProject, getPlotCardsForProject, updatePlotCard } from '@/lib/plot-cards'

const mockCollection = vi.mocked(pb.collection)
let mockCreate: ReturnType<typeof vi.fn>
let mockGetFullList: ReturnType<typeof vi.fn>
let mockUpdate: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()

  mockCreate = vi.fn().mockImplementation((data: any) =>
    Promise.resolve({ id: `card_${data.act}_${data.order}`, ...data })
  )
  mockGetFullList = vi.fn().mockResolvedValue([
    { id: 'card1', project_id: 'proj1', act: 'beginning', order: 1, scene_beat: 'Hero wakes up', duration_sec: 15 },
  ])
  mockUpdate = vi.fn().mockImplementation((id: string, data: any) =>
    Promise.resolve({ id, ...data })
  )

  mockCollection.mockReturnValue({
    create: mockCreate,
    getFullList: mockGetFullList,
    update: mockUpdate,
  } as any)
})

describe('createPlotCardsForProject', () => {
  it('creates 30 cards: 9 beginning + 12 middle + 9 end', async () => {
    const beats = {
      beginning: Array.from({ length: 9 }, (_, i) => `Beginning beat ${i + 1}`),
      middle: Array.from({ length: 12 }, (_, i) => `Middle beat ${i + 1}`),
      end: Array.from({ length: 9 }, (_, i) => `End beat ${i + 1}`),
    }
    const cards = await createPlotCardsForProject('proj1', beats)
    expect(cards).toHaveLength(30)
    expect(mockCreate).toHaveBeenCalledTimes(30)
    expect(cards.filter((c) => c.act === 'beginning')).toHaveLength(9)
    expect(cards.filter((c) => c.act === 'middle')).toHaveLength(12)
    expect(cards.filter((c) => c.act === 'end')).toHaveLength(9)
  })

  it('sets order starting from 1 within each act', async () => {
    const beats = {
      beginning: Array.from({ length: 9 }, (_, i) => `beat ${i + 1}`),
      middle: Array.from({ length: 12 }, (_, i) => `beat ${i + 1}`),
      end: Array.from({ length: 9 }, (_, i) => `beat ${i + 1}`),
    }
    await createPlotCardsForProject('proj1', beats)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ act: 'beginning', order: 1 }))
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ act: 'beginning', order: 2 }))
  })

  it('sets default duration_sec of 15', async () => {
    const beats = {
      beginning: Array.from({ length: 9 }, (_, i) => `beat ${i + 1}`),
      middle: Array.from({ length: 12 }, (_, i) => `beat ${i + 1}`),
      end: Array.from({ length: 9 }, (_, i) => `beat ${i + 1}`),
    }
    await createPlotCardsForProject('proj1', beats)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ duration_sec: 15 }))
  })

  it('throws if beat count does not match ACT_CLIP_COUNTS', async () => {
    const beats = {
      beginning: Array.from({ length: 10 }, (_, i) => `beat ${i}`), // wrong: should be 9
      middle: Array.from({ length: 12 }, (_, i) => `beat ${i}`),
      end: Array.from({ length: 9 }, (_, i) => `beat ${i}`),
    }
    await expect(createPlotCardsForProject('proj1', beats)).rejects.toThrow(
      'Expected 9 beats for act "beginning", got 10'
    )
  })
})

describe('getPlotCardsForProject', () => {
  it('returns plot cards for a project', async () => {
    const cards = await getPlotCardsForProject('proj1')
    expect(cards).toHaveLength(1)
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.stringContaining('proj1'), sort: 'act,order' })
    )
  })
})

describe('updatePlotCard', () => {
  it('updates scene_beat and duration_sec', async () => {
    const result = await updatePlotCard('card1', { scene_beat: 'new beat', duration_sec: 20 })
    expect(mockUpdate).toHaveBeenCalledWith('card1', { scene_beat: 'new beat', duration_sec: 20 })
    expect(result.scene_beat).toBe('new beat')
    expect(result.duration_sec).toBe(20)
  })

  it('updates order only', async () => {
    await updatePlotCard('card1', { order: 3 })
    expect(mockUpdate).toHaveBeenCalledWith('card1', { order: 3 })
  })
})
