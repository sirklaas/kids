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
    visual_style: '',
  })
  const [characters, setCharacters] = useState<Array<Character & { link_id: string; character_order: number; is_main_character: boolean }>>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const [step, setStep] = useState(1)
  const [selectedCharacter, setSelectedCharacter] = useState<(Character & { link_id: string }) | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showNanoBanana, setShowNanoBanana] = useState(false)
  const [savingCharacter, setSavingCharacter] = useState(false)

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
        visual_style: series.visual_style,
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
        <div className="flex flex-col gap-6">
          {/* Top: Character Grid */}
          <div className="card w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-3 text-lg">Characters</h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/50">{characters.length}/8 Characters</span>
                <div className="flex gap-2">
                  <button onClick={handleAddNewCharacter} className="btn-secondary text-xs px-3 py-1">
                    + New Character
                  </button>
                  <button onClick={() => setShowAIGenerator(true)} className="btn-primary text-xs px-3 py-1">
                    🤖 AI Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-6">
                {characters.map((char) => (
                  <div
                    key={char.link_id}
                    onClick={() => setSelectedCharacter(char)}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className={`w-full aspect-square rounded-lg border-2 overflow-hidden bg-black/40 flex items-center justify-center transition-colors ${
                      selectedCharacter?.link_id === char.link_id ? 'border-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'border-white/10 group-hover:border-white/30'
                    }`}>
                      {char.avatar_url ? (
                        <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl opacity-20 group-hover:opacity-40 transition-opacity">👤</span>
                      )}
                    </div>
                    <span className={`text-xs text-center truncate w-full ${
                      selectedCharacter?.link_id === char.link_id ? 'text-gold font-medium' : 'text-white/60 group-hover:text-white'
                    }`}>
                      {char.name} {char.is_main_character && '★'}
                    </span>
                  </div>
                ))}
                
                {characters.length === 0 && (
                  <div className="col-span-5 p-12 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-4xl opacity-20 mb-3">👥</span>
                    <p className="text-base text-white/40">No characters generated yet</p>
                  </div>
                )}
            </div>
          </div>
           {/* Middle: Global Series Style */}
          <div className="card w-full">
            <h3 className="heading-3 text-lg mb-6">Global Series Style</h3>
            <label className="field-label text-gold">Global Series Style *</label>
            <textarea
              value={series.visual_style || ''}
              onChange={(e) => setSeries({ ...series, visual_style: e.target.value })}
              placeholder="e.g., 3D Pixar Animation, vibrant, soft lighting"
              className="textarea w-full h-16 mb-4 text-sm"
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50">Quick Presets:</span>
              <div className="grid grid-cols-8 gap-3">
                {[
                  { id: 'hand-drawn', color: 'from-orange-400 to-red-400', icon: '✏️', name: 'Hand-drawn 2D', prompt: 'Hand-drawn 2D animation style illustration, expressive black linework, soft watercolor shading, fluid bouncy movement implied, warm earthy colour palette, cinematic wide composition, detailed background, soft diffused lighting, playful whimsical mood' },
                  { id: 'memphis', color: 'from-pink-400 to-cyan-400', icon: '🌈', name: 'Memphis style', prompt: 'Corporate Memphis design style flat illustration animation, bold clashing neon colours like hot pink cyan yellow black, oversized abstract shapes, minimalist non-representational forms, vibrant pattern backgrounds with zigzags and squiggles, high-contrast flat shading, playful postmodern 1980s mood, symmetrical wide composition' },
                  { id: 'pixar', color: 'from-blue-400 to-emerald-400', icon: '🌟', name: 'Pixar-style 3D', prompt: 'Pixar 3D CG animation render, subsurface scattering on glossy surfaces, soft volumetric god rays, expressive and bouncy, vibrant greens and blues palette, studio-quality global illumination, adventurous curious mood, cinematic tracking shot composition' },
                  { id: 'stop-motion', color: 'from-amber-600 to-orange-700', icon: '🧱', name: 'Stop-motion clay', prompt: 'Stop-motion claymation style, visible fingerprint textures on colourful clay forms, practical desk lamp warm lighting with soft shadows, imperfect handmade sets, charming whimsical motion blur, close-up intimate framing, cozy handmade craft mood' },
                  { id: 'rubber-hose', color: 'from-gray-700 to-gray-900', icon: '🎩', name: 'Rubber hose', prompt: '1930s rubber hose cartoon style, ultra-flexible pie-slice limbs, bold thick black outlines, vintage speed lines for motion, exaggerated squash-and-stretch, lively energetic mood, classic title card composition with spot colours' },
                  { id: 'minimal-flat', color: 'from-teal-400 to-blue-500', icon: '📱', name: 'Minimal flat', prompt: 'Minimalist flat 2D vector animation, solid flat colours in a clean palette, smooth geometric shapes no gradients, subtle motion paths implied, high contrast sharp edges, professional calm mood, centered symmetrical composition, app UI style' },
                  { id: 'watercolour', color: 'from-purple-300 to-pink-300', icon: '🎨', name: 'Watercolour', prompt: 'Watercolour storybook illustration animation style, soft bleeding brush strokes and translucent layers, delicate hand-painted textures, gentle dreamy lighting, magical innocent mood, storybook double-page spread framing' },
                  { id: 'cyberpunk', color: 'from-fuchsia-600 to-purple-900', icon: '🌃', name: 'Cyberpunk neon', prompt: 'Cyberpunk neon anime hybrid animation style, sleek futuristic designs, holographic reflections on wet surfaces in cyan magenta pinks, high-contrast bloom glows, dynamic low-angle speed lines, gritty futuristic mood, wide cinematic lens flare composition' }
                ].map((preset) => {
                  return (
                    <button
                      key={preset.name}
                      onClick={() => setSeries({ ...series, visual_style: preset.prompt })}
                      className="flex flex-col items-center gap-2 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:border-gold hover:shadow-[0_0_15px_rgba(255,215,0,0.1)] text-center group relative overflow-hidden"
                      title={preset.prompt}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden relative bg-black/40 flex items-center justify-center">
                        <img 
                          src={`/presets/${preset.id}.png`} 
                          alt={preset.name} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${preset.color} flex items-center justify-center"><span class="text-3xl">${preset.icon}</span></div>`;
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-white/90 leading-tight w-full truncate">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom: Character Editor */}
          <div className="w-full">
            {selectedCharacter ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="heading-2">Edit Character</h3>
                  <div className="flex items-center gap-4">

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
                      className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 font-medium"
                    >
                      🗑️ Delete
                    </button>

                    <div className="w-px h-4 bg-white/20 mx-1"></div>

                    <button
                      type="button"
                      onClick={() => setShowNanoBanana(true)}
                      className="text-sm text-gold hover:text-gold/80 transition-colors flex items-center gap-1 font-medium"
                    >
                      🎨 Nano Banana
                    </button>

                    <div className="w-px h-4 bg-white/20 mx-1"></div>

                    <label className="text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1 font-medium">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            
                            // Optional: Show loading state (could just alert for now)
                            console.log('Uploading avatar...')
                            
                            const res = await fetch('/api/upload-avatar', {
                              method: 'POST',
                              body: formData
                            })
                            const data = await res.json()
                            
                            if (data.url) {
                              // Update local state
                              setSelectedCharacter({ ...selectedCharacter, avatar_url: data.url })
                              
                              // Persist immediately
                              if (selectedCharacter.id) {
                                await updateCharacter(selectedCharacter.id, { avatar_url: data.url })
                                loadSeries()
                              }
                            } else {
                              throw new Error(data.error || 'Upload failed')
                            }
                          } catch (err) {
                            console.error(err)
                            alert('❌ Failed to upload image')
                          }
                        }} 
                      />
                      📤 Upload Image
                    </label>
                  </div>
                </div>
                
                <CharacterForm
                  character={selectedCharacter}
                  onChange={(updated) => setSelectedCharacter({ ...selectedCharacter, ...updated })}
                  seriesStyle={series.visual_style}
                  onSeriesStyleChange={(style) => setSeries({ ...series, visual_style: style })}
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
                      setSavingCharacter(true)
                      try {
                        console.log('Saving character with ID:', selectedCharacter.id)
                        
                        // Save the Character
                        await updateCharacter(selectedCharacter.id, {
                          name: selectedCharacter.name,
                          visual_appearance: selectedCharacter.visual_description,
                          age_group: selectedCharacter.age,
                          personality: selectedCharacter.personality,
                          catchphrases: selectedCharacter.catchphrases,
                          voice_style: selectedCharacter.voice_style,
                          backstory: selectedCharacter.backstory,
                          nano_banana_prompt: selectedCharacter.nano_banana_prompt,
                          avatar_url: selectedCharacter.avatar_url,
                        })

                        // Save the global Series Visual Style if they edited it inside the Character form!
                        if (series.name) {
                          await updateSeries(id, { visual_style: series.visual_style })
                        }

                        await loadSeries()
                      } catch (err) {
                        console.error('Failed to save character:', err)
                        alert('❌ Could not save character. ID: ' + selectedCharacter.id)
                      } finally {
                        setSavingCharacter(false)
                      }
                    }}
                    disabled={savingCharacter}
                    className="btn-primary"
                  >
                    {savingCharacter ? 'Saving...' : 'Save Changes'}
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

          {/* Pipeline Navigation */}
          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="btn-secondary px-6 py-3">
              ← Back
            </button>
            <button 
              onClick={async () => {
                await handleSaveSeries()
                router.push('/')
              }}
              disabled={saving}
              className="btn-success px-10 py-3 text-lg font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              {saving ? 'Saving...' : 'Done ✓'}
            </button>
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
