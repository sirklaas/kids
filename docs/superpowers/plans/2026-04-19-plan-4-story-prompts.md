# Story Page + Video Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stage 6 (Story Page — view/edit written scenes, per-card regenerate and single-card video prompt) and Stage 7 (Video Prompts Page — edit 6 prompt fields, regenerate, stub Send to Video AI).

**Architecture:** Two new Next.js App Router routes (`/project/[id]/story/[act]` and `/project/[id]/prompts/[act]`). Each has an async server component that awaits `params`, fetches project + character + story cards (with `expand: 'plot_card_id'`), and renders a client page component. Client components follow the `cardsRef` mirror pattern for stale-closure safety, call `/api/ai` for AI operations, and persist changes via existing `updateStoryCard`. All lib functions already exist — no new lib files needed.

**Tech Stack:** Next.js 16.2.4 App Router (`params: Promise<{...}>` must be awaited), PocketBase via `getStoryCardsForAct` (already expands `plot_card_id`), Tailwind CSS v4, `/api/ai` route (`stage6_regenerate_scene`, `stage7_generate_prompts`, `stage7_regenerate_prompt`), Vitest (no new tests needed — all lib functions already tested).

---

### Task 1: StoryCard component

**Files:**
- Create: `components/stage6/StoryCard.tsx`

- [ ] **Step 1: Create StoryCard component**

```typescript
// components/stage6/StoryCard.tsx
'use client'

import type { StoryCard as StoryCardType, Act } from '@/lib/types'

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

interface StoryCardProps {
  card: StoryCardType
  onUpdate: (id: string, writtenScene: string) => void
  onRegenerate: (id: string) => void
  onGeneratePrompt: (id: string) => void
  regenerating: boolean
  generatingPrompt: boolean
}

export default function StoryCard({
  card,
  onUpdate,
  onRegenerate,
  onGeneratePrompt,
  regenerating,
  generatingPrompt,
}: StoryCardProps) {
  const plotCard = card.expand?.plot_card_id
  const label = plotCard ? clipLabel(plotCard.act, plotCard.order) : '—'
  const beat = plotCard?.scene_beat ?? ''

  return (
    <div className="story-card">
      <div className="clip-label">{label}</div>
      <div className="text-xs text-white/50 mt-1 line-clamp-2">{beat}</div>
      <textarea
        className="textarea text-xs mt-2"
        rows={5}
        value={card.written_scene}
        onChange={(e) => onUpdate(card.id, e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <button
          className="btn btn-ghost text-xs"
          onClick={() => onRegenerate(card.id)}
          disabled={regenerating || generatingPrompt}
        >
          {regenerating ? 'Regenerating…' : '↻ Regenerate Scene'}
        </button>
        <button
          className="btn btn-secondary text-xs"
          onClick={() => onGeneratePrompt(card.id)}
          disabled={regenerating || generatingPrompt}
        >
          {generatingPrompt ? 'Generating…' : '→ Video Prompt'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stage6/StoryCard.tsx
git commit -m "feat: add StoryCard component for stage 6"
```

---

### Task 2: StoryPage component + route

**Files:**
- Create: `components/stage6/StoryPage.tsx`
- Create: `app/project/[id]/story/[act]/page.tsx`

**Key behaviours:**
- `handleUpdate` fires `updateStoryCard` (fire-and-forget; mirrors state via `cardsRef`)
- `handleRegenerate` calls `/api/ai` with `stage6_regenerate_scene` → updates card's `written_scene`
- `handleGeneratePrompt` calls `/api/ai` with `stage7_regenerate_prompt` → saves 6 prompt fields on that card → navigates to prompts page
- `handleExecuteAll` calls `/api/ai` with `stage7_generate_prompts` → saves 6 prompt fields on all cards → sets `stage_reached: 7` if needed → navigates to prompts page
- Execute All button is disabled while any per-card operation is in progress

- [ ] **Step 1: Create StoryPage component**

