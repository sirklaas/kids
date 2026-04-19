# Kids Dashboard — Plan 3: Plotboard (Stage 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Stage 5 Plotboard — three paginated act routes (`/plotboard/beginning|middle|end`) each showing an editable grid of plot cards with drag-to-reorder, and an Execute button that generates written scenes (story cards) via AI and navigates to the Story Page.

**Architecture:** Each act is a separate server-rendered route that fetches its 9 or 12 plot cards and renders a `PlotBoard` client component. `PlotBoard` owns all interactive state: card editing, drag reorder, and the execute flow. The execute flow calls `/api/ai` with `stage6_write_scenes`, creates `kids_story_cards` records for each card in the act, then navigates to `/project/[id]/story/[act]`. A new `lib/story-cards.ts` module handles all story card CRUD. `lib/plot-cards.ts` gains `updatePlotCard` for saving edits.

**Tech Stack:** Next.js 16.2.4 (App Router), TypeScript, Tailwind CSS v4, PocketBase 0.26.8, Anthropic via `/api/ai` route, Vitest

---

## Critical Notes for Implementers

1. **Next.js 16.2.4 — `params` is a Promise.** Always `await` it:
   ```typescript
   export default async function Page({ params }: { params: Promise<{ id: string; act: string }> }) {
     const { id, act } = await params
   ```

2. **Tailwind v4 — `@apply` cannot chain custom component classes.** When adding new CSS, inline all utility classes directly. Do not `@apply` classes defined in `@layer components`.

3. **PocketBase filter injection prevention.** Always use `pb.filter('field = {:id}', { id })` — never string interpolation.

4. **Drag-and-drop uses HTML5 drag API.** No external library needed. The `draggable` attribute on the card div plus `onDragStart`, `onDragOver`, `onDrop` event handlers is all that's required.

5. **`handleDrop` reads `cards` from the latest render closure.** Since `drop` fires as a separate browser event after all `dragover` events, React will have committed the latest state. No ref synchronization needed.

---

## Existing Code Reference

All files below exist and must not be recreated:

- `lib/pocketbase.ts` — default export `pb`
- `lib/types.ts` — exports `Character`, `Project`, `PlotCard`, `StoryCard`, `Act`, `ACT_CLIP_COUNTS`, `ACT_GRID`
- `lib/characters.ts` — `getCharacter(id)`
- `lib/projects.ts` — `getProject(id)`, `updateProject(id, data)`
- `lib/plot-cards.ts` — `getPlotCardsForProject(id)`, `createPlotCardsForProject(id, beats)` — **modify to add `updatePlotCard`**
- `app/api/ai/route.ts` — `POST /api/ai` accepts `{ key, values }`, returns `{ text }`
- `app/globals.css` — CSS classes including: `.page-header`, `.page-body`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.label`, `.field-label`, `.clip-label`, `.act-indicator`, `.act-indicator-active`, `.act-indicator-done`, `.act-indicator-locked`, `.plot-card`, `.plot-card-drag-handle`, `.input`, `.textarea`

---

## File Map

```
lib/
  plot-cards.ts                          MODIFY: add updatePlotCard
  story-cards.ts                         CREATE: CRUD for kids_story_cards

__tests__/lib/
  plot-cards.test.ts                     MODIFY: add updatePlotCard test
  story-cards.test.ts                    CREATE

components/stage5/
  PlotCard.tsx                           CREATE: single editable plot card
  PlotBoard.tsx                          CREATE: grid + act nav + drag + execute

app/project/[id]/plotboard/[act]/
  page.tsx                               CREATE: server route
```

---

## Task 1: Data helpers — updatePlotCard + story-cards CRUD

**Files:**
- Modify: `lib/plot-cards.ts`
- Modify: `__tests__/lib/plot-cards.test.ts`
- Create: `lib/story-cards.ts`
- Create: `__tests__/lib/story-cards.test.ts`

- [ ] **Step 1: Add `updatePlotCard` to `lib/plot-cards.ts`**

Append after the existing `createPlotCardsForProject` function:

```typescript
export async function updatePlotCard(
  id: string,
  data: Partial<Pick<PlotCard, 'scene_beat' | 'duration_sec' | 'order'>>
): Promise<PlotCard> {
  return pb.collection('kids_plot_cards').update<PlotCard>(id, data)
}
```

The full file after modification:

```typescript
import pb from '@/lib/pocketbase'
import type { PlotCard, Act } from '@/lib/types'
import { ACT_CLIP_COUNTS } from '@/lib/types'

