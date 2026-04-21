import pb from '@/lib/pocketbase'
import { buildPrompt } from '@/lib/prompts'

export async function GET(): Promise<Response> {
  const results: Record<string, unknown> = {}
  
  // Test 1: PocketBase connection
  try {
    const health = await pb.health.check()
    results.pocketbase = { status: 'ok', health }
  } catch (err) {
    results.pocketbase = { 
      status: 'error', 
      error: err instanceof Error ? err.message : 'Unknown error',
      url: process.env.NEXT_PUBLIC_POCKETBASE_URL 
    }
  }
  
  // Test 2: Load a prompt
  try {
    const { system, user } = await buildPrompt('stage3_generate_titles', {
      character_name: 'Test',
      story_idea: 'Test story'
    })
    results.prompt = { 
      status: 'ok', 
      systemLength: system.length,
      userLength: user.length 
    }
  } catch (err) {
    results.prompt = { 
      status: 'error', 
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
  
  // Test 3: Check env vars (safe)
  results.env = {
    pocketbase_url: process.env.NEXT_PUBLIC_POCKETBASE_URL ? 'set' : 'missing',
    use_openrouter: process.env.USE_OPENROUTER,
    openrouter_model: process.env.OPENROUTER_MODEL,
    openrouter_key: process.env.OPENROUTER_API_KEY ? 'set (length: ' + process.env.OPENROUTER_API_KEY.length + ')' : 'missing',
    anthropic_key: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing'
  }
  
  return Response.json(results)
}
