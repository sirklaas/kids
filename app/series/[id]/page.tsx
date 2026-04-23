'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSeries, updateSeries, createSeries } from '@/lib/series'
import { getSeriesCharacters, addCharacterToSeries, removeCharacterFromSeries } from '@/lib/series-characters'
import { createCharacter, updateCharacter } from '@/lib/characters'
import { Series, Character } from '@/lib/types'
import { AICharacterGenerator } from '@/components/series/AICharacterGenerator'
import { CharacterForm } from '@/components/series/CharacterForm'
import { NanoBananaGenerator } from '@/components/series/NanoBananaGenerator'

interface EditSeriesPageProps {
  params: Promise<{ id: string }>
}

export default function EditSeriesPage({ params }: EditSeriesPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const isNew = id === 'new'
  
  const [series, setSeries] = useState<Partial<Series>>({
    name: '',
    description: '',
    image_url: '',
  })
  const [characters, setCharacters] = useState<Array<Character & { link_id: string; character_order: number; is_main_character: boolean }>>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedCharacter, setSelectedCharacter] = useState<(Character & { link_id: string }) | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showNanoBanana, setShowNanoBanana] = useState(false)

  useEffect(() => {
    if (isNew) {
      createSeries({ name: 'New Series' }).then((newSeries) => {
        router.replace(`/series/${newSeries.id}`)
      })
      return
    }

    loadSeries()
  }, [id, isNew, router])

  async function loadSeries() {
    try {
      console.log('Loading series with ID:', id)
      const [data, chars] = await Promise.all([
        getSeries(id),
        getSeriesCharacters(id),
      ])
      console.log('Series loaded:', data)
      console.log('Characters loaded:', chars)
      setSeries(data)
      setCharacters(chars)
    } catch (err) {
      console.error('Failed to load series:', err)
      alert('Error loading series: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSeries() {
    if (!series.name || isNew) return
    
    setSaving(true)
    try {
      await updateSeries(id, {
        name: series.name,
        description: series.description,
        image_url: series.image_url,
      })
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleAIGenerated(aiData: any) {
    try {
      // Create the character
      const newChar = await createCharacter({
        name: aiData.name || 'New Character',
        visual_appearance: aiData.visual_description || '',
        age_group: aiData.age || 'child',
        personality: aiData.personality || '',
        catchphrases: aiData.catchphrases || '',
        voice_style: aiData.voice_style || '',
        backstory: aiData.backstory || '',
        character_type: aiData.character_type || 'animal',
        personality_type: aiData.personality_type || 'brave',
      })

      // Link to series
      await addCharacterToSeries({
        series_id: id,
        character_id: newChar.id,
        character_order: characters.length + 1,
        is_main_character: characters.length === 0,
      })

      // Refresh characters list
      await loadSeries()
      setShowAIGenerator(false)
    } catch (err) {
      console.error('Failed to create character:', err)
      alert('Could not create character. Please try again.')
    }
  }

  async function handleAddNewCharacter() {
    try {
      const newChar = await createCharacter({
        name: 'New Character',
        visual_appearance: '',
        age_group: 'child',
        personality: '',
      })
      const link = await addCharacterToSeries({
        series_id: id,
        character_id: newChar.id,
        character_order: characters.length + 1,
        is_main_character: characters.length === 0,
      })
      await loadSeries()
      setSelectedCharacter({ ...newChar, link_id: link.id })
    } catch (err) {
      console.error('Failed to add character:', err)
      alert('Could not add character. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to Series
          </Link>
          <h1 className="heading-1 mt-2">
            {isNew ? 'Create Series' : series.name || 'Edit Series'}
          </h1>
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep(1)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              step === 1 ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            1. Series Info
          </button>
          <span className="text-white/40">→</span>
          <button
            onClick={() => setStep(2)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              step === 2 ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            2. Characters ({characters.length})
          </button>
        </div>
      </div>

      {step === 1 ? (
        /* Step 1: Series Info */
        <div className="card max-w-2xl px-[14px]">
          <h2 className="heading-2 mb-6 pt-[10px] pb-[10px] pl-[14px] pr-[14px]">Series Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="field-label">Series Name *</label>
              <input
                type="text"
                value={series.name || ''}
                onChange={(e) => setSeries({ ...series, name: e.target.value })}
                placeholder="e.g., Adventures of Paddington"
                className="input w-full"
                style={{ marginTop: '0px', marginBottom: '0px' }}
              />
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea
                value={series.description || ''}
                onChange={(e) => setSeries({ ...series, description: e.target.value })}
                placeholder="Describe your series..."
                className="textarea w-full h-32"
              />
              <p className="text-xs text-white/50 mt-1" style={{ paddingLeft: '2px', paddingRight: '2px' }}>
                This helps the AI understand the tone and style.
              </p>
            </div>

            <div>
              <label className="field-label">Series Image URL</label>
              <input
                type="text"
                value={series.image_url || ''}
                onChange={(e) => setSeries({ ...series, image_url: e.target.value })}
                placeholder="https://..."
                className="input w-full"
                style={{ marginTop: '0px', marginBottom: '0px' }}
              />
              {series.image_url && (
                <img
                  src={series.image_url}
                  alt="Preview"
                  className="mt-3 h-32 w-32 object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Link href="/">
              <button className="btn-secondary">Cancel</button>
            </Link>
            <div className="flex gap-3">
              <button
                onClick={handleSaveSeries}
                disabled={!series.name || saving}
                className="btn-secondary"
                style={{ width: '104px' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                Next: Characters →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Step 2: Character Builder */
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Character List */}
          <div className="col-span-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3 text-lg">Characters</h3>
                <span className="text-xs text-white/50">{characters.length}/8</span>
              </div>

              <div className="space-y-2">
                {characters.map((char, idx) => (
                  <div
                    key={char.link_id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCharacter?.link_id === char.link_id
                        ? 'bg-gold/20 border border-gold'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/50">#{idx + 1}</span>
                      <span className="font-medium">{char.name}</span>
                      {char.is_main_character && <span className="text-gold">★</span>}
                    </div>
                  </div>
                ))}
                
                {characters.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-4">
                    No characters yet
                  </p>
                )}
              </div>

              <div className="mt-12 space-y-2">
                <button
                  onClick={handleAddNewCharacter}
                  className="btn-secondary w-full"
                >
                  + New Character
                </button>
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="btn-primary w-full"
                >
                  🤖 AI Generate
                </button>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Back
              </button>
              <Link href="/">
                <button className="btn-success">Done ✓</button>
              </Link>
            </div>
          </div>

          {/* Right: Character Editor */}
          <div className="col-span-8">
            {selectedCharacter ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="heading-2">Edit Character</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowNanoBanana(true)}
                      className="text-sm text-gold hover:text-gold/80"
                    >
                      🎨 Nano Banana
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedCharacter?.link_id) return
                        if (!confirm(`Delete "${selectedCharacter.name}"?\n\nThis cannot be undone.`)) return
                        try {
                          await removeCharacterFromSeries(selectedCharacter.link_id)
                          await loadSeries()
                          setSelectedCharacter(null)
                          alert('✅ Character deleted')
                        } catch (err) {
                          console.error('Failed to delete character:', err)
                          alert('❌ Could not delete character')
                        }
                      }}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                <CharacterForm
                  character={selectedCharacter}
                  onChange={(updated) => setSelectedCharacter({ ...selectedCharacter, ...updated })}
                  onGenerateNanoBanana={() => setShowNanoBanana(true)}
                />

                <div className="mt-[50px] flex justify-end gap-3">
                  <button 
                    onClick={() => setSelectedCharacter(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedCharacter?.id) {
                        alert('❌ No character selected')
                        return
                      }
                      try {
                        console.log('Saving character with ID:', selectedCharacter.id)
                        await updateCharacter(selectedCharacter.id, {
                          name: selectedCharacter.name,
                          visual_appearance: selectedCharacter.visual_description,
                          age_group: selectedCharacter.age,
                          personality: selectedCharacter.personality,
                          catchphrases: selectedCharacter.catchphrases,
                          voice_style: selectedCharacter.voice_style,
                          backstory: selectedCharacter.backstory,
                          nano_banana_prompt: selectedCharacter.nano_banana_prompt,
                        })
                        await loadSeries()
                        alert('✅ Character saved!')
                      } catch (err) {
                        console.error('Failed to save character:', err)
                        alert('❌ Could not save character. ID: ' + selectedCharacter.id)
                      }
                    }}
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center py-20">
                <p className="text-white/60">
                  Select a character to edit, or add a new one
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AICharacterGenerator
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={handleAIGenerated}
        seriesDescription={series.description || ''}
      />

      {selectedCharacter && (
        <NanoBananaGenerator
          isOpen={showNanoBanana}
          onClose={() => setShowNanoBanana(false)}
          onGenerate={(prompt) => {
            setSelectedCharacter({ ...selectedCharacter, nano_banana_prompt: prompt })
          }}
          characterData={{
            name: selectedCharacter.name,
            visual_appearance: selectedCharacter.visual_description || '',
            age_group: selectedCharacter.age || '',
            personality: selectedCharacter.personality || '',
          }}
          seriesDescription={series.description || ''}
        />
      )}
    </div>
  )
}
