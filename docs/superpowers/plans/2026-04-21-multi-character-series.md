# Multi-Character Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform single-character workflow into multi-character series system with AI character generation and Nano Banana prompts.

**Architecture:** Create new Series and SeriesCharacter collections, update existing flow to use series_id instead of character_id, add AI prompts for character generation and Nano Banana image prompts.

**Tech Stack:** Next.js, PocketBase, Tailwind CSS, Claude AI, TypeScript

---

## File Structure Overview

**New Files:**
- `app/page.tsx` - Series grid (replaces characters)
- `app/series/[id]/edit/page.tsx` - Edit Series wizard
- `app/series/[id]/edit/Step1SeriesInfo.tsx` - Series info form
- `app/series/[id]/edit/Step2CharacterBuilder.tsx` - Character grid/manager
- `components/stage1/AIGeneratorModal.tsx` - AI character generator
- `components/stage1/NanoBananaPrompt.tsx` - Nano Banana prompt generator
- `lib/series.ts` - Series CRUD helpers
- `lib/series-characters.ts` - Link table helpers

**Modified Files:**
- `lib/types.ts` - Add new interfaces
- `scripts/setup-pb-schema.ts` - Add new collections
- `scripts/seed-prompts.ts` - Add AI prompts
- `app/api/ai/route.ts` - Add generate_character and generate_nano_prompt
- `app/layout.tsx` - Update navigation
- `components/sidebar/Sidebar.tsx` - Update for Series
- `lib/projects.ts` - Update to use series_id

---

## Task 1: Update Database Schema

**Files:**
- Modify: `lib/types.ts`
- Modify: `scripts/setup-pb-schema.ts`

### Step 1.1: Add new interfaces to types.ts

```typescript
// Add to lib/types.ts after Character interface

export interface Series {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  name: string
  description: string
  image_url?: string
}

export interface SeriesCharacter {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  series_id: string
  character_id: string
  character_order: number
  is_main_character: boolean
}

// Update Project interface
export interface Project {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  series_id: string  // Changed from character_id
  story_idea: string
  selected_title: string
  selected_subtitle: string
  stage_reached: number
  status: 'in_progress' | 'completed'
  expand?: { series_id?: Series }
}

// Add to Character interface
export interface Character {
  // ... existing fields ...
  nano_banana_prompt?: string
  character_type?: string
  personality_type?: string
}
```

### Step 1.2: Create kids_series collection in setup-pb-schema.ts

```typescript
// Add after kids_characters collection in scripts/setup-pb-schema.ts

// 5b. kids_series
await createOrGet(token, {
  name: 'kids_series',
  type: 'base',
  schema: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'text', required: false },
    { name: 'image_url', type: 'text', required: false },
  ],
  listRule: '',
  viewRule: '',
  createRule: '',
  updateRule: '',
  deleteRule: '',
})
```

### Step 1.3: Create kids_series_characters link table

```typescript
// Add after kids_series

// 5c. kids_series_characters (link table)
await createOrGet(token, {
  name: 'kids_series_characters',
  type: 'base',
  schema: [
    { name: 'series_id', type: 'relation', required: true, options: { collectionId: 'kids_series', cascadeDelete: true } },
    { name: 'character_id', type: 'relation', required: true, options: { collectionId: 'kids_characters', cascadeDelete: false } },
    { name: 'character_order', type: 'number', required: true, options: { min: 1, max: 8 } },
    { name: 'is_main_character', type: 'bool', required: false },
  ],
  listRule: '',
  viewRule: '',
  createRule: '',
  updateRule: '',
  deleteRule: '',
})
```

### Step 1.4: Update kids_characters with new fields

```typescript
// Add fields to existing kids_characters in setup-pb-schema.ts

// Add to schema array:
{ name: 'nano_banana_prompt', type: 'text', required: false },
{ name: 'character_type', type: 'text', required: false },
{ name: 'personality_type', type: 'text', required: false },
```

### Step 1.5: Update kids_projects to use series_id

