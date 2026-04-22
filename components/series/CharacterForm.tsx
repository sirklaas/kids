'use client'

import { Character } from '@/lib/types'

interface CharacterFormProps {
  character: Partial<Character>
  onChange: (character: Partial<Character>) => void
  onGenerateNanoBanana: () => void
}

export function CharacterForm({ character, onChange, onGenerateNanoBanana }: CharacterFormProps) {
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
          <label className="field-label">Age</label>
          <input
            type="text"
            value={character.age || ''}
            onChange={(e) => onChange({ ...character, age: e.target.value })}
            placeholder="e.g., 7 years old"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Visual Description</label>
        <textarea
          value={character.visual_description || ''}
          onChange={(e) => onChange({ ...character, visual_description: e.target.value })}
          placeholder="Detailed visual description for image generation..."
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

      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <label className="field-label">Nano Banana Image Prompt</label>
          <button
            type="button"
            onClick={onGenerateNanoBanana}
            className="text-sm text-gold hover:text-gold/80"
          >
            🎨 Generate Prompt
          </button>
        </div>
        <textarea
          value={character.nano_banana_prompt || ''}
          onChange={(e) => onChange({ ...character, nano_banana_prompt: e.target.value })}
          placeholder="AI-generated prompt for consistent character images..."
          className="textarea w-full h-24 text-sm"
        />
        <p className="text-xs text-white/50 mt-1">
          This prompt is used in Nano Banana for consistent character generation.
        </p>
      </div>
    </div>
  )
}
