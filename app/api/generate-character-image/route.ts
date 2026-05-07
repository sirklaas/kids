import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: Request): Promise<Response> {
  try {
    const { name, visual_description, nano_banana_prompt, seriesStyle } = await request.json()

    if (!name || !visual_description) {
      return Response.json({ error: 'Name and visual description are required' }, { status: 400 })
    }

    // 1. Build the exact visual rules
    const style = seriesStyle || '3D Animation style, vibrant colors, cinematic lighting'
    const nanoBanana = nano_banana_prompt ? `(Nano Banana Concept: ${nano_banana_prompt})` : ''
    
    // 2. Combine into the Master Prompt specifically for a clean character profile shot
    const imagePrompt = `
      STYLE: ${style}
      CHARACTER: ${visual_description} ${nanoBanana}
      ENVIRONMENT: Neutral studio background, clean lighting
      ACTION: Character standing proudly, looking at the camera, full body or medium shot
    `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()

    console.log('[GenerateAvatar] Master Prompt Created:', imagePrompt)

    // 3. GENERATE THE IMAGE VIA HIGGSFIELD CLI
    console.log('[GenerateAvatar] Calling Higgsfield CLI (nano_banana_2)...')
    
    // Using nano_banana_2 as per our discussion for cartoon consistency
    const cmd = `${process.env.HOME}/.local/bin/higgsfield generate create nano_banana_2 --prompt ${JSON.stringify(imagePrompt)} --aspect_ratio 1:1 --wait --json`
    
    const { stdout, stderr } = await execAsync(cmd)
    
    if (stderr && !stderr.includes('job') && !stderr.includes('progress')) {
      console.warn('[GenerateAvatar] CLI Stderr output:', stderr)
    }

    let resultUrls: string[] = []
    try {
      const jobs = JSON.parse(stdout)
      resultUrls = jobs.map((job: any) => job.result?.url).filter(Boolean)
    } catch (parseErr) {
      console.error('[GenerateAvatar] Failed to parse CLI JSON:', stdout)
      throw new Error('Failed to parse image from Higgsfield')
    }

    if (resultUrls.length === 0) {
      throw new Error('Higgsfield did not return an image URL')
    }

    const finalImageUrl = resultUrls[0]
    console.log('[GenerateAvatar] ✅ Avatar generated successfully:', finalImageUrl)

    return Response.json({
      success: true,
      imageUrl: finalImageUrl,
      imagePrompt: imagePrompt
    })

  } catch (err) {
    console.error('[POST /api/generate-character-image] ERROR:', err)
    return Response.json({ error: 'Failed to generate character image' }, { status: 500 })
  }
}