export async function getPlotCardsForProject(projectId: string): Promise<PlotCard[]> {
  return pb.collection('kids_plot_cards').getFullList<PlotCard>({
    filter: pb.filter('project_id = {:id}', { id: projectId }),
    sort: 'act,order',
  })
}

export async function createPlotCardsForProject(
  projectId: string,
  beats: { beginning: string[]; middle: string[]; end: string[] }
): Promise<PlotCard[]> {
  const acts: Array<{ act: Act; list: string[] }> = [
    { act: 'beginning', list: beats.beginning },
    { act: 'middle', list: beats.middle },
    { act: 'end', list: beats.end },
  ]

  for (const { act, list } of acts) {
    if (list.length !== ACT_CLIP_COUNTS[act]) {
      throw new Error(
        `Expected ${ACT_CLIP_COUNTS[act]} beats for act "${act}", got ${list.length}`
      )
    }
  }

  const allCards: PlotCard[] = []
  for (const { act, list } of acts) {
    const cards = await Promise.all(
      list.map((beat, i) =>
        pb.collection('kids_plot_cards').create<PlotCard>({
          project_id: projectId,
          act,
          order: i + 1,
          scene_beat: beat,
          duration_sec: 15,
        })
      )
    )
    allCards.push(...cards)
  }
  return allCards
}

export async function updatePlotCard(
  id: string,
  data: Partial<Pick<PlotCard, 'scene_beat' | 'duration_sec' | 'order'>>
): Promise<PlotCard> {
  return pb.collection('kids_plot_cards').update<PlotCard>(id, data)
}
```

- [ ] **Step 2: Add `updatePlotCard` test to `__tests__/lib/plot-cards.test.ts`**

The existing mock in this file only mocks `create` and `getFullList` on the collection. Add `update` to the mock. Modify `beforeEach` so `mockCollection.mockReturnValue` also includes `update`, then add the test.

Find this section in the file:
```typescript
  mockCollection.mockReturnValue({
    create: mockCreate,
    getFullList: mockGetFullList,
  } as any)
```

Replace with:
```typescript
  mockUpdate = vi.fn().mockImplementation((id: string, data: any) =>
    Promise.resolve({ id, ...data })
  )
  mockCollection.mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
    getFullList: mockGetFullList,
  } as any)
```

Also add `let mockUpdate: ReturnType<typeof vi.fn>` alongside the other mock declarations at the top of the file.

Also update the import line to include `updatePlotCard`:
```typescript
import { createPlotCardsForProject, getPlotCardsForProject, updatePlotCard } from '@/lib/plot-cards'
```

Then add this test at the end of the file:

```typescript
describe('updatePlotCard', () => {
  it('updates scene_beat and duration_sec', async () => {
    const result = await updatePlotCard('card1', { scene_beat: 'new beat', duration_sec: 20 })
    expect(mockUpdate).toHaveBeenCalledWith('card1', { scene_beat: 'new beat', duration_sec: 20 })
    expect(result.scene_beat).toBe('new beat')
    expect(result.duration_sec).toBe(20)
  })

  it('updates order only', async () => {
    await updatePlotCard('card1', { order: 3 })
    expect(mockUpdate).toHaveBeenCalledWith('card1', { order: 3 })
  })
})
```

- [ ] **Step 3: Run existing + new plot-cards tests — expect pass**

```bash
PATH="/opt/homebrew/bin:$PATH" npm run test:run -- __tests__/lib/plot-cards.test.ts
```

Expected: all tests PASS (original 4 + new 2 = 6 total)

- [ ] **Step 4: Create `lib/story-cards.ts`**

```typescript
import pb from '@/lib/pocketbase'
import type { StoryCard, Act } from '@/lib/types'

export async function createStoryCard(data: {
  plot_card_id: string
  project_id: string
  written_scene: string
  environment: string
  characters: string
  voice_over: string
  spoken_text: string
  sound_effects: string
  music: string
}): Promise<StoryCard> {
  return pb.collection('kids_story_cards').create<StoryCard>(data)
}

export async function getStoryCardsForAct(projectId: string, act: Act): Promise<StoryCard[]> {
  const all = await pb.collection('kids_story_cards').getFullList<StoryCard>({
    filter: pb.filter('project_id = {:id}', { id: projectId }),
    expand: 'plot_card_id',
  })
  return all
    .filter((sc) => sc.expand?.plot_card_id?.act === act)
    .sort((a, b) => (a.expand?.plot_card_id?.order ?? 0) - (b.expand?.plot_card_id?.order ?? 0))
}