```typescript
// components/stage6/StoryPage.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StoryCard from './StoryCard'
import { updateStoryCard } from '@/lib/story-cards'
import { updateProject } from '@/lib/projects'
import type { Character, Project, StoryCard as StoryCardType, Act } from '@/lib/types'

const ACT_ORDER: Act[] = ['beginning', 'middle', 'end']
const ACT_LABELS: Record<Act, string> = {
  beginning: 'BEGINNING',
  middle: 'MIDDLE',
  end: 'END',
}

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

function buildCharacterProfile(c: Character): string {
  return [
    c.personality && `Personality: ${c.personality}`,
    c.visual_description && `Appearance: ${c.visual_description}`,
    c.voice_style && `Voice: ${c.voice_style}`,
    c.backstory && `Backstory: ${c.backstory}`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface StoryPageProps {
  project: Project
  character: Character
  act: Act
  initialCards: StoryCardType[]
}

export default function StoryPage({ project, character, act, initialCards }: StoryPageProps) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const cardsRef = useRef(initialCards)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [generatingPromptId, setGeneratingPromptId] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actIndex = ACT_ORDER.indexOf(act)
  const backHref = `/project/${project.id}/plotboard/${act}`

  function handleUpdate(id: string, writtenScene: string) {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, written_scene: writtenScene } : c))
      cardsRef.current = next
      return next
    })
    updateStoryCard(id, { written_scene: writtenScene })
  }

  async function handleRegenerate(id: string) {
    setRegeneratingId(id)
    setError(null)
    try {
      const card = cardsRef.current.find((c) => c.id === id)
      if (!card) return
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage6_regenerate_scene',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            scene_beat: card.expand?.plot_card_id?.scene_beat ?? '',
            clip_label: clipLabel(act, card.expand?.plot_card_id?.order ?? 0),
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const writtenScene = typeof data?.text === 'string' ? data.text : ''
      await updateStoryCard(id, { written_scene: writtenScene })
      setCards((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, written_scene: writtenScene } : c))
        cardsRef.current = next
        return next
      })
    } catch {
      setError('Could not regenerate scene. Please try again.')
    } finally {
      setRegeneratingId(null)
    }
  }

  async function handleGeneratePrompt(id: string) {
    setGeneratingPromptId(id)
    setError(null)
    try {
      const card = cardsRef.current.find((c) => c.id === id)
      if (!card) return
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage7_regenerate_prompt',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            clip_label: clipLabel(act, card.expand?.plot_card_id?.order ?? 0),
            written_scene: card.written_scene,
            scene_beat: card.expand?.plot_card_id?.scene_beat ?? '',
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '{}'
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = {}
      }
      const str = (v: unknown) => (typeof v === 'string' ? v : '')
      await updateStoryCard(id, {
        environment: str(parsed.environment),
        characters: str(parsed.characters),
        voice_over: str(parsed.voice_over),
        spoken_text: str(parsed.spoken_text),
        sound_effects: str(parsed.sound_effects),
        music: str(parsed.music),
      })
      router.push(`/project/${project.id}/prompts/${act}`)
    } catch {
      setError('Could not generate video prompt. Please try again.')
    } finally {
      setGeneratingPromptId(null)
    }
  }

  async function handleExecuteAll() {
    setExecuting(true)
    setError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage7_generate_prompts',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            scenes_json: JSON.stringify(
              cardsRef.current.map((c) => ({
                clip_label: clipLabel(act, c.expand?.plot_card_id?.order ?? 0),
                written_scene: c.written_scene,
                scene_beat: c.expand?.plot_card_id?.scene_beat ?? '',
              }))
            ),
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '[]'
      let prompts: unknown[]
      try {
        prompts = JSON.parse(text)
      } catch {
        prompts = []
      }
      if (!Array.isArray(prompts)) prompts = []

      await Promise.all(
        cardsRef.current.map((card, i) => {
          const raw = prompts[i]
          const s =
            raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
          const str = (v: unknown) => (typeof v === 'string' ? v : '')
          return updateStoryCard(card.id, {
            environment: str(s.environment),
            characters: str(s.characters),
            voice_over: str(s.voice_over),
            spoken_text: str(s.spoken_text),
            sound_effects: str(s.sound_effects),
            music: str(s.music),
          })
        })
      )

      if (project.stage_reached < 7) {
        await updateProject(project.id, { stage_reached: 7 })
      }

      router.push(`/project/${project.id}/prompts/${act}`)
    } catch {
      setError('Could not generate video prompts. Please try again.')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col gap-1.5">
          <div className="label">{project.selected_title || 'Video Project'}</div>
          <div className="act-indicator">
            {ACT_ORDER.map((a, i) => {
              const isActive = a === act
              const isDone = i < actIndex
              if (!isActive && !isDone) {
                return (
                  <span key={a} className="act-indicator-locked">
                    {ACT_LABELS[a]}
                  </span>
                )
              }
              return (
                <Link
                  key={a}
                  href={`/project/${project.id}/story/${a}`}
                  className={
                    isActive
                      ? 'act-indicator-active'
                      : 'act-indicator-done hover:text-white/60 transition-colors'
                  }
                >
                  {ACT_LABELS[a]}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-3 gap-3">
          {cards.map((card) => (
            <StoryCard
              key={card.id}
              card={card}
              onUpdate={handleUpdate}
              onRegenerate={handleRegenerate}
              onGeneratePrompt={handleGeneratePrompt}
              regenerating={regeneratingId === card.id}
              generatingPrompt={generatingPromptId === card.id}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
        <Link href={backHref} className="btn btn-ghost">
          ← Back
        </Link>
        <div className="flex flex-col items-end gap-2">
          <button
            className="btn btn-primary"
            onClick={handleExecuteAll}
            disabled={executing || regeneratingId !== null || generatingPromptId !== null}
          >
            {executing ? 'Generating prompts…' : `Execute ${ACT_LABELS[act]} → Video Prompts`}
          </button>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create story route**

```typescript
// app/project/[id]/story/[act]/page.tsx
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getStoryCardsForAct } from '@/lib/story-cards'
import StoryPage from '@/components/stage6/StoryPage'
import type { Act } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_ACTS: Act[] = ['beginning', 'middle', 'end']

