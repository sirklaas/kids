import { NextResponse } from 'next/server'

const MAX_BYTES = 1_500_000 // ~1.5MB — safe-ish for PocketBase text fields as data URL

/**
 * Accepts multipart file upload; returns a data-URL the client can store in `avatar_url`.
 * Works on Vercel/serverless without a local Higgsfield CLI.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Image too large (max ${Math.round(MAX_BYTES / 1024)} KB)` },
        { status: 400 }
      )
    }

    const mime = file.type || 'image/jpeg'
    if (!mime.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const url = `data:${mime};base64,${base64}`

    return NextResponse.json({
      success: true,
      url,
    })
  } catch (error) {
    console.error('[UploadAvatar] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