export async function deleteStoryCardsForAct(projectId: string, act: Act): Promise<void> {
  const cards = await getStoryCardsForAct(projectId, act)
  await Promise.all(cards.map((sc) => pb.collection('kids_story_cards').delete(sc.id)))
}

export async function updateStoryCard(
  id: string,
  data: Partial<Pick<StoryCard, 'written_scene' | 'environment' | 'characters' | 'voice_over' | 'spoken_text' | 'sound_effects' | 'music'>>
): Promise<StoryCard> {
  return pb.collection('kids_story_cards').update<StoryCard>(id, data)
}
```

- [ ] **Step 5: Write failing tests — create `__tests__/lib/story-cards.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockGetFullList = vi.fn()

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      getFullList: mockGetFullList,
    }),
    filter: vi.fn((q: string, params?: Record<string, string>) =>
      params?.id ? q.replace('{:id}', params.id) : q
    ),
  },
}))

import { createStoryCard, getStoryCardsForAct, deleteStoryCardsForAct, updateStoryCard } from '@/lib/story-cards'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createStoryCard', () => {
  it('creates a story card with all fields', async () => {
    const data = {
      plot_card_id: 'plot1',
      project_id: 'proj1',
      written_scene: 'The character walks in.',
      environment: 'Indoor classroom',
      characters: 'WackyWilliam',
      voice_over: 'Hello everyone!',
      spoken_text: '',
      sound_effects: 'footsteps',
      music: 'upbeat',
    }
    mockCreate.mockResolvedValue({ id: 'sc1', ...data })
    const result = await createStoryCard(data)
    expect(mockCreate).toHaveBeenCalledWith(data)
    expect(result.id).toBe('sc1')
    expect(result.written_scene).toBe('The character walks in.')
  })
})

describe('getStoryCardsForAct', () => {
  it('returns only story cards matching the act', async () => {
    mockGetFullList.mockResolvedValue([
      {
        id: 'sc1',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'beginning', order: 1 } },
      },
      {
        id: 'sc2',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'middle', order: 1 } },
      },
    ])
    const result = await getStoryCardsForAct('proj1', 'beginning')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('sc1')
  })

  it('sorts by plot card order ascending', async () => {
    mockGetFullList.mockResolvedValue([
      {
        id: 'sc2',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'beginning', order: 2 } },
      },
      {
        id: 'sc1',
        project_id: 'proj1',
        expand: { plot_card_id: { act: 'beginning', order: 1 } },
      },
    ])
    const result = await getStoryCardsForAct('proj1', 'beginning')
    expect(result[0].id).toBe('sc1')
    expect(result[1].id).toBe('sc2')
  })

  it('uses pb.filter for project_id', async () => {
    mockGetFullList.mockResolvedValue([])
    await getStoryCardsForAct('proj1', 'beginning')
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining('proj1'),
        expand: 'plot_card_id',
      })
    )
  })
})

describe('deleteStoryCardsForAct', () => {
  it('deletes all story cards for the given act', async () => {
    mockGetFullList.mockResolvedValue([
      { id: 'sc1', project_id: 'proj1', expand: { plot_card_id: { act: 'beginning', order: 1 } } },
      { id: 'sc2', project_id: 'proj1', expand: { plot_card_id: { act: 'beginning', order: 2 } } },
    ])
    await deleteStoryCardsForAct('proj1', 'beginning')
    expect(mockDelete).toHaveBeenCalledTimes(2)
    expect(mockDelete).toHaveBeenCalledWith('sc1')
    expect(mockDelete).toHaveBeenCalledWith('sc2')
  })

  it('does nothing if no story cards exist for the act', async () => {
    mockGetFullList.mockResolvedValue([])
    await deleteStoryCardsForAct('proj1', 'end')
    expect(mockDelete).not.toHaveBeenCalled()
  })
})

describe('updateStoryCard', () => {
  it('updates written_scene', async () => {
    mockUpdate.mockResolvedValue({ id: 'sc1', written_scene: 'Updated scene.' })
    const result = await updateStoryCard('sc1', { written_scene: 'Updated scene.' })
    expect(mockUpdate).toHaveBeenCalledWith('sc1', { written_scene: 'Updated scene.' })
    expect(result.written_scene).toBe('Updated scene.')
  })
})
```

- [ ] **Step 6: Run — expect failure**

```bash
PATH="/opt/homebrew/bin:$PATH" npm run test:run -- __tests__/lib/story-cards.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/story-cards'`

- [ ] **Step 7: Run again after `lib/story-cards.ts` exists — expect pass**