```typescript
// In kids_projects, change character_id to series_id

{ name: 'series_id', type: 'relation', required: true, options: { collectionId: 'kids_series', cascadeDelete: true } },
// REMOVE: character_id field
```

### Step 1.6: Run setup script

```bash
cd /Users/mac/GitHubLocal/kids
npx tsx scripts/setup-pb-schema.ts
```

Expected: "Created: kids_series", "Created: kids_series_characters"

### Step 1.7: Commit

```bash
git add lib/types.ts scripts/setup-pb-schema.ts
git commit -m "database: add Series and SeriesCharacter collections"
```

---

## Task 2: Create Series CRUD Helpers

**Files:**
- Create: `lib/series.ts`
- Create: `lib/series-characters.ts`

### Step 2.1: Create lib/series.ts

```typescript
import pb from '@/lib/pocketbase'
import type { Series } from '@/lib/types'

export async function getAllSeries(): Promise<Series[]> {
  return pb.collection('kids_series').getFullList<Series>({
    sort: '-created',
    requestKey: null,
  })
}

export async function getSeries(id: string): Promise<Series> {
  return pb.collection('kids_series').getOne<Series>(id, { requestKey: null })
}

export async function createSeries(data: {
  name: string
  description?: string
  image_url?: string
}): Promise<Series> {
  return pb.collection('kids_series').create<Series>(data, { requestKey: null })
}

export async function updateSeries(
  id: string,
  data: Partial<Pick<Series, 'name' | 'description' | 'image_url'>>
): Promise<Series> {
  return pb.collection('kids_series').update<Series>(id, data, { requestKey: null })
}

export async function deleteSeries(id: string): Promise<void> {
  await pb.collection('kids_series').delete(id, { requestKey: null })
}
```

### Step 2.2: Create lib/series-characters.ts

```typescript
import pb from '@/lib/pocketbase'
import type { SeriesCharacter, Character } from '@/lib/types'

export async function getSeriesCharacters(seriesId: string): Promise<(SeriesCharacter & { expand?: { character_id?: Character } })[]> {
  return pb.collection('kids_series_characters').getFullList<SeriesCharacter>({
    filter: pb.filter('series_id = {:seriesId}', { seriesId }),
    sort: 'character_order',
    expand: 'character_id',
    requestKey: null,
  })
}

export async function addCharacterToSeries(data: {
  series_id: string
  character_id: string
  character_order: number
  is_main_character?: boolean
}): Promise<SeriesCharacter> {
  return pb.collection('kids_series_characters').create<SeriesCharacter>(data, { requestKey: null })
}

export async function updateSeriesCharacter(
  id: string,
  data: Partial<Pick<SeriesCharacter, 'character_order' | 'is_main_character'>>
): Promise<SeriesCharacter> {
  return pb.collection('kids_series_characters').update<SeriesCharacter>(id, data, { requestKey: null })
}

export async function removeCharacterFromSeries(id: string): Promise<void> {
  await pb.collection('kids_series_characters').delete(id, { requestKey: null })
}
```

### Step 2.3: Commit

```bash
git add lib/series.ts lib/series-characters.ts
git commit -m "lib: add Series and SeriesCharacter CRUD helpers"
```

---

## Task 3: Add AI Prompts

**Files:**
- Modify: `scripts/seed-prompts.ts`
- Modify: `app/api/ai/route.ts`

### Step 3.1: Add prompts to seed-prompts.ts

```typescript
// Add to PROMPTS array in scripts/seed-prompts.ts

{
  key: 'stage1_generate_character',
  system_prompt: `You are a creative character designer for kids YouTube videos (ages 4-8). Create memorable, visual characters that children will love. Characters should be distinct, have clear visual identity, and be appropriate for animation. Return valid JSON only.`,
  user_template: `Character Type: {{character_type}}
Personality: {{personality}}
Name Idea: {{name_idea}}

