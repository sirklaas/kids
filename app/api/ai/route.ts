import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from '@/lib/prompts'

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as { key?: string; values?: Record<string, string> }

  if (!body.key) {
    return Response.json({ error: 'key is required' }, { status: 400 })
  }

  const { system, user } = await buildPrompt(body.key, body.values ?? {})

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return Response.json({ text })
}
