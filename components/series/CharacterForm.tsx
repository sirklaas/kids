'use client'

import { useState } from 'react'
import { Character } from '@/lib/types'

interface CharacterFormProps {
  character: Partial<Character>
  onChange: (character: Partial<Character>) => void
  onGenerateNanoBanana?: () => void
}

export function CharacterForm({ character, onChange, onGenerateNanoBanana }: CharacterFormProps) {
  const [generatingNano, setGeneratingNano] = useState(false)

  const handleGenerateNanoBanana = async () => {
    if (!character.name?.trim()) {
      alert('Please add a name first')
      return
    }
    if (!character.visual_description?.trim()) {
      alert('Please add visual appearance details first')
      return
    }

    setGeneratingNano(true)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'nano_banana_prompt',
          values: {
            name: character.name,
            visual_appearance: character.visual_description,
            age_group: character.age || 'child',
            personality: character.personality || '',
            series_description: '',
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      onChange({ ...character, nano_banana_prompt: data.text })
    } catch (err) {
      console.error('Failed to generate Nano Banana prompt:', err)
      alert('Could not generate Nano Banana prompt. Please try again.')
    } finally {
      setGeneratingNano(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Name *</label>
          <input
            type="text"
            value={character.name || ''}
            onChange={(e) => onChange({ ...character, name: e.target.value })}
            placeholder="Character name"
            className="input w-full"
          />
        </div>
        <div>
          <label className="field-label">Age Group</label>
          <select
            value={character.age || 'child'}
            onChange={(e) => onChange({ ...character, age: e.target.value })}
            className="input w-full"
          >
            <option value="toddler">Toddler (2-4)</option>
            <option value="child">Child (5-8)</option>
            <option value="teen">Teen (9-12)</option>
            <option value="adult">Adult</option>
            <option value="elder">Elder</option>
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Visual Appearance *</label>
        <textarea
          value={character.visual_description || ''}
          onChange={(e) => onChange({ ...character, visual_description: e.target.value })}
          placeholder="Detailed visual description for image generation... (e.g., A big grey bear with a red hat)"
          className="textarea w-full h-20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Personality</label>
          <input
            type="text"
            value={character.personality || ''}
            onChange={(e) => onChange({ ...character, personality: e.target.value })}
            placeholder="Key personality traits"
            className="input w-full"
          />
        </div>
        <div>
          <label className="field-label">Catchphrase</label>
          <input
            type="text"
            value={character.catchphrases || ''}
            onChange={(e) => onChange({ ...character, catchphrases: e.target.value })}
            placeholder="Signature phrase"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Voice Style</label>
        <input
          type="text"
          value={character.voice_style || ''}
          onChange={(e) => onChange({ ...character, voice_style: e.target.value })}
          placeholder="e.g., High-pitched, energetic, with a slight lisp"
          className="input w-full"
        />
      </div>

      <div>
        <label className="field-label">Backstory</label>
        <textarea
          value={character.backstory || ''}
          onChange={(e) => onChange({ ...character, backstory: e.target.value })}
          placeholder="Brief backstory..."
          className="textarea w-full h-20"
        />
      </div>

      {/* Nano Banana Prompt Section */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="field-label">Nano Banana Image Prompt</label>
          <button
            type="button"
            onClick={handleGenerateNanoBanana}
            disabled={generatingNano || !character.name?.trim() || !character.visual_description?.trim()}
            className="btn-secondary text-sm py-2 px-4"
          >
            {generatingNano ? '⏳ Generating...' : '🎨 Generate Prompt'}
          </button>
        </div>
        <textarea
          value={character.nano_banana_prompt || ''}
          onChange={(e) => onChange({ ...character, nano_banana_prompt: e.target.value })}
          placeholder="AI-generated prompt for consistent character images... Click 'Generate Prompt' above to create one."
          className="textarea w-full h-24 text-sm"
        />
        <p className="text-xs text-white/50 mt-1">
          This prompt is used in Nano Banana for consistent character generation.
        </p>
      </div>
    </div>
  )
}
