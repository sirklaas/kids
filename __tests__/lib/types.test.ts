import { describe, it, expectTypeOf } from 'vitest'
import type { Character, Project, Synopsis, PlotCard, StoryCard } from '@/lib/types'

describe('types', () => {
  it('Character has required fields', () => {
    expectTypeOf<Character>().toHaveProperty('id')
    expectTypeOf<Character>().toHaveProperty('name')
    expectTypeOf<Character>().toHaveProperty('avatar_url')
    expectTypeOf<Character>().toHaveProperty('visual_description')
  })

  it('Project has stage_reached as number', () => {
    expectTypeOf<Project['stage_reached']>().toBeNumber()
    expectTypeOf<Project['status']>().toEqualTypeOf<'in_progress' | 'completed'>()
  })

  it('StoryCard includes video prompt fields', () => {
    expectTypeOf<StoryCard>().toHaveProperty('written_scene')
    expectTypeOf<StoryCard>().toHaveProperty('environment')
    expectTypeOf<StoryCard>().toHaveProperty('music')
  })
})