export default async function StoryRoute({
  params,
}: {
  params: Promise<{ id: string; act: string }>
}) {
  const { id, act: actParam } = await params
  if (!VALID_ACTS.includes(actParam as Act)) notFound()
  const act = actParam as Act

  const project = await getProject(id).catch(() => notFound())
  const [character, cards] = await Promise.all([
    getCharacter(project.character_id),
    getStoryCardsForAct(id, act),
  ])

  return (
    <StoryPage
      project={project}
      character={character}
      act={act}
      initialCards={cards}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/stage6/StoryPage.tsx app/project/[id]/story/[act]/page.tsx
git commit -m "feat: add StoryPage component and story route for stage 6"
```

---

### Task 3: VideoPromptCard component

**Files:**
- Create: `components/stage7/VideoPromptCard.tsx`

The card has three columns:
- Left: 6 editable textarea fields (environment, characters, voice_over, spoken_text, sound_effects, music)
- Centre: `written_scene` read-only text
- Right: ↻ Regenerate Prompt + ▶ Send to Video AI (stubbed) buttons

`onUpdateField` receives the field key as a `string` typed as `PromptField` to keep the callback signature compatible with the page's typed handler.

- [ ] **Step 1: Create VideoPromptCard component**

```typescript
// components/stage7/VideoPromptCard.tsx
'use client'

import type { StoryCard as StoryCardType, Act } from '@/lib/types'

export type PromptField =
  | 'environment'
  | 'characters'
  | 'voice_over'
  | 'spoken_text'
  | 'sound_effects'
  | 'music'

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

const PROMPT_FIELDS: Array<{ key: PromptField; label: string }> = [
  { key: 'environment', label: 'Environment' },
  { key: 'characters', label: 'Characters' },
  { key: 'voice_over', label: 'Voice Over' },
  { key: 'spoken_text', label: 'Spoken Text' },
  { key: 'sound_effects', label: 'Sound Effects' },
  { key: 'music', label: 'Music' },
]

interface VideoPromptCardProps {
  card: StoryCardType
  onUpdateField: (id: string, field: PromptField, value: string) => void
  onRegenerate: (id: string) => void
  onSendToVideoAI: (id: string) => void
  regenerating: boolean
  sending: boolean
}

export default function VideoPromptCard({
  card,
  onUpdateField,
  onRegenerate,
  onSendToVideoAI,
  regenerating,
  sending,
}: VideoPromptCardProps) {
  const plotCard = card.expand?.plot_card_id
  const label = plotCard ? clipLabel(plotCard.act, plotCard.order) : '—'

  return (
    <div className="video-prompt-card">
      <div className="clip-label mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          {PROMPT_FIELDS.map(({ key, label: fieldLabel }) => (
            <div key={key}>
              <label className="field-label">{fieldLabel}</label>
              <textarea
                className="textarea text-xs"
                rows={2}
                value={card[key] ?? ''}
                onChange={(e) => onUpdateField(card.id, key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <label className="field-label">Written Scene</label>
          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
            {card.written_scene}
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-5">
          <button
            className="btn btn-ghost text-xs"
            onClick={() => onRegenerate(card.id)}
            disabled={regenerating || sending}
          >
            {regenerating ? 'Regenerating…' : '↻ Regenerate Prompt'}
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => onSendToVideoAI(card.id)}
            disabled={regenerating || sending}
          >
            {sending ? 'Sending…' : '▶ Send to Video AI'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stage7/VideoPromptCard.tsx
git commit -m "feat: add VideoPromptCard component for stage 7"
```

---

### Task 4: VideoPromptPage component + route

**Files:**
- Create: `components/stage7/VideoPromptPage.tsx`
- Create: `app/project/[id]/prompts/[act]/page.tsx`

**Key behaviours:**
- `handleUpdateField` fires `updateStoryCard` (fire-and-forget) with the single changed field
- `handleRegenerate` calls `/api/ai` with `stage7_regenerate_prompt` → saves all 6 prompt fields on that card
- `handleSendToVideoAI` and `handleSendAll` are stubbed (Video AI integration not yet implemented)
- Uses `cardsRef` mirror pattern for stale-closure safety in async handlers
- Cards rendered as a vertical list (each card is full-width; 3-column layout is internal to VideoPromptCard)

- [ ] **Step 1: Create VideoPromptPage component**

```typescript
// components/stage7/VideoPromptPage.tsx
'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import VideoPromptCard, { type PromptField } from './VideoPromptCard'
import { updateStoryCard } from '@/lib/story-cards'
import type { Character, Project, StoryCard as StoryCardType, Act } from '@/lib/types'

const ACT_ORDER: Act[] = ['beginning', 'middle', 'end']
const ACT_LABELS: Record<Act, string> = {
  beginning: 'BEGINNING',
  middle: 'MIDDLE',
  end: 'END',
}

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

function buildCharacterProfile(c: Character): string {
  return [
    c.personality && `Personality: ${c.personality}`,
    c.visual_description && `Appearance: ${c.visual_description}`,
    c.voice_style && `Voice: ${c.voice_style}`,
    c.backstory && `Backstory: ${c.backstory}`,
  ]
    .filter(Boolean)
    .join('\n')
}

interface VideoPromptPageProps {
  project: Project
  character: Character
  act: Act
  initialCards: StoryCardType[]
}

export default function VideoPromptPage({
  project,
  character,
  act,
  initialCards,
}: VideoPromptPageProps) {
  const [cards, setCards] = useState(initialCards)
  const cardsRef = useRef(initialCards)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actIndex = ACT_ORDER.indexOf(act)
  const backHref = `/project/${project.id}/story/${act}`

  function handleUpdateField(id: string, field: PromptField, value: string) {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      cardsRef.current = next
      return next
    })
    updateStoryCard(id, { [field]: value })
  }

  async function handleRegenerate(id: string) {
    setRegeneratingId(id)
    setError(null)
    try {
      const card = cardsRef.current.find((c) => c.id === id)
      if (!card) return
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage7_regenerate_prompt',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            clip_label: clipLabel(act, card.expand?.plot_card_id?.order ?? 0),
            written_scene: card.written_scene,
            scene_beat: card.expand?.plot_card_id?.scene_beat ?? '',
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '{}'
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = {}
      }
      const str = (v: unknown) => (typeof v === 'string' ? v : '')
      const updated = {
        environment: str(parsed.environment),
        characters: str(parsed.characters),
        voice_over: str(parsed.voice_over),
        spoken_text: str(parsed.spoken_text),
        sound_effects: str(parsed.sound_effects),
        music: str(parsed.music),
      }
      await updateStoryCard(id, updated)
      setCards((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        cardsRef.current = next
        return next
      })
    } catch {
      setError('Could not regenerate prompt. Please try again.')
    } finally {
      setRegeneratingId(null)
    }
  }

  function handleSendToVideoAI(_id: string) {
    // Stubbed — Video AI integration not yet implemented
  }

  function handleSendAll() {
    // Stubbed — Video AI integration not yet implemented
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex flex-col gap-1.5">
          <div className="label">{project.selected_title || 'Video Project'}</div>
          <div className="act-indicator">
            {ACT_ORDER.map((a, i) => {
              const isActive = a === act
              const isDone = i < actIndex
              if (!isActive && !isDone) {
                return (
                  <span key={a} className="act-indicator-locked">
                    {ACT_LABELS[a]}
                  </span>
                )
              }
              return (
                <Link
                  key={a}
                  href={`/project/${project.id}/prompts/${a}`}
                  className={
                    isActive
                      ? 'act-indicator-active'
                      : 'act-indicator-done hover:text-white/60 transition-colors'
                  }
                >
                  {ACT_LABELS[a]}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <VideoPromptCard
              key={card.id}
              card={card}
              onUpdateField={handleUpdateField}
              onRegenerate={handleRegenerate}
              onSendToVideoAI={handleSendToVideoAI}
              regenerating={regeneratingId === card.id}
              sending={sendingId === card.id}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/20">
        <Link href={backHref} className="btn btn-ghost">
          ← Back
        </Link>
        <div className="flex flex-col items-end gap-2">
          <button
            className="btn btn-primary"
            onClick={handleSendAll}
            disabled={regeneratingId !== null || sendingId !== null}
          >
            ▶ Send All to Video AI
          </button>
          {error && <div className="text-xs text-red-400">{error}</div>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create prompts route**

```typescript
// app/project/[id]/prompts/[act]/page.tsx
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getStoryCardsForAct } from '@/lib/story-cards'
import VideoPromptPage from '@/components/stage7/VideoPromptPage'
import type { Act } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_ACTS: Act[] = ['beginning', 'middle', 'end']

export default async function PromptsRoute({
  params,
}: {
  params: Promise<{ id: string; act: string }>
}) {
  const { id, act: actParam } = await params
  if (!VALID_ACTS.includes(actParam as Act)) notFound()
  const act = actParam as Act

  const project = await getProject(id).catch(() => notFound())
  const [character, cards] = await Promise.all([
    getCharacter(project.character_id),
    getStoryCardsForAct(id, act),
  ])

  return (
    <VideoPromptPage
      project={project}
      character={character}
      act={act}
      initialCards={cards}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/stage7/VideoPromptPage.tsx app/project/[id]/prompts/[act]/page.tsx
git commit -m "feat: add VideoPromptPage component and prompts route for stage 7"
```
