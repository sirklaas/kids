import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      getFirstListItem: vi.fn().mockResolvedValue({
        id: 'p1',
        key: 'stage3_generate_titles',
        system_prompt: 'You are a kids story title writer.',
        user_template: 'Character: {{character_name}}. Story: {{story_idea}}. Generate 5 titles.',
        notes: '',
      }),
    }),
  },
}))

import { getPrompt, fillTemplate, buildPrompt } from '@/lib/prompts'

describe('fillTemplate', () => {
  it('replaces all {{placeholders}} with values', () => {
    const result = fillTemplate(
      'Character: {{character_name}}. Story: {{story_idea}}.',
      { character_name: 'WackyWilliam', story_idea: 'finds a mushroom' }
    )
    expect(result).toBe('Character: WackyWilliam. Story: finds a mushroom.')
  })

  it('leaves unmatched placeholders as empty string', () => {
    const result = fillTemplate('Hello {{name}}!', {})
    expect(result).toBe('Hello !')
  })
})

describe('getPrompt', () => {
  it('returns prompt record by key', async () => {
    const prompt = await getPrompt('stage3_generate_titles')
    expect(prompt.key).toBe('stage3_generate_titles')
    expect(prompt.system_prompt).toContain('kids story')
  })
})

describe('buildPrompt', () => {
  it('returns filled system and user strings', async () => {
    const result = await buildPrompt('stage3_generate_titles', {
      character_name: 'WackyWilliam',
      story_idea: 'finds a mushroom',
    })
    expect(result.system).toContain('kids story')
    expect(result.user).toContain('WackyWilliam')
  })
})
