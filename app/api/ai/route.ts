import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from '@/lib/prompts'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('key' in body) ||
    typeof (body as Record<string, unknown>).key !== 'string'
  ) {
    return Response.json({ error: 'key is required' }, { status: 400 })
  }

  const { key, values } = body as { key: string; values?: Record<string, string> }

  try {
    const { system, user } = await buildPrompt(key, values ?? {})
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const first = message.content[0]
    const text = first?.type === 'text' ? first.text : ''
    return Response.json({ text })
  } catch (err) {
    console.error('[POST /api/ai]', err)
    return Response.json({ error: 'AI request failed' }, { status: 500 })
  }
}