Create a complete character profile for a kids YouTube series:
- name: Catchy, memorable name (if name_idea provided, use or enhance it)
- title: Descriptive title (e.g., "The Brave Bunny")
- visual_description: Detailed description for image generation (appearance, colors, clothing, distinctive features)
- personality: Key personality traits that drive stories
- voice_style: How they speak (tone, cadence, verbal quirks)
- catchphrases: Array of 2-3 signature lines they say
- backstory: 1 paragraph origin story that explains who they are
- age: Character's age in the story

Return ONLY a JSON object with these exact keys.`,
  notes: 'Stage 1 - AI character generator. Returns JSON with name, title, visual_description, personality, voice_style, catchphrases, backstory, age.',
},
{
  key: 'stage1_generate_nano_prompt',
  system_prompt: `You are an AI image prompt engineer specializing in character consistency for video generation. Create detailed prompts for Nano Banana, Runway, or similar character generation tools. Focus on: clear visual identity, consistent style, neutral poses for rigging, clean backgrounds. Return plain text only.`,
  user_template: `Character Data:
Name: {{name}}
Visual Description: {{visual_description}}
Personality: {{personality}}
Age: {{age}}

Create a character generation prompt optimized for AI image generation tools like Nano Banana. Include:
1. Full visual description emphasizing distinctive features
2. Art style specification (3D render, Disney/Pixar style, highly detailed, octane render)
3. Neutral standing pose suitable for character rigging/animation
4. Clean background (studio lighting, solid light color background)
5. Consistent features that will work across multiple generations

Return ONLY the plain text prompt, no JSON, no markdown.`,
  notes: 'Stage 1 - Generate Nano Banana image prompt. Returns plain text optimized for character generation.',
},
```

### Step 3.2: Seed the new prompts

```bash
cd /Users/mac/GitHubLocal/kids
npx tsx scripts/seed-prompts.ts
```

Expected: "Created: stage1_generate_character", "Created: stage1_generate_nano_prompt"

### Step 3.3: Commit

```bash
git add scripts/seed-prompts.ts
git commit -m "prompts: add character generator and nano banana prompts"
```

---

## Task 4: Update API Route

**Files:**
- Modify: `app/api/ai/route.ts`

### Step 4.1: Add new prompt keys support

The existing `/api/ai` route already uses `buildPrompt()` which will automatically pick up the new prompts from the database. No code changes needed if the route is already generic.

Verify the route handles the new keys by checking it uses `buildPrompt(key, values)`.

### Step 4.2: Commit (if changes made)

```bash
git add app/api/ai/route.ts
git commit -m "api: verify ai route supports new character prompts"
```

---

## Task 5: Create Series Grid Page

**Files:**
- Modify: `app/page.tsx` (replaces character grid)
- Create: `components/stage1/SeriesCard.tsx`

### Step 5.1: Create SeriesCard component

```typescript
// components/stage1/SeriesCard.tsx
'use client'

import Link from 'next/link'
import type { Series, Character } from '@/lib/types'

interface SeriesCardProps {
  series?: Series & { expand?: { characters?: Character[] } }
  slotNumber: number
}

export default function SeriesCard({ series, slotNumber }: SeriesCardProps) {
  if (!series) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center min-h-[200px] opacity-50">
        <div className="text-white/30 text-lg mb-2">{slotNumber}</div>
        <div className="text-white/20 text-sm">Empty Slot</div>
      </div>
    )
  }

  const characters = series.expand?.characters || []
  const mainChars = characters.slice(0, 3)

  return (
    <div className="card p-4 flex flex-col">
      <div className="flex justify-center gap-1 mb-3">
        {mainChars.map((char, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(79, 18, 113, 0.6), rgba(233, 196, 106, 0.3))',
              border: '1px solid rgba(233, 196, 106, 0.3)',
            }}
          >
            {char.name.slice(0, 2).toUpperCase()}
          </div>
        ))}
        {characters.length > 3 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white/50 bg-white/10">
            +{characters.length - 3}
          </div>
        )}
      </div>

      <div className="heading-3 text-center text-sm mb-1">{series.name}</div>
      {series.description && (
        <div className="text-xs text-white/40 text-center line-clamp-2 mb-3">
          {series.description}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-auto">
        <Link
          href={`/series/${series.id}/edit`}
          className="btn btn-ghost btn-sm w-full justify-center"
        >
          Edit Series
        </Link>
        <Link
          href={`/series/${series.id}/projects`}
          className="btn btn-secondary btn-sm w-full justify-center"
        >
          Use →
        </Link>
      </div>
    </div>
  )
}
```

