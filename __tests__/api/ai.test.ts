import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockMessagesCreate, mockBuildPrompt } = vi.hoisted(() => ({
  mockMessagesCreate: vi.fn(),
  mockBuildPrompt: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockMessagesCreate }
  },
}))

vi.mock('@/lib/prompts', () => ({
  buildPrompt: mockBuildPrompt,
}))

import { POST } from '@/app/api/ai/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockBuildPrompt.mockResolvedValue({ system: 'You are a test AI.', user: 'Test prompt.' })
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: 'text', text: '{"title":"Test Title","subtitle":"Test Subtitle"}' }],
  })
})

describe('POST /api/ai', () => {
  it('calls Claude with the built prompt and returns text', async () => {
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ key: 'stage3_generate_titles', values: { character_name: 'WackyWilliam' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.text).toBe('{"title":"Test Title","subtitle":"Test Subtitle"}')
    expect(mockMessagesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6', max_tokens: 4096 })
    )
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

  it('returns 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 500 when buildPrompt throws', async () => {
    mockBuildPrompt.mockRejectedValue(new Error('PocketBase error'))
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ key: 'stage3_generate_titles', values: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('AI request failed')
  })

  it('returns 500 when Anthropic throws', async () => {
    mockMessagesCreate.mockRejectedValue(new Error('Anthropic API error'))
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ key: 'stage3_generate_titles', values: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('AI request failed')
  })
})
