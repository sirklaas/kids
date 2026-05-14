/**
 * Parse JSON error body from POST /api/ai so the client shows useful messages
 * (missing API key, PocketBase prompt missing, model errors, etc.).
 */
export async function readAiApiErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      error?: string
      details?: { message?: string; hint?: string }
    }
    const parts: string[] = []
    if (typeof data.error === 'string' && data.error.trim()) {
      parts.push(data.error.trim())
    }
    if (typeof data.details?.message === 'string' && data.details.message.trim()) {
      parts.push(data.details.message.trim())
    }
    if (typeof data.details?.hint === 'string' && data.details.hint.trim()) {
      parts.push(data.details.hint.trim())
    }
    if (parts.length) return parts.join(' — ')
  } catch {
    /* fall through */
  }
  return `${res.status} ${res.statusText}`.trim()
}

export async function throwIfAiApiFailed(res: Response): Promise<void> {
  if (res.ok) return
  throw new Error(await readAiApiErrorMessage(res))
}
