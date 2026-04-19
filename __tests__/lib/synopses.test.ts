import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase', () => {
  return {
    default: {
      collection: vi.fn().mockReturnValue({
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
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
import { createSynopsis, updateSynopsis, deleteSynopsis, getSynopsesForProject } from '@/lib/synopses'

const mockCollection = vi.mocked(pb.collection)
let mockCreate: ReturnType<typeof vi.fn>
let mockUpdate: ReturnType<typeof vi.fn>
let mockDelete: ReturnType<typeof vi.fn>
let mockGetFullList: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()

  mockCreate = vi.fn().mockResolvedValue({
    id: 'syn1',
    project_id: 'proj1',
    title: 'Brave Adventure',
    subtitle: 'A tale',
    beginning: '',
    middle: '',
    end: '',
    selected: false,
  })
  mockUpdate = vi.fn().mockResolvedValue({ id: 'syn1', beginning: 'The hero sets off' })
  mockDelete = vi.fn().mockResolvedValue(true)
  mockGetFullList = vi.fn().mockResolvedValue([
    { id: 'syn1', project_id: 'proj1', title: 'Brave Adventure', selected: false },
    { id: 'syn2', project_id: 'proj1', title: 'Magical Quest', selected: false },
  ])

  mockCollection.mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getFullList: mockGetFullList,
  } as any)
})

describe('createSynopsis', () => {
  it('creates synopsis with empty content fields by default', async () => {
    const syn = await createSynopsis({ project_id: 'proj1', title: 'Brave Adventure', subtitle: 'A tale' })
    expect(syn.title).toBe('Brave Adventure')
    expect(syn.beginning).toBe('')
    expect(syn.selected).toBe(false)
  })
})

describe('updateSynopsis', () => {
  it('updates synopsis fields', async () => {
    const syn = await updateSynopsis('syn1', { beginning: 'The hero sets off' })
    expect(syn.beginning).toBe('The hero sets off')
  })
})

describe('deleteSynopsis', () => {
  it('calls delete with the id', async () => {
    await deleteSynopsis('syn1')
    expect(mockDelete).toHaveBeenCalledWith('syn1')
  })
})

describe('getSynopsesForProject', () => {
  it('returns all synopses for a project sorted by created', async () => {
    const synopses = await getSynopsesForProject('proj1')
    expect(synopses).toHaveLength(2)
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.stringContaining('proj1'), sort: 'created' })
    )
  })
})
