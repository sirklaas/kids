'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { Character } from '@/lib/types'

interface AICharacterGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (characterData: Partial<Character>) => void
  seriesDescription: string
}

const CHARACTER_TYPES = [
  { value: 'animal', label: '🐻 Animal (Bear, Rabbit, Fox...)' },
  { value: 'human', label: '👧 Human Child' },
  { value: 'creature', label: '🦄 Fantasy Creature' },
  { value: 'robot', label: '🤖 Robot/Android' },
  { value: 'vehicle', label: '🚗 Vehicle (Car, Plane...)' },
  { value: 'other', label: '✨ Other' },
]

const PERSONALITY_TYPES = [
  { value: 'brave', label: 'Brave & Adventurous' },
  { value: 'curious', label: 'Curious & Smart' },
  { value: 'funny', label: 'Funny & Playful' },
  { value: 'kind', label: 'Kind & Caring' },
  { value: 'mischievous', label: 'Mischievous' },
  { value: 'shy', label: 'Shy & Gentle' },
]

export function AICharacterGenerator({
  isOpen,
  onClose,
  onGenerate,
  seriesDescription,
}: AICharacterGeneratorProps) {
  const [characterType, setCharacterType] = useState('animal')
  const [personalityType, setPersonalityType] = useState('brave')
  const [customDescription, setCustomDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage1_generate_character',
          values: {
            character_type: characterType,
            personality: personalityType,
            name_idea: customDescription,
            series_description: seriesDescription,
          },
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      const parsed = parseCharacterResponse(data.text)
      onGenerate({
        ...parsed,
        character_type: characterType,
        personality_type: personalityType,
      })
      onClose()
    } catch (err) {
      console.error('Generation failed:', err)
      alert('Could not generate character. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function parseCharacterResponse(text: string): Partial<Character> {
    // Try JSON first (preferred format from the seeded prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const obj = JSON.parse(jsonMatch[0])
        return {
          name: obj.name || '',
          title: obj.title || '',
          visual_description: obj.visual_description || obj.visual || '',
          age: obj.age || '',
          personality: obj.personality || '',
          catchphrases: Array.isArray(obj.catchphrases)
            ? obj.catchphrases.join('\n')
            : obj.catchphrases || '',
          voice_style: obj.voice_style || obj.voice || '',
          backstory: obj.backstory || '',
        }
      } catch {
        // Fall through to line-based parsing
      }
    }

    // Fallback: parse numbered / labeled lines
    const lines = text.split('\n').filter((l) => l.trim())
    const character: Partial<Character> = {}

    lines.forEach((line) => {
      const lower = line.toLowerCase()
      const value = line.split(':').slice(1).join(':').trim()
      if (lower.includes('name:') && !character.name) {
        character.name = value
      } else if (lower.includes('visual') || lower.includes('appearance')) {
        character.visual_description = value
      } else if (lower.includes('age')) {
        character.age = value
      } else if (lower.includes('personality')) {
        character.personality = value
      } else if (lower.includes('catchphrase')) {
        character.catchphrases = value
      } else if (lower.includes('voice')) {
        character.voice_style = value
      } else if (lower.includes('backstory')) {
        character.backstory = value
      }
    })

    return character
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Character Generator">
      <div className="space-y-6">
        <p className="text-body-sm text-white/70">
          Let AI create a unique character for your series. Choose the type and personality, or add custom details.
        </p>

        <div>
          <label className="field-label">Character Type</label>
          <div className="grid grid-cols-2 gap-3">
            {CHARACTER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setCharacterType(type.value)}
                className={`p-3 rounded-lg text-left text-sm transition-colors ${
                  characterType === type.value
                    ? 'bg-gold/20 border border-gold text-gold'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Personality</label>
          <select
            value={personalityType}
            onChange={(e) => setPersonalityType(e.target.value)}
            className="input w-full"
          >
            {PERSONALITY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Custom Details (optional)</label>
          <textarea
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            placeholder="Add specific details like 'red hair', 'loves apples', 'wears a blue hat'..."
            className="textarea w-full h-24"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Generating...' : '🎲 Generate Character'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
