import { describe, it, expect, vi } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"title":"Test Title","subtitle":"Test Subtitle"}' }],
      }),
    }
  },
}))

vi.mock('@/lib/prompts', () => ({
  buildPrompt: vi.fn().mockResolvedValue({
    system: 'You are a test AI.',
    user: 'Test user prompt.',
  }),
}))

import { POST } from '@/app/api/ai/route'

describe('POST /api/ai', () => {
  it('calls Claude with the built prompt and returns text', async () => {
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ key: 'stage3_generate_titles', values: { character_name: 'WackyWilliam', story_idea: 'finds a mushroom' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.text).toBe('{"title":"Test Title","subtitle":"Test Subtitle"}')
  })

  it('returns 400 if key is missing', async () => {
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ values: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
