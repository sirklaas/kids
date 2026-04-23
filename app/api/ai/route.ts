import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { buildPrompt } from '@/lib/prompts'

type Provider = 'anthropic' | 'openrouter'

interface AIConfig {
  provider: Provider
  model: string
  label: string
}

// Configure your AI provider here using AI_PROVIDER env variable
// Options: 'anthropic' (default), 'openrouter'
const getAIConfig = (): AIConfig => {
  const provider = (process.env.AI_PROVIDER as Provider) ?? 'anthropic'

  switch (provider) {
    case 'openrouter':
      return {
        provider: 'openrouter',
        model: process.env.OPENROUTER_MODEL ?? 'moonshotai/kimi-k2.6-85b',
        label: 'Kimi K2.6',
      }
    case 'anthropic':
    default:
      return {
        provider: 'anthropic',
        model: 'claude-sonnet-4-6',
        label: 'Claude Sonnet 4.6',
      }
  }
}

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
  const config = getAIConfig()

  try {
    const { system, user } = await buildPrompt(key, values ?? {})

    console.log('[AI] Sending prompt:', {
      key,
      provider: config.provider,
      model: config.model,
      system: system?.slice(0, 50) + '...',
      user: user?.slice(0, 50) + '...',
    })

    let text = ''
    let usage = { input_tokens: 0, output_tokens: 0 }

    if (config.provider === 'openrouter') {
      // OpenRouter via OpenAI-compatible API
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) {
        console.error('[POST /api/ai] OPENROUTER_API_KEY not set')
        return Response.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
      }

      const client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      })

      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          ...(system ? [{ role: 'system' as const, content: system }] : []),
          { role: 'user' as const, content: user },
        ],
        temperature: 0.7,
      })

      text = response.choices[0]?.message?.content ?? ''
      usage = {
        input_tokens: response.usage?.prompt_tokens ?? 0,
        output_tokens: response.usage?.completion_tokens ?? 0,
      }
    } else {
      // Anthropic Claude
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        console.error('[POST /api/ai] ANTHROPIC_API_KEY not set')
        return Response.json({ error: 'AI API key not configured' }, { status: 500 })
      }

      const client = new Anthropic({ apiKey })
      const message = await client.messages.create({
        model: config.model,
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: user }],
      })

      const first = message.content[0]
      text = first?.type === 'text' ? first.text : ''
      usage = {
        input_tokens: message.usage?.input_tokens ?? 0,
        output_tokens: message.usage?.output_tokens ?? 0,
      }
    }

    console.log('[AI] Raw response:', text?.slice(0, 200) + '...')

    return Response.json({
      text,
      model: config.model,
      provider: config.provider,
      label: config.label,
      usage,
    })
  } catch (err) {
    console.error('[POST /api/ai] ERROR:', err)
    const errorDetails = err instanceof Error
      ? { message: err.message, name: err.name }
      : { raw: String(err) }
    return Response.json({
      error: 'AI request failed',
      details: errorDetails,
    }, { status: 500 })
  }
}