```bash
PATH="/opt/homebrew/bin:$PATH" npm run test:run -- __tests__/lib/story-cards.test.ts __tests__/lib/plot-cards.test.ts
```

Expected: all tests PASS

- [ ] **Step 8: Commit**

```bash
git add lib/plot-cards.ts lib/story-cards.ts __tests__/lib/plot-cards.test.ts __tests__/lib/story-cards.test.ts
git commit -m "feat: add updatePlotCard and story-card CRUD helpers"
```

---

## Task 2: PlotCard component

**Files:**
- Create: `components/stage5/PlotCard.tsx`

- [ ] **Step 1: Create `components/stage5/PlotCard.tsx`**

```typescript
'use client'

import type { PlotCard as PlotCardType, Act } from '@/lib/types'

interface PlotCardProps {
  card: PlotCardType
  index: number
  act: Act
  onUpdate: (id: string, sceneBeat: string, durationSec: number) => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: () => void
}

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

export default function PlotCard({
  card,
  index,
  act,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
}: PlotCardProps) {
  return (
    <div
      className="plot-card"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
    >
      <div className="flex items-center justify-between">
        <span className="clip-label">{clipLabel(act, card.order)}</span>
        <span className="plot-card-drag-handle" title="Drag to reorder">⠿</span>
      </div>
      <textarea
        className="textarea text-xs"
        rows={3}
        value={card.scene_beat}
        onChange={(e) => onUpdate(card.id, e.target.value, card.duration_sec)}
      />
      <div className="flex items-center gap-2">
        <span className="field-label shrink-0 mb-0">Duration (s)</span>
        <input
          className="input text-xs"
          style={{ width: '4rem' }}
          type="number"
          min={1}
          max={60}
          value={card.duration_sec}
          onChange={(e) => onUpdate(card.id, card.scene_beat, Number(e.target.value))}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
PATH="/opt/homebrew/bin:$PATH" npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/stage5/PlotCard.tsx
git commit -m "feat: PlotCard component (Stage 5)"
```

---

## Task 3: PlotBoard component

**Files:**
- Create: `components/stage5/PlotBoard.tsx`

- [ ] **Step 1: Create `components/stage5/PlotBoard.tsx`**

```typescript
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PlotCard from './PlotCard'
import { updatePlotCard } from '@/lib/plot-cards'
import { updateProject } from '@/lib/projects'
import { createStoryCard, deleteStoryCardsForAct } from '@/lib/story-cards'
import type { Character, Project, PlotCard as PlotCardType, Act } from '@/lib/types'

const ACT_ORDER: Act[] = ['beginning', 'middle', 'end']
const ACT_LABELS: Record<Act, string> = {
  beginning: 'BEGINNING',
  middle: 'MIDDLE',
  end: 'END',
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

interface PlotBoardProps {
  project: Project
  character: Character
  act: Act
  initialCards: PlotCardType[]
}

export default function PlotBoard({ project, character, act, initialCards }: PlotBoardProps) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const [executing, setExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<string | null>(null)
  const dragIndexRef = useRef<number | null>(null)

  const actIndex = ACT_ORDER.indexOf(act)
  const prevAct = actIndex > 0 ? ACT_ORDER[actIndex - 1] : null
  const backHref = prevAct
    ? `/project/${project.id}/plotboard/${prevAct}`
    : `/project/${project.id}`

  function handleUpdate(id: string, sceneBeat: string, durationSec: number) {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, scene_beat: sceneBeat, duration_sec: durationSec } : c))
    )
    updatePlotCard(id, { scene_beat: sceneBeat, duration_sec: durationSec })
  }

  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragOver(index: number) {
    if (dragIndexRef.current === null || dragIndexRef.current === index) return
    const fromIndex = dragIndexRef.current
    dragIndexRef.current = index
    setCards((prev) => {
      const next = [...prev]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(index, 0, removed)
      return next
    })
  }

  async function handleDrop() {
    if (dragIndexRef.current === null) return
    dragIndexRef.current = null
    await Promise.all(
      cards.map((card, i) => updatePlotCard(card.id, { order: i + 1 }))
    )
  }

  async function handleExecute() {
    setExecuting(true)
    setExecuteError(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage6_write_scenes',
          values: {
            character_name: character.name,
            character_profile: buildCharacterProfile(character),
            act,
            scene_beats_json: JSON.stringify(cards.map((c) => c.scene_beat)),
          },
        }),
      })
      if (!res.ok) throw new Error(res.statusText)
      const data = await res.json()
      const text = typeof data?.text === 'string' ? data.text : '[]'
      let scenes: unknown[]
      try {
        scenes = JSON.parse(text)
      } catch {
        scenes = []
      }
      if (!Array.isArray(scenes)) scenes = []

      await deleteStoryCardsForAct(project.id, act)

      await Promise.all(
        cards.map((card, i) => {
          const raw = scenes[i]
          const s =
            raw !== null && typeof raw === 'object'
              ? (raw as Record<string, unknown>)
              : {}
          const str = (v: unknown) => (typeof v === 'string' ? v : '')
          return createStoryCard({
            plot_card_id: card.id,
            project_id: project.id,
            written_scene: str(s.written_scene),
            environment: str(s.environment),
            characters: str(s.characters),
            voice_over: str(s.voice_over),
            spoken_text: str(s.spoken_text),
            sound_effects: str(s.sound_effects),
            music: str(s.music),
          })
        })
      )

      if (project.stage_reached < 6) {
        await updateProject(project.id, { stage_reached: 6 })
      }

      router.push(`/project/${project.id}/story/${act}`)
    } catch {
      setExecuteError('Could not generate scenes. Please try again.')
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
              return (
                <Link
                  key={a}
                  href={`/project/${project.id}/plotboard/${a}`}
                  className={
                    isActive
                      ? 'act-indicator-active'
                      : isDone
                      ? 'act-indicator-done hover:text-white/60 transition-colors'
                      : 'act-indicator-locked'
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
          {cards.map((card, index) => (
            <PlotCard
              key={card.id}
              card={card}
              index={index}
              act={act}
              onUpdate={handleUpdate}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
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
            onClick={handleExecute}
            disabled={executing}
          >
            {executing
              ? 'Generating scenes…'
              : `Execute ${ACT_LABELS[act]} → Story Page`}
          </button>
          {executeError && (
            <div className="text-xs text-red-400">{executeError}</div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
PATH="/opt/homebrew/bin:$PATH" npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/stage5/PlotBoard.tsx
git commit -m "feat: PlotBoard component with drag-reorder and execute (Stage 5)"
```