### Step 5.2: Update app/page.tsx

```typescript
// app/page.tsx
import { getAllSeries } from '@/lib/series'
import { getSeriesCharacters } from '@/lib/series-characters'
import SeriesCard from '@/components/stage1/SeriesCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const series = await getAllSeries()
  
  // Load characters for each series
  const seriesWithChars = await Promise.all(
    series.map(async (s) => {
      const chars = await getSeriesCharacters(s.id)
      return { ...s, expand: { characters: chars.map(c => c.expand?.character_id).filter(Boolean) } }
    })
  )

  // Fill remaining slots up to 10
  const slots = Array.from({ length: 10 }, (_, i) => seriesWithChars[i] || null)

  return (
    <div>
      <div className="page-header">
        <h1 className="heading-2">Series</h1>
        <Link href="/series/new" className="btn btn-primary">
          + Create Series
        </Link>
      </div>
      <div className="page-body">
        <div className="grid grid-cols-5 gap-8 max-w-5xl">
          {slots.map((series, index) => (
            <SeriesCard key={index} series={series} slotNumber={index + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Step 5.3: Commit

```bash
git add app/page.tsx components/stage1/SeriesCard.tsx
git commit -m "feat: series grid page with character preview"
```

---

## Task 6: Create Edit Series Wizard (Part 1 - Series Info)

**Files:**
- Create: `app/series/[id]/edit/page.tsx`
- Create: `app/series/[id]/edit/Step1SeriesInfo.tsx`

### Step 6.1: Create Step1SeriesInfo component

```typescript
// app/series/[id]/edit/Step1SeriesInfo.tsx
'use client'

import { useState } from 'react'
import { updateSeries } from '@/lib/series'
import type { Series } from '@/lib/types'

interface Step1Props {
  series: Series
  onNext: () => void
}

export default function Step1SeriesInfo({ series, onNext }: Step1Props) {
  const [name, setName] = useState(series.name)
  const [description, setDescription] = useState(series.description || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateSeries(series.id, { name, description })
    setSaving(false)
    onNext()
  }

  return (
    <div className="max-w-2xl">
      <h2 className="heading-3 mb-6">Step 1: Series Info</h2>
      
      <div className="card p-6 space-y-4">
        <div>
          <label className="field-label">Series Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., The Adventures of Paddington"
          />
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            className="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A serie about a bear called @Paddington - He is always looking for honey - his two friends are @Tiger and @Igor"
          />
          <p className="text-xs text-white/30 mt-1">
            Use @Name to mention characters you plan to create
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : 'Next: Characters →'}
        </button>
      </div>
    </div>
  )
}
```

### Step 6.2: Create edit page structure

```typescript
// app/series/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { getSeries } from '@/lib/series'
import EditSeriesWizard from './EditSeriesWizard'

export const dynamic = 'force-dynamic'

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const series = await getSeries(id).catch(() => notFound())

  return <EditSeriesWizard series={series} />
}
```

### Step 6.3: Create EditSeriesWizard component

```typescript
// app/series/[id]/edit/EditSeriesWizard.tsx
'use client'

import { useState } from 'react'
import Step1SeriesInfo from './Step1SeriesInfo'
import Step2CharacterBuilder from './Step2CharacterBuilder'
import type { Series } from '@/lib/types'

interface WizardProps {
  series: Series
}

