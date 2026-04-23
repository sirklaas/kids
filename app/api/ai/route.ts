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

    // Use direct Anthropic Claude (simple, reliable)
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[POST /api/ai] ANTHROPIC_API_KEY not set')
      return Response.json({ error: 'AI API key not configured' }, { status: 500 })
    }

    console.log('[AI] Sending prompt:', { key, system: system?.slice(0, 50) + '...', user: user?.slice(0, 50) + '...' })
    
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const first = message.content[0]
    const text = first?.type === 'text' ? first.text : ''
    
    console.log('[AI] Raw response:', text?.slice(0, 200) + '...')

    return Response.json({
      text,
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      usage: message.usage ? {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      } : undefined,
    })
  } catch (err) {
    console.error('[POST /api/ai] ERROR:', err)
    const errorDetails = err instanceof Error
      ? { message: err.message, name: err.name }
      : { raw: String(err) }
    return Response.json({
      error: 'AI request failed',
      details: errorDetails
    }, { status: 500 })
  }
}