---

## Task 4: Plotboard route

**Files:**
- Create: `app/project/[id]/plotboard/[act]/page.tsx`

- [ ] **Step 1: Create `app/project/[id]/plotboard/[act]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getPlotCardsForProject } from '@/lib/plot-cards'
import PlotBoard from '@/components/stage5/PlotBoard'
import type { Act } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_ACTS: Act[] = ['beginning', 'middle', 'end']

export default async function PlotboardRoute({
  params,
}: {
  params: Promise<{ id: string; act: string }>
}) {
  const { id, act: actParam } = await params
  if (!VALID_ACTS.includes(actParam as Act)) notFound()
  const act = actParam as Act

  const project = await getProject(id)
  const [character, allCards] = await Promise.all([
    getCharacter(project.character_id),
    getPlotCardsForProject(id),
  ])

  const cards = allCards
    .filter((c) => c.act === act)
    .sort((a, b) => a.order - b.order)

  return (
    <PlotBoard
      project={project}
      character={character}
      act={act}
      initialCards={cards}
    />
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
PATH="/opt/homebrew/bin:$PATH" npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
PATH="/opt/homebrew/bin:$PATH" npm run test:run 2>&1 | tail -10
```

Expected: all tests PASS (28 original + 6 new = 34 total)

- [ ] **Step 4: Commit**

```bash
git add app/project/[id]/plotboard/[act]/page.tsx
git commit -m "feat: plotboard route (Stage 5)"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ 3 act routes (`/plotboard/beginning|middle|end`) — handled by `[act]` dynamic segment
- ✅ 3×3 grid for beginning/end, 3×4 for middle — CSS `grid-cols-3` auto-flows (9 cards = 3×3, 12 = 3×4)
- ✅ Clip labels (`Begin_01`, `Middle_07`, `End_03`) — `clipLabel` helper
- ✅ Editable scene beat (textarea) and duration (number input) per card
- ✅ Drag handle for reorder — HTML5 drag API with visual `⠿` handle
- ✅ Act indicator in header — `BEGINNING · MIDDLE · END` with active highlighted
- ✅ Back button — navigates to previous act or project page
- ✅ Execute button — calls `/api/ai` with `stage6_write_scenes`, creates story cards, navigates to story page
- ✅ `stage_reached` advanced to 6 on first execute
- ✅ Existing story cards deleted before regenerating (idempotent execute)
- ✅ `notFound()` for invalid act params

**Type consistency:** `PlotCard` imported as `PlotCardType` alias to avoid conflict with the component name. `Act` used consistently. `StoryCard` fields match `lib/types.ts` definition exactly.
