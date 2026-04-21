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
    
    // Check if OpenRouter should be used
    const useOpenRouter = process.env.USE_OPENROUTER === 'true'
    
    if (useOpenRouter) {
      // Use OpenRouter with configurable model
      const model = process.env.OPENROUTER_MODEL || 'kimi-k2.5'
      // Temporarily hardcoded API key - fix env file later
      const apiKey = process.env.OPENROUTER_API_KEY || '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'
      
      console.log('[OpenRouter] Using model:', model)
      console.log('[OpenRouter] API key length:', apiKey.length)
      console.log('[OpenRouter] API key starts with:', apiKey.substring(0, 20))
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Kids Studio',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: user }
          ],
          max_tokens: 4096,
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('[OpenRouter Error]', error)
        console.error('[OpenRouter Status]', response.status)
        return Response.json({ error: 'AI request failed' }, { status: 500 })
      }
      
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''
      const usage = data.usage
      return Response.json({
        text,
        model,
        provider: 'openrouter',
        usage: usage ? {
          input_tokens: usage.prompt_tokens,
          output_tokens: usage.completion_tokens,
        } : undefined,
      })
    }
    
    // Use direct Anthropic (original behavior)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const first = message.content[0]
    const text = first?.type === 'text' ? first.text : ''
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
    console.error('[POST /api/ai] CRITICAL ERROR:', err)
    const errorDetails = err instanceof Error 
      ? { message: err.message, stack: err.stack, name: err.name }
      : { raw: String(err) }
    console.error('[POST /api/ai] DETAILS:', JSON.stringify(errorDetails, null, 2))
    return Response.json({ 
      error: 'AI request failed', 
      details: errorDetails 
    }, { status: 500 })
  }
}
