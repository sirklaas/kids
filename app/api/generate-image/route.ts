import { updateStoryCard, getStoryCard } from '@/lib/story-cards'
import { getProject } from '@/lib/projects'
import { getSeries } from '@/lib/series'
import { getSeriesCharacters } from '@/lib/series-characters'
import { buildPrompt } from '@/lib/prompts'

export async function POST(request: Request): Promise<Response> {
  try {
    const { storyCardId } = await request.json()
    if (!storyCardId) {
      return Response.json({ error: 'storyCardId is required' }, { status: 400 })
    }

    // 1. Fetch all the necessary data to construct the prompt
    const card = await getStoryCard(storyCardId)
    const project = await getProject(card.project_id)
    const series = await getSeries(project.series_id)
    const characters = await getSeriesCharacters(series.id)
    const mainCharacter = characters.find(c => c.is_main_character) || characters[0]

    if (!mainCharacter) {
      throw new Error('No characters found for this series')
    }

    // 2. Build the exact visual rules based on Phase 1 planning
    const visualStyle = series.visual_style || '3D Animation style, vibrant colors, cinematic lighting'
    const charAppearance = mainCharacter.visual_description || 'A cartoon character'
    const nanoBanana = mainCharacter.nano_banana_prompt ? `(Nano Banana Concept: ${mainCharacter.nano_banana_prompt})` : ''
    
    // 3. Combine into the Master Prompt
    const imagePrompt = `
      STYLE: ${visualStyle}
      CHARACTER: ${charAppearance} ${nanoBanana}
      ENVIRONMENT: ${card.environment || 'neutral background'}
      ACTION: ${card.written_scene || card.expand?.plot_card_id?.scene_beat || 'Looking at the camera'}
    `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

    console.log('[GenerateImage] Master Prompt Created:', imagePrompt)

    // 4. GENERATE THE IMAGE
    // TODO: Connect this to Highsfield MCP / FLUX API
    // For now, we simulate the generation delay and return a beautiful placeholder
    await new Promise(r => setTimeout(r, 1500))
    
    // Using a placeholder image that looks somewhat cinematic until FLUX is connected
    const randomSeed = Math.floor(Math.random() * 1000)
    const mockImageUrl = `https://picsum.photos/seed/${storyCardId}${randomSeed}/800/450`

    // 5. Save the generated URL and the exact prompt to the database
    await updateStoryCard(storyCardId, {
      image_url: mockImageUrl,
      image_prompt: imagePrompt
    })

    return Response.json({
      success: true,
      imageUrl: mockImageUrl,
      imagePrompt: imagePrompt
    })

  } catch (err) {
    console.error('[POST /api/generate-image] ERROR:', err)
    return Response.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
