import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase', () => {
  return {
    default: {
      collection: vi.fn().mockReturnValue({
        create: vi.fn(),
        update: vi.fn(),
        getOne: vi.fn(),
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
import { createProject, getProject, updateProject, getProjectsForCharacter } from '@/lib/projects'

const mockCollection = vi.mocked(pb.collection)
let mockCreate: ReturnType<typeof vi.fn>
let mockUpdate: ReturnType<typeof vi.fn>
let mockGetOne: ReturnType<typeof vi.fn>
let mockGetFullList: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()

  mockCreate = vi.fn().mockResolvedValue({
    id: 'proj1',
    character_id: 'char1',
    stage_reached: 2,
    status: 'in_progress',
    story_idea: '',
    selected_title: '',
    selected_subtitle: '',
  })
  mockUpdate = vi.fn().mockResolvedValue({
    id: 'proj1',
    stage_reached: 3,
  })
  mockGetOne = vi.fn().mockResolvedValue({
    id: 'proj1',
    stage_reached: 2,
    story_idea: 'A fun adventure',
    character_id: 'char1',
  })
  mockGetFullList = vi.fn().mockResolvedValue([
    { id: 'proj1', stage_reached: 2, status: 'in_progress' },
    { id: 'proj2', stage_reached: 5, status: 'completed' },
  ])

  mockCollection.mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
    getOne: mockGetOne,
    getFullList: mockGetFullList,
  } as any)
})

describe('createProject', () => {
  it('creates a project with stage_reached=2 and in_progress status', async () => {
    const project = await createProject('char1')
    expect(project.stage_reached).toBe(2)
    expect(project.status).toBe('in_progress')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ character_id: 'char1', stage_reached: 2, status: 'in_progress' }),
      expect.objectContaining({ expand: 'character_id' })
    )
  })
})

describe('getProject', () => {
  it('fetches project by id with expand', async () => {
    const project = await getProject('proj1')
    expect(project.id).toBe('proj1')
    expect(mockGetOne).toHaveBeenCalledWith('proj1', expect.objectContaining({ expand: 'character_id' }))
  })
})

describe('updateProject', () => {
  it('updates project fields and returns updated record', async () => {
    const project = await updateProject('proj1', { stage_reached: 3 })
    expect(project.stage_reached).toBe(3)
    expect(mockUpdate).toHaveBeenCalledWith('proj1', expect.objectContaining({ stage_reached: 3 }))
  })
})

describe('getProjectsForCharacter', () => {
  it('returns all projects for a character sorted by -created', async () => {
    const projects = await getProjectsForCharacter('char1')
    expect(projects).toHaveLength(2)
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.stringContaining('char1'), sort: '-created' })
    )
  })
})
