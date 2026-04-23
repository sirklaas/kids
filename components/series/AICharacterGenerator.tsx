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
          key: 'character_generate',
          values: {
            character_type: characterType,
            personality: personalityType,
            name_idea: customDescription,
            series_description: seriesDescription,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('AI Response:', data)
      
      if (!data.text) {
        throw new Error('No text in AI response')
      }
      
      const parsed = parseCharacterResponse(data.text)
      console.log('Parsed character:', parsed)
      onGenerate({
        ...parsed,
        character_type: characterType,
        personality_type: personalityType,
      })
      onClose()
    } catch (err: any) {
      console.error('Generation failed:', err)
      alert('Error: ' + (err.message || 'Could not generate character. Check console for details.'))
    } finally {
      setLoading(false)
    }
  }

  function parseCharacterResponse(text: string | undefined): Partial<Character> {
    const character: Partial<Character> = {}
    
    if (!text) {
      return character
    }
    
    // Clean up the text
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Extract fields using simple regex patterns
    const patterns: Record<string, RegExp> = {
      name: /\*\*NAME:?\*\*\s*[:\-]?\s*([^\n]+)/i,
      visual_description: /\*\*VISUAL(?:\s+APPEARANCE)?:?\*\*\s*[:\-]?\s*([^\n]+(?:\n(?![\*#])[^\n]+)*)/i,
      age: /\*\*AGE:?\*\*\s*[:\-]?\s*([^\n]+)/i,
      personality: /\*\*PERSONALITY(?:\s+TRAITS)?:?\*\*\s*[:\-]?\s*([^\n]+(?:\n(?![\*#])[^\n]+)*)/i,
      catchphrases: /\*\*CATCHPHRASES?:?\*\*\s*[:\-]?\s*([^\n]+)/i,
      voice_style: /\*\*VOICE(?:\s+STYLE)?:?\*\*\s*[:\-]?\s*([^\n]+)/i,
      backstory: /\*\*BACKSTORY:?\*\*\s*[:\-]?\s*([^\n]+(?:\n(?![\*#])[^\n]+)*)/i,
    }
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = cleanText.match(pattern)
      if (match) {
        ;(character as any)[field] = match[1].trim().replace(/\n+/g, ' ')
      }
    }
    
    // Fallback: if no name found, try simple line extraction
    if (!character.name) {
      const nameLine = cleanText.split('\n').find(line => 
        line.match(/^\*\*NAME/i) || line.match(/^NAME:/i)
      )
      if (nameLine) {
        const nameMatch = nameLine.match(/:\s*(.+)/)
        if (nameMatch) character.name = nameMatch[1].trim()
      }
    }
    
    console.log('Extracted fields:', Object.keys(character).filter(k => (character as any)[k]))
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
