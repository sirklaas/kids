'use client'

import { useState } from 'react'
import { Character } from '@/lib/types'

interface CharacterFormProps {
  character: Partial<Character>
  onChange: (character: Partial<Character>) => void
  seriesStyle?: string
  onSeriesStyleChange?: (style: string) => void
}

export function CharacterForm({ character, onChange, seriesStyle, onSeriesStyleChange }: CharacterFormProps) {


  const [generatingAvatar, setGeneratingAvatar] = useState(false)

  const handleGenerateAvatar = async () => {
    if (!character.name?.trim() || !character.visual_description?.trim()) {
      alert('Please add a name and visual description first')
      return
    }

    setGeneratingAvatar(true)
    try {
      const response = await fetch('/api/generate-character-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: character.name,
          visual_description: character.visual_description,
          nano_banana_prompt: character.nano_banana_prompt || '',
          seriesStyle: seriesStyle || 'Cartoon style',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate image')

      const data = await response.json()
      onChange({ ...character, avatar_url: data.imageUrl })
    } catch (err) {
      console.error('Failed to generate avatar:', err)
      alert('Could not generate avatar. Please check your Higgsfield CLI setup.')
    } finally {
      setGeneratingAvatar(false)
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

      <div className="flex gap-6">
        {/* Avatar Display */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-64 h-64 shrink-0 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative shadow-lg">
            {character.avatar_url ? (
              <img src={character.avatar_url} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl opacity-20">👤</span>
            )}
          </div>
          {character.name && (
            <span className="text-lg font-medium tracking-wide text-white/90">{character.name}</span>
          )}
        </div>
        
        {/* Avatar Controls */}
        <div className="flex-1 flex flex-col justify-center gap-3">
          <label className="field-label">Character Avatar</label>
          <button
            type="button"
            onClick={handleGenerateAvatar}
            disabled={generatingAvatar || !character.name?.trim() || !character.visual_description?.trim()}
            className="btn-primary py-3 px-6 self-start text-sm shadow-md"
          >
            {generatingAvatar ? '⏳ Generating...' : '✨ Generate Profile Picture'}
          </button>
          
          <div className="mt-2 p-3 bg-black/20 border border-white/5 rounded-lg max-w-sm">
            <span className="text-xs text-white/40 block mb-1 uppercase tracking-wider">Applied Series Style:</span>
            <span className="text-sm text-gold block">
              {seriesStyle || '⚠️ None (Defaults to Cartoon)'}
            </span>
            {!seriesStyle && (
              <p className="text-xs text-red-400 mt-1">Please set a Global Series Style on the left side first!</p>
            )}
          </div>
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


    </div>
  )
}