export default function EditSeriesWizard({ series }: WizardProps) {
  const [step, setStep] = useState(1)

  return (
    <div className="page-body">
      <div className="mb-4 flex items-center gap-2 text-sm text-white/40">
        <span className={step === 1 ? 'text-amber-400' : ''}>1. Info</span>
        <span>→</span>
        <span className={step === 2 ? 'text-amber-400' : ''}>2. Characters</span>
      </div>

      {step === 1 && (
        <Step1SeriesInfo series={series} onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <Step2CharacterBuilder
          seriesId={series.id}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  )
}
```

### Step 6.4: Commit

```bash
git add app/series/[id]/edit/
git commit -m "feat: edit series wizard step 1 - series info"
```

---

## Task 7: Create Character Builder (Step 2)

**Files:**
- Create: `app/series/[id]/edit/Step2CharacterBuilder.tsx`
- Create: `components/stage1/AIGeneratorModal.tsx`

### Step 7.1: Create AIGeneratorModal

```typescript
// components/stage1/AIGeneratorModal.tsx
'use client'

import { useState } from 'react'
import { createCharacter, updateCharacter } from '@/lib/characters'

interface AIGeneratorModalProps {
  seriesId: string
  onClose: () => void
  onGenerated: (characterId: string) => void
}

const CHARACTER_TYPES = ['Animal', 'Human', 'Creature', 'Vehicle', 'Other']
const PERSONALITIES = ['Brave', 'Funny', 'Shy', 'Clever', 'Adventurous', 'Kind', 'Mischievous', 'Other']

export default function AIGeneratorModal({ seriesId, onClose, onGenerated }: AIGeneratorModalProps) {
  const [characterType, setCharacterType] = useState('Animal')
  const [customType, setCustomType] = useState('')
  const [personality, setPersonality] = useState('Brave')
  const [customPersonality, setCustomPersonality] = useState('')
  const [nameIdea, setNameIdea] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  async function handleGenerate() {
    setGenerating(true)
    
    const typeValue = characterType === 'Other' ? customType : characterType
    const personalityValue = personality === 'Other' ? customPersonality : personality
    
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'stage1_generate_character',
        values: {
          character_type: typeValue,
          personality: personalityValue,
          name_idea: nameIdea,
        },
      }),
    })
    
    if (res.ok) {
      const data = await res.json()
      try {
        const character = JSON.parse(data.text)
        setPreview(character)
      } catch {
        // handle error
      }
    }
    
    setGenerating(false)
  }

  async function handleUseCharacter() {
    if (!preview) return
    
    const character = await createCharacter({
      name: preview.name,
      title: preview.title,
      visual_description: preview.visual_description,
      personality: preview.personality,
      voice_style: preview.voice_style,
      catchphrases: preview.catchphrases?.join('\n'),
      backstory: preview.backstory,
      age: preview.age,
      avatar_url: '',
      character_type: characterType === 'Other' ? customType : characterType,
      personality_type: personality === 'Other' ? customPersonality : personality,
    })
    
    onGenerated(character.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="heading-3 mb-6">🤖 Generate Character with AI</h2>

        {!preview ? (
          <div className="space-y-4">
            <div>
              <label className="field-label">Character Type</label>
              <select
                className="input"
                value={characterType}
                onChange={(e) => setCharacterType(e.target.value)}
              >
                {CHARACTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {characterType === 'Other' && (
                <input
                  type="text"
                  className="input mt-2"
                  placeholder="Enter custom type..."
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="field-label">Personality</label>
              <select
                className="input"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
              >
                {PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {personality === 'Other' && (
                <input
                  type="text"
                  className="input mt-2"
                  placeholder="Enter custom personality..."
                  value={customPersonality}
                  onChange={(e) => setCustomPersonality(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="field-label">Name Idea (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., something with 'bear' or 'Benny'"
                value={nameIdea}
                onChange={(e) => setNameIdea(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary"
              >
                {generating ? 'Generating...' : '✨ Generate Character'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-4 bg-white/[0.05]">
              <h3 className="font-semibold text-lg text-amber-400 mb-1">
                {preview.name}
              </h3>
              <p className="text-sm text-white/60 mb-3">{preview.title}</p>
              
              <div className="space-y-2 text-sm">
                <p><span className="text-white/40">Visual:</span> {preview.visual_description}</p>
                <p><span className="text-white/40">Personality:</span> {preview.personality}</p>
                <p><span className="text-white/40">Voice:</span> {preview.voice_style}</p>
                <p><span className="text-white/40">Catchphrases:</span> {preview.catchphrases?.join(', ')}</p>
                <p><span className="text-white/40">Backstory:</span> {preview.backstory}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setPreview(null)} className="btn btn-ghost">
                ↻ Try Again
              </button>
              <button onClick={handleUseCharacter} className="btn btn-success">
                ✓ Use This Character
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Step 7.2: Create Step2CharacterBuilder

```typescript
// app/series/[id]/edit/Step2CharacterBuilder.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSeriesCharacters, addCharacterToSeries, removeCharacterFromSeries } from '@/lib/series-characters'
import { getCharacter } from '@/lib/characters'
import AIGeneratorModal from '@/components/stage1/AIGeneratorModal'
import type { Character, SeriesCharacter } from '@/lib/types'

interface Step2Props {
  seriesId: string
  onBack: () => void
}

export default function Step2CharacterBuilder({ seriesId, onBack }: Step2Props) {
  const [characters, setCharacters] = useState<(SeriesCharacter & { character?: Character })[]>([])
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [seriesId])

  async function loadCharacters() {
    setLoading(true)
    const chars = await getSeriesCharacters(seriesId)
    setCharacters(chars)
    setLoading(false)
  }

  async function handleAddCharacter(characterId: string) {
    const order = characters.length + 1
    const isMain = characters.length === 0 // First character is main
    
    await addCharacterToSeries({
      series_id: seriesId,
      character_id: characterId,
      character_order: order,
      is_main_character: isMain,
    })
    
    await loadCharacters()
  }

  async function handleRemove(id: string) {
    await removeCharacterFromSeries(id)
    await loadCharacters()
  }

  if (loading) return <div className="text-white/40">Loading...</div>

  const canAddMore = characters.length < 8

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-3">Step 2: Characters ({characters.length}/8)</h2>
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        {characters.map((sc) => (
          <div key={sc.id} className="card p-4 relative group">
            <button
              onClick={() => handleRemove(sc.id)}
              className="absolute top-2 right-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
            
            <div className="character-avatar w-12 h-12 mx-auto mb-2">
              {sc.expand?.character_id?.name?.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="text-center">
              <div className="font-medium text-sm truncate">
                {sc.expand?.character_id?.name}
              </div>
              {sc.is_main_character && (
                <div className="text-xs text-amber-400">Main</div>
              )}
            </div>
          </div>
        ))}

        {canAddMore && (
          <button
            onClick={() => setShowAIGenerator(true)}
            className="card p-4 flex flex-col items-center justify-center min-h-[140px] hover:border-amber-400/50 transition-colors"
          >
            <div className="text-3xl text-white/20 mb-2">+</div>
            <div className="text-sm text-white/40">Add Character</div>
          </button>
        )}
      </div>

      {characters.length > 0 && (
        <div className="flex justify-end">
          <Link
            href={`/series/${seriesId}/projects`}
            className="btn btn-primary"
          >
            Save & Continue →
          </Link>
        </div>
      )}

      {showAIGenerator && (
        <AIGeneratorModal
          seriesId={seriesId}
          onClose={() => setShowAIGenerator(false)}
          onGenerated={handleAddCharacter}
        />
      )}
    </div>
  )
}
```

### Step 7.3: Commit

```bash
git add app/series/[id]/edit/Step2CharacterBuilder.tsx components/stage1/AIGeneratorModal.tsx
git commit -m "feat: character builder with AI generator"
```

---

## Task 8: Create Nano Banana Prompt Generator

**Files:**
- Create: `app/character/[id]/nano-prompt/page.tsx`
- Create: `components/stage1/NanoBananaPrompt.tsx`

### Step 8.1: Create NanoBananaPrompt component

```typescript
// components/stage1/NanoBananaPrompt.tsx
'use client'

import { useState } from 'react'
import { updateCharacter } from '@/lib/characters'
import type { Character } from '@/lib/types'

interface NanoBananaPromptProps {
  character: Character
}

export default function NanoBananaPrompt({ character }: NanoBananaPromptProps) {
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState(character.nano_banana_prompt || '')
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'stage1_generate_nano_prompt',
        values: {
          name: character.name,
          visual_description: character.visual_description,
          personality: character.personality,
          age: character.age,
        },
      }),
    })
    
    if (res.ok) {
      const data = await res.json()
      const generatedPrompt = data.text
      setPrompt(generatedPrompt)
      
      // Save to character
      await updateCharacter(character.id, { nano_banana_prompt: generatedPrompt })
    }
    
    setGenerating(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([prompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character.name.replace(/\s+/g, '_')}_nano_prompt.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl">
      <div className="card p-6">
        <h2 className="heading-3 mb-4">🎬 Nano Banana Prompt</h2>
        
        <p className="text-sm text-white/60 mb-4">
          Generate an image generation prompt for <strong>{character.name}</strong> that you can use in Nano Banana or similar tools.
        </p>

        {!prompt ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary w-full"
          >
            {generating ? 'Generating...' : '✨ Generate Prompt'}
          </button>
        ) : (
          <>
            <div className="bg-black/30 rounded-lg p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap mb-4 border border-white/10">
              {prompt}
            </div>

            <div className="flex gap-3">
              <button onClick={handleCopy} className="btn btn-secondary">
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button onClick={handleDownload} className="btn btn-ghost">
                💾 Download .txt
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary ml-auto"
              >
                ↻ Regenerate
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 text-sm text-white/40">
        <p>💡 Tip: Use this prompt in <a href="https://nano-banana.ai" target="_blank" className="text-amber-400 hover:underline">Nano Banana</a> to generate consistent character images.</p>
      </div>
    </div>
  )
}
```

### Step 8.2: Create nano-prompt page

```typescript
// app/character/[id]/nano-prompt/page.tsx
import { notFound } from 'next/navigation'
import { getCharacter } from '@/lib/characters'
import NanoBananaPrompt from '@/components/stage1/NanoBananaPrompt'

export const dynamic = 'force-dynamic'

export default async function NanoPromptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const character = await getCharacter(id).catch(() => notFound())

  return (
    <div className="page-body">
      <NanoBananaPrompt character={character} />
    </div>
  )
}
```

### Step 8.3: Commit

```bash
git add app/character/[id]/nano-prompt/ components/stage1/NanoBananaPrompt.tsx
git commit -m "feat: nano banana prompt generator per character"
```

---

## Task 9: Update Sidebar and Navigation

**Files:**
- Modify: `components/sidebar/Sidebar.tsx`
- Modify: `app/layout.tsx`

### Step 9.1: Update Sidebar for Series flow

Already updated in design phase - verify stage labels:
1. Series
2. Story Idea
3. Titles
4. Synopsis
5. Plotboard
6. Story Page
7. Video Prompts

### Step 9.2: Commit

```bash
git add components/sidebar/Sidebar.tsx
git commit -m "nav: update sidebar for series workflow"
```

---

## Task 10: Migration & Testing

### Step 10.1: Create migration script for existing data

```bash
# Manual migration notes:
# 1. For each existing character, create a series with same name
# 2. Link character to series via kids_series_characters
# 3. Update projects to use series_id instead of character_id
```

### Step 10.2: Test the full flow

1. Create new series
2. Add 2-3 characters with AI generator
3. Generate Nano Banana prompts
4. Continue to Story Idea
5. Verify all stages work with multiple characters

### Step 10.3: Final commit

```bash
git add -A
git commit -m "feat: complete multi-character series implementation"
```

---

## Summary

This plan implements:
- ✅ Series collection with 1-8 characters
- ✅ AI character generator with custom type/personality options
- ✅ Nano Banana prompt generator per character
- ✅ Updated navigation and sidebar
- ✅ Full database schema migration

**Total Tasks:** 10
**Estimated Time:** 2-3 hours with subagent-driven development

Ready for subagent-driven implementation execution.