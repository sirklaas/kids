import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    // Create folder if it doesn't exist
    const outputDir = path.join(process.cwd(), 'kids', 'videoprompts')
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }
    
    // Generate filename with readable ID
    const readableId = data.readable_id || data.project_id
    const filename = `${readableId}-${data.act}-${Date.now()}.json`
    const filepath = path.join(outputDir, filename)
    
    // Write file
    await writeFile(filepath, JSON.stringify(data, null, 2))
    
    console.log('[SaveVideoPrompt] Saved to:', filepath)
    
    return NextResponse.json({ 
      success: true, 
      filepath: `/kids/videoprompts/${filename}` 
    })
  } catch (err) {
    console.error('[SaveVideoPrompt] Error:', err)
    return NextResponse.json({ 
      success: false, 
      error: (err as Error).message 
    }, { status: 500 })
  }
}
