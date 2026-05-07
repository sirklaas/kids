import { updateStoryCard, getStoryCard } from '@/lib/story-cards'
import { getProject } from '@/lib/projects'
import { getSeries } from '@/lib/series'
import { getSeriesCharacters } from '@/lib/series-characters'
import { buildPrompt } from '@/lib/prompts'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    // 4. GENERATE THE IMAGE VIA HIGGSFIELD CLI
    console.log('[GenerateImage] Calling Higgsfield CLI (nano_banana_2)...')
    
    // Using nano_banana_2 as per our discussion for cartoon consistency
    const cmd = `${process.env.HOME}/.local/bin/higgsfield generate create nano_banana_2 --prompt ${JSON.stringify(imagePrompt)} --aspect_ratio 16:9 --wait --json`
    
    const { stdout, stderr } = await execAsync(cmd)
    
    if (stderr && !stderr.includes('job') && !stderr.includes('progress')) {
      console.warn('[GenerateImage] CLI Stderr output:', stderr)
    }

    let resultUrls: string[] = []
    try {
      // The CLI with --json --wait outputs an array of job objects
      const jobs = JSON.parse(stdout)
      resultUrls = jobs.map((job: any) => job.result?.url).filter(Boolean)
    } catch (parseErr) {
      console.error('[GenerateImage] Failed to parse CLI JSON:', stdout)
      throw new Error('Failed to parse image from Higgsfield')
    }

    if (resultUrls.length === 0) {
      throw new Error('Higgsfield did not return an image URL')
    }

    const finalImageUrl = resultUrls[0]
    console.log('[GenerateImage] ✅ Image generated successfully:', finalImageUrl)

    // 5. Save the generated URL and the exact prompt to the database
    await updateStoryCard(storyCardId, {
      image_url: finalImageUrl,
      image_prompt: imagePrompt
    })

    return Response.json({
      success: true,
      imageUrl: finalImageUrl,
      imagePrompt: imagePrompt
    })

  } catch (err) {
    console.error('[POST /api/generate-image] ERROR:', err)
    return Response.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
