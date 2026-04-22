'use client'

import { useEffect, useState } from 'react'
import {
  getSeriesCharacters,
  addCharacterToSeries,
  removeCharacterFromSeries,
  canAddCharacterToSeries,
} from '@/lib/series-characters'
import { createCharacter, updateCharacter } from '@/lib/characters'
import { Character } from '@/lib/types'
import { CharacterForm } from './CharacterForm'
import { AICharacterGenerator } from './AICharacterGenerator'

interface Step2CharacterBuilderProps {
  seriesId: string
  seriesDescription: string
  onBack: () => void
  onComplete: () => void
}

type LinkedCharacter = Character & {
  link_id: string
  character_order: number
  is_main_character: boolean
}

export function Step2CharacterBuilder({
  seriesId,
  seriesDescription,
  onBack,
  onComplete,
}: Step2CharacterBuilderProps) {
  const [characters, setCharacters] = useState<LinkedCharacter[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Partial<LinkedCharacter> | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [canAddMore, setCanAddMore] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [seriesId])

  async function loadCharacters() {
    setLoading(true)
    try {
      const chars = await getSeriesCharacters(seriesId)
      setCharacters(chars as LinkedCharacter[])
      const canAdd = await canAddCharacterToSeries(seriesId)
      setCanAddMore(canAdd)
    } catch (err) {
      console.error('Failed to load characters:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddCharacter(aiData?: Partial<Character>) {
    if (!canAddMore) return

    const newOrder = characters.length + 1

    try {
      const newChar = await createCharacter({
        name: aiData?.name || 'New Character',
        title: aiData?.title || '',
        visual_description: aiData?.visual_description || '',
        age: aiData?.age || '',
        personality: aiData?.personality || '',
        catchphrases: aiData?.catchphrases || '',
        voice_style: aiData?.voice_style || '',
        backstory: aiData?.backstory || '',
        character_type: aiData?.character_type || '',
        personality_type: aiData?.personality_type || '',
      })

      const link = await addCharacterToSeries({
        series_id: seriesId,
        character_id: newChar.id,
        character_order: newOrder,
        is_main_character: newOrder === 1,
      })

      await loadCharacters()

      setSelectedCharacter({
        ...newChar,
        link_id: link.id,
        character_order: newOrder,
        is_main_character: newOrder === 1,
      })
    } catch (err) {
      console.error('Failed to add character:', err)
      alert('Could not add character. Please try again.')
    }
  }

  async function handleRemoveCharacter(linkId: string) {
    if (!confirm('Remove this character from the series?')) return

    try {
      await removeCharacterFromSeries(linkId)
      await loadCharacters()
      if (selectedCharacter?.link_id === linkId) {
        setSelectedCharacter(null)
      }
    } catch (err) {
      console.error('Failed to remove:', err)
    }
  }

  async function handleSaveCharacter() {
    if (!selectedCharacter?.id) return
    setSaving(true)
    try {
      await updateCharacter(selectedCharacter.id, {
        name: selectedCharacter.name,
        title: selectedCharacter.title,
        visual_description: selectedCharacter.visual_description,
        age: selectedCharacter.age,
        personality: selectedCharacter.personality,
        catchphrases: selectedCharacter.catchphrases,
        voice_style: selectedCharacter.voice_style,
        backstory: selectedCharacter.backstory,
        nano_banana_prompt: selectedCharacter.nano_banana_prompt,
        character_type: selectedCharacter.character_type,
        personality_type: selectedCharacter.personality_type,
      })
      await loadCharacters()
    } catch (err) {
      console.error('Failed to save:', err)
      alert('Could not save character. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleAIGenerated(aiData: Partial<Character>) {
    handleAddCharacter(aiData)
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-white/60">Loading characters...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-3 text-lg">Characters ({characters.length}/8)</h3>
          </div>

          <div className="space-y-2">
            {characters.map((char, idx) => (
              <div
                key={char.link_id}
                onClick={() => setSelectedCharacter(char)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCharacter?.link_id === char.link_id
                    ? 'bg-gold/20 border border-gold'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50">#{idx + 1}</span>
                  <span className="font-medium">{char.name}</span>
                  {char.is_main_character && <span className="text-xs text-gold">★</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowAIGenerator(true)}
              disabled={!canAddMore}
              className="btn-primary w-full"
            >
              🤖 AI Generate
            </button>
            <button
              onClick={() => handleAddCharacter()}
              disabled={!canAddMore}
              className="btn-secondary w-full"
            >
              + Manual Add
            </button>
            {!canAddMore && (
              <p className="text-xs text-center text-white/50">Maximum 8 characters reached</p>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          <button onClick={onComplete} className="btn-success">
            Done ✓
          </button>
        </div>
      </div>

      <div className="col-span-8">
        {selectedCharacter ? (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="heading-2">Edit Character</h3>
              <button
                onClick={() => selectedCharacter.link_id && handleRemoveCharacter(selectedCharacter.link_id)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>

            <CharacterForm
              character={selectedCharacter}
              onChange={(updated) =>
                setSelectedCharacter({ ...selectedCharacter, ...updated } as Partial<LinkedCharacter>)
              }
              onGenerateNanoBanana={() => {
                alert('Nano Banana generator coming in next task!')
              }}
            />

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveCharacter}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card text-center py-20">
            <p className="text-white/60">Select a character to edit, or add a new one</p>
          </div>
        )}
      </div>

      <AICharacterGenerator
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={handleAIGenerated}
        seriesDescription={seriesDescription}
      />
    </div>
  )
}
