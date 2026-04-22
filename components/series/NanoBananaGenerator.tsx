'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface NanoBananaGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string) => void
  characterData: {
    name: string
    visual_appearance: string
    age_group: string
    personality: string
  }
  seriesDescription: string
}

export function NanoBananaGenerator({
  isOpen,
  onClose,
  onGenerate,
  characterData,
  seriesDescription,
}: NanoBananaGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState('')

  async function handleGenerate() {
    setLoading(true)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'nano_banana_prompt',
          values: {
            name: characterData.name,
            visual_appearance: characterData.visual_appearance,
            age_group: characterData.age_group,
            personality_traits: characterData.personality,
            series_description: seriesDescription,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      setPreview(data.text.trim())
    } catch (err) {
      console.error('Generation failed:', err)
      alert('Could not generate prompt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAccept() {
    onGenerate(preview)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nano Banana Image Prompt">
      <div className="space-y-6 max-w-xl">
        <div className="text-sm text-white/70 space-y-2">
          <p>
            Generate a prompt for <strong>Nano Banana</strong> - an AI tool for creating
            consistent character images.
          </p>
          <p className="text-xs text-white/50">
            This prompt will help you generate the same character across different
            poses, expressions, and scenes.
          </p>
        </div>

        {/* Character Summary */}
        <div className="bg-white/5 rounded-lg p-4 space-y-1">
          <p className="text-sm">
            <span className="text-white/50">Character:</span>{' '}
            <span className="font-medium">{characterData.name || 'Unnamed'}</span>
          </p>
          <p className="text-sm">
            <span className="text-white/50">Appearance:</span>{' '}
            <span className="text-white/70">
              {characterData.visual_appearance?.slice(0, 60)}...
            </span>
          </p>
        </div>

        {/* Generate Button */}
        {!preview && (
          <button
            onClick={handleGenerate}
            disabled={loading || !characterData.visual_appearance}
            className="btn-primary w-full"
          >
            {loading ? 'Generating...' : '🎨 Generate Nano Banana Prompt'}
          </button>
        )}

        {!characterData.visual_appearance && (
          <p className="text-xs text-amber-400 text-center">
            Please add visual appearance details first
          </p>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-4">
            <div>
              <label className="field-label">Generated Prompt</label>
              <textarea
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                className="textarea w-full h-40 text-sm"
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-amber-400">
                💡 How to use this in Nano Banana:
              </p>
              <ol className="text-sm text-white/70 list-decimal list-inside space-y-1">
                <li>Copy the prompt above</li>
                <li>Go to nano-banana.ai</li>
                <li>Paste in the Character/Prompt field</li>
                <li>Generate consistent character images!</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleAccept} className="btn-primary flex-1">
                Save to Character
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
