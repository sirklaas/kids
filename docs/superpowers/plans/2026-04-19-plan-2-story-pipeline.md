# Kids Dashboard — Plan 2: Story Pipeline (Stages 1b–4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the project list (Stage 1b) and the Stages 2–4 pipeline — Story Idea, AI-generated Titles, and AI-generated Synopses — culminating in generating all 30 plot cards and navigating to the Plotboard.

**Architecture:** A single `/project/[id]` server-rendered page hydrates a `ProjectPage` client component that manages progressive reveal state for Stages 2–4. AI calls go through a `/api/ai` server-side route (keeps `ANTHROPIC_API_KEY` off the client). PocketBase is called directly from client components for data mutations. The sidebar self-fetches project data from the URL, so it always reflects the current project context without prop drilling.

**Tech Stack:** Next.js 16.2.4 (App Router), TypeScript, Tailwind CSS v4, PocketBase 0.26.8, Anthropic SDK 0.90.0, Vitest + React Testing Library

---

## Critical Notes for Implementers

1. **Next.js 16.2.4 — `params` is a Promise.** Always `await` it:
   ```typescript
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params
   ```

2. **Tailwind v4 — `@apply` cannot chain custom component classes.** `.btn-primary { @apply btn ... }` breaks because `btn` is a component class, not a Tailwind utility. When adding new CSS to `globals.css`, inline all utility classes directly. Do not `@apply` classes defined in `@layer components`.

3. **PocketBase SDK works client-side.** `import pb from '@/lib/pocketbase'` works in both server and client components — the SDK connects to `https://pinkmilk.pockethost.io` which is publicly accessible.

4. **Anthropic API key is server-only.** Client components must call `POST /api/ai` instead of using the SDK directly.

5. **`ANTHROPIC_API_KEY` must be set in `.env.local`.** If it still contains the placeholder `sk-ant-placeholder`, the user must replace it with their real key before AI calls work.

---

## Existing Code Reference

All files below exist and must not be recreated:

- `lib/pocketbase.ts` — default export `pb` (PocketBase singleton)
- `lib/types.ts` — exports `Character`, `Project`, `Synopsis`, `PlotCard`, `StoryCard`, `Act`, `ACT_CLIP_COUNTS`, `ACT_GRID`
- `lib/characters.ts` — `getAllCharacters()`, `getCharacter(id)`, `updateCharacter(id, data)`
- `lib/prompts.ts` — `getPrompt(key)`, `fillTemplate(template, values)`, `buildPrompt(key, values)`
- `app/globals.css` — all named CSS classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm`, `.card`, `.card-header`, `.card-body`, `.card-footer`, `.sidebar-*`, `.input`, `.textarea`, `.heading-*`, `.label`, `.field-label`, `.page-header`, `.page-body`, `.stage-locked-banner`
- `components/sidebar/Sidebar.tsx` — client component, takes optional `projectId?` and `stageReached?` props

---

## File Map

```
app/
  character/[id]/projects/page.tsx      Stage 1b: project list (server component)
  project/[id]/page.tsx                 Stages 2–4 combined (server component)
  api/ai/route.ts                       POST: call Claude with a prompt key

components/
  stage1b/
    ProjectList.tsx                     Project list: resume or new video
  project/
    ProjectPage.tsx                     Client wrapper: manages Stages 2–4 state
  stage2/
    StoryIdeaSection.tsx                Story idea textarea + AI regenerate
  stage3/
    TitleCard.tsx                       Single editable title card
    TitlesSection.tsx                   5 title cards wrapper
  stage4/
    SynopsisCard.tsx                    Single editable synopsis card
    SynopsisSection.tsx                 5 synopsis cards wrapper

lib/
  projects.ts                           CRUD for kids_projects
  synopses.ts                           CRUD for kids_synopses
  plot-cards.ts                         Create kids_plot_cards (used at end of Stage 4)
```

---

## Task 1: Project helpers

**Files:**
- Create: `lib/projects.ts`
- Create: `__tests__/lib/projects.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/projects.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockGetOne = vi.fn()
const mockGetFullList = vi.fn()

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      create: mockCreate,
      update: mockUpdate,
      getOne: mockGetOne,
      getFullList: mockGetFullList,
    }),
  },
}))

import { createProject, getProject, updateProject, getProjectsForCharacter } from '@/lib/projects'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({ id: 'proj1', character_id: 'char1', stage_reached: 2, status: 'in_progress', story_idea: '', selected_title: '', selected_subtitle: '' })
  mockUpdate.mockResolvedValue({ id: 'proj1', stage_reached: 3 })
  mockGetOne.mockResolvedValue({ id: 'proj1', stage_reached: 2, story_idea: 'A fun adventure', character_id: 'char1' })
  mockGetFullList.mockResolvedValue([
    { id: 'proj1', stage_reached: 2, status: 'in_progress' },
    { id: 'proj2', stage_reached: 5, status: 'completed' },
  ])
})

describe('createProject', () => {
  it('creates a project with stage_reached=2 and in_progress status', async () => {
    const project = await createProject('char1')
    expect(project.stage_reached).toBe(2)
    expect(project.status).toBe('in_progress')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ character_id: 'char1', stage_reached: 2, status: 'in_progress' })
    )
  })
})

describe('getProject', () => {
  it('fetches project by id with expand', async () => {
    const project = await getProject('proj1')
    expect(project.id).toBe('proj1')
    expect(mockGetOne).toHaveBeenCalledWith('proj1', expect.objectContaining({ expand: 'character_id' }))
  })
})

describe('updateProject', () => {
  it('updates project fields and returns updated record', async () => {
    const project = await updateProject('proj1', { stage_reached: 3 })
    expect(project.stage_reached).toBe(3)
  })
})

describe('getProjectsForCharacter', () => {
  it('returns all projects for a character sorted by -created', async () => {
    const projects = await getProjectsForCharacter('char1')
    expect(projects).toHaveLength(2)
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.stringContaining('char1'), sort: '-created' })
    )
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- __tests__/lib/projects.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/projects'`

- [ ] **Step 3: Create `lib/projects.ts`**

```typescript
import pb from '@/lib/pocketbase'
import type { Project } from '@/lib/types'

export async function getProjectsForCharacter(characterId: string): Promise<Project[]> {
  return pb.collection('kids_projects').getFullList<Project>({
    filter: `character_id = "${characterId}"`,
    sort: '-created',
    expand: 'character_id',
  })
}

export async function getProject(id: string): Promise<Project> {
  return pb.collection('kids_projects').getOne<Project>(id, {
    expand: 'character_id',
  })
}

export async function createProject(characterId: string): Promise<Project> {
  return pb.collection('kids_projects').create<Project>({
    character_id: characterId,
    story_idea: '',
    selected_title: '',
    selected_subtitle: '',
    stage_reached: 2,
    status: 'in_progress',
  })
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, 'story_idea' | 'selected_title' | 'selected_subtitle' | 'stage_reached' | 'status'>>
): Promise<Project> {
  return pb.collection('kids_projects').update<Project>(id, data)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run -- __tests__/lib/projects.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/projects.ts __tests__/lib/projects.test.ts
git commit -m "feat: add project helpers (CRUD for kids_projects)"
```

---

## Task 2: Synopsis + PlotCard helpers

**Files:**
- Create: `lib/synopses.ts`
- Create: `lib/plot-cards.ts`
- Create: `__tests__/lib/synopses.test.ts`
- Create: `__tests__/lib/plot-cards.test.ts`

- [ ] **Step 1: Write failing tests for synopses**

Create `__tests__/lib/synopses.test.ts`:

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
  },
}))

import { createSynopsis, updateSynopsis, deleteSynopsis, getSynopsesForProject } from '@/lib/synopses'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({
    id: 'syn1', project_id: 'proj1', title: 'Brave Adventure', subtitle: 'A tale',
    beginning: '', middle: '', end: '', selected: false,
  })
  mockUpdate.mockResolvedValue({ id: 'syn1', beginning: 'The hero sets off' })
  mockDelete.mockResolvedValue(true)
  mockGetFullList.mockResolvedValue([
    { id: 'syn1', project_id: 'proj1', title: 'Brave Adventure', selected: false },
    { id: 'syn2', project_id: 'proj1', title: 'Magical Quest', selected: false },
  ])
})

describe('createSynopsis', () => {
  it('creates synopsis with empty content fields by default', async () => {
    const syn = await createSynopsis({ project_id: 'proj1', title: 'Brave Adventure', subtitle: 'A tale' })
    expect(syn.title).toBe('Brave Adventure')
    expect(syn.beginning).toBe('')
    expect(syn.selected).toBe(false)
  })
})

describe('updateSynopsis', () => {
  it('updates synopsis fields', async () => {
    const syn = await updateSynopsis('syn1', { beginning: 'The hero sets off' })
    expect(syn.beginning).toBe('The hero sets off')
  })
})

describe('deleteSynopsis', () => {
  it('calls delete with the id', async () => {
    await deleteSynopsis('syn1')
    expect(mockDelete).toHaveBeenCalledWith('syn1')
  })
})

describe('getSynopsesForProject', () => {
  it('returns all synopses for a project sorted by created', async () => {
    const synopses = await getSynopsesForProject('proj1')
    expect(synopses).toHaveLength(2)
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.stringContaining('proj1'), sort: 'created' })
    )
  })
})
```

- [ ] **Step 2: Write failing tests for plot-cards**

Create `__tests__/lib/plot-cards.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()
const mockGetFullList = vi.fn()

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      create: mockCreate,
      getFullList: mockGetFullList,
    }),
  },
}))

import { createPlotCardsForProject, getPlotCardsForProject } from '@/lib/plot-cards'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockImplementation((data: any) =>
    Promise.resolve({ id: `card_${data.act}_${data.order}`, ...data })
  )
  mockGetFullList.mockResolvedValue([
    { id: 'card1', project_id: 'proj1', act: 'beginning', order: 1, scene_beat: 'Hero wakes up', duration_sec: 15 },
  ])
})

describe('createPlotCardsForProject', () => {
  it('creates 30 cards: 9 beginning + 12 middle + 9 end', async () => {
    const beats = {
      beginning: Array.from({ length: 9 }, (_, i) => `Beginning beat ${i + 1}`),
      middle: Array.from({ length: 12 }, (_, i) => `Middle beat ${i + 1}`),
      end: Array.from({ length: 9 }, (_, i) => `End beat ${i + 1}`),
    }
    const cards = await createPlotCardsForProject('proj1', beats)
    expect(cards).toHaveLength(30)
    expect(mockCreate).toHaveBeenCalledTimes(30)
    expect(cards.filter((c) => c.act === 'beginning')).toHaveLength(9)
    expect(cards.filter((c) => c.act === 'middle')).toHaveLength(12)
    expect(cards.filter((c) => c.act === 'end')).toHaveLength(9)
  })

  it('sets order starting from 1 within each act', async () => {
    const beats = {
      beginning: ['beat 1', 'beat 2'],
      middle: ['beat 1'],
      end: ['beat 1'],
    }
    await createPlotCardsForProject('proj1', beats)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ act: 'beginning', order: 1 }))
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ act: 'beginning', order: 2 }))
  })

  it('sets default duration_sec of 15', async () => {
    const beats = { beginning: ['beat 1'], middle: [], end: [] }
    await createPlotCardsForProject('proj1', beats)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ duration_sec: 15 }))
  })
})

describe('getPlotCardsForProject', () => {
  it('returns plot cards for a project', async () => {
    const cards = await getPlotCardsForProject('proj1')
    expect(cards).toHaveLength(1)
    expect(mockGetFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.stringContaining('proj1'), sort: 'act,order' })
    )
  })
})
```

- [ ] **Step 3: Run both test files — expect failure**

```bash
npm run test:run -- __tests__/lib/synopses.test.ts __tests__/lib/plot-cards.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/synopses'` and `Cannot find module '@/lib/plot-cards'`

- [ ] **Step 4: Create `lib/synopses.ts`**

```typescript
import pb from '@/lib/pocketbase'
import type { Synopsis } from '@/lib/types'

export async function getSynopsesForProject(projectId: string): Promise<Synopsis[]> {
  return pb.collection('kids_synopses').getFullList<Synopsis>({
    filter: `project_id = "${projectId}"`,
    sort: 'created',
  })
}

export async function createSynopsis(data: {
  project_id: string
  title: string
  subtitle: string
  beginning?: string
  middle?: string
  end?: string
  selected?: boolean
}): Promise<Synopsis> {
  return pb.collection('kids_synopses').create<Synopsis>({
    project_id: data.project_id,
    title: data.title,
    subtitle: data.subtitle,
    beginning: data.beginning ?? '',
    middle: data.middle ?? '',
    end: data.end ?? '',
    selected: data.selected ?? false,
  })
}

export async function updateSynopsis(
  id: string,
  data: Partial<Pick<Synopsis, 'title' | 'subtitle' | 'beginning' | 'middle' | 'end' | 'selected'>>
): Promise<Synopsis> {
  return pb.collection('kids_synopses').update<Synopsis>(id, data)
}

export async function deleteSynopsis(id: string): Promise<void> {
  await pb.collection('kids_synopses').delete(id)
}
```

- [ ] **Step 5: Create `lib/plot-cards.ts`**

```typescript
import pb from '@/lib/pocketbase'
import type { PlotCard, Act } from '@/lib/types'

export async function getPlotCardsForProject(projectId: string): Promise<PlotCard[]> {
  return pb.collection('kids_plot_cards').getFullList<PlotCard>({
    filter: `project_id = "${projectId}"`,
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
```

- [ ] **Step 6: Run — expect pass**

```bash
npm run test:run -- __tests__/lib/synopses.test.ts __tests__/lib/plot-cards.test.ts
```

Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add lib/synopses.ts lib/plot-cards.ts __tests__/lib/synopses.test.ts __tests__/lib/plot-cards.test.ts
git commit -m "feat: add synopsis and plot-card helpers"
```

---

## Task 3: AI API route

**Files:**
- Create: `app/api/ai/route.ts`
- Create: `__tests__/api/ai.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/api/ai.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"title":"Test Title","subtitle":"Test Subtitle"}' }],
      }),
    }
  },
}))

vi.mock('@/lib/prompts', () => ({
  buildPrompt: vi.fn().mockResolvedValue({
    system: 'You are a test AI.',
    user: 'Test user prompt.',
  }),
}))

import { POST } from '@/app/api/ai/route'

describe('POST /api/ai', () => {
  it('calls Claude with the built prompt and returns text', async () => {
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ key: 'stage3_generate_titles', values: { character_name: 'WackyWilliam', story_idea: 'finds a mushroom' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.text).toBe('{"title":"Test Title","subtitle":"Test Subtitle"}')
  })

  it('returns 400 if key is missing', async () => {
    const request = new Request('http://localhost/api/ai', {
      method: 'POST',
      body: JSON.stringify({ values: {} }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run -- __tests__/api/ai.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/ai/route'`

- [ ] **Step 3: Create `app/api/ai/route.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { buildPrompt } from '@/lib/prompts'

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as { key?: string; values?: Record<string, string> }

  if (!body.key) {
    return Response.json({ error: 'key is required' }, { status: 400 })
  }

  const { system, user } = await buildPrompt(body.key, body.values ?? {})

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return Response.json({ text })
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run -- __tests__/api/ai.test.ts
```

Expected: 2 tests PASS

- [ ] **Step 5: Run all tests to confirm nothing regressed**

```bash
npm run test:run
```

Expected: all tests PASS (should be 12+ at this point)

- [ ] **Step 6: Commit**

```bash
git add app/api/ai/route.ts __tests__/api/ai.test.ts
git commit -m "feat: add AI API route (POST /api/ai)"
```

---

## Task 4: Project list page

**Files:**
- Create: `app/character/[id]/projects/page.tsx`
- Create: `components/stage1b/ProjectList.tsx`

Note: the `app/character/[id]/` directory already exists (from `app/character/[id]/edit/page.tsx`).

- [ ] **Step 1: Create `components/stage1b/ProjectList.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/lib/projects'
import type { Character, Project } from '@/lib/types'

interface ProjectListProps {
  character: Character
  projects: Project[]
}

const STAGE_LABELS: Record<number, string> = {
  2: 'Story Idea',
  3: 'Titles',
  4: 'Synopsis',
  5: 'Plotboard',
  6: 'Story Page',
  7: 'Video Prompts',
}

function projectDisplayName(project: Project): string {
  if (project.selected_title) return project.selected_title
  if (project.story_idea) {
    return project.story_idea.length > 60
      ? project.story_idea.slice(0, 60) + '…'
      : project.story_idea
  }
  return 'New Video'
}

function stageRoute(projectId: string, stageReached: number): string {
  if (stageReached >= 7) return `/project/${projectId}/prompts/beginning`
  if (stageReached >= 6) return `/project/${projectId}/story/beginning`
  if (stageReached >= 5) return `/project/${projectId}/plotboard/beginning`
  return `/project/${projectId}`
}

export default function ProjectList({ character, projects }: ProjectListProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleNewVideo() {
    setCreating(true)
    const project = await createProject(character.id)
    router.push(`/project/${project.id}`)
  }

  const inProgress = projects.filter((p) => p.status === 'in_progress')
  const completed = projects.filter((p) => p.status === 'completed')

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="label mb-1">{character.title}</div>
          <h1 className="heading-2">{character.name}</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleNewVideo}
          disabled={creating}
        >
          {creating ? 'Creating…' : '+ New Video'}
        </button>
      </div>

      <div className="page-body flex flex-col gap-6">
        {inProgress.length > 0 && (
          <section>
            <div className="label mb-3">In Progress</div>
            <div className="flex flex-col gap-2">
              {inProgress.map((project) => (
                <div key={project.id} className="card card-body flex items-center justify-between">
                  <div>
                    <div className="heading-3 text-sm">{projectDisplayName(project)}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      Stage {project.stage_reached}: {STAGE_LABELS[project.stage_reached] ?? ''}
                    </div>
                  </div>
                  <Link
                    href={stageRoute(project.id, project.stage_reached)}
                    className="btn btn-secondary btn-sm"
                  >
                    Resume →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <div className="label mb-3">Completed</div>
            <div className="flex flex-col gap-2">
              {completed.map((project) => (
                <div key={project.id} className="card card-body flex items-center justify-between">
                  <div className="heading-3 text-sm">{projectDisplayName(project)}</div>
                  <Link
                    href={stageRoute(project.id, project.stage_reached)}
                    className="btn btn-ghost btn-sm"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length === 0 && (
          <div className="stage-locked-banner">
            No videos yet. Click + New Video to start.
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/character/[id]/projects/page.tsx`**

```typescript
import { getCharacter } from '@/lib/characters'
import { getProjectsForCharacter } from '@/lib/projects'
import ProjectList from '@/components/stage1b/ProjectList'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [character, projects] = await Promise.all([
    getCharacter(id),
    getProjectsForCharacter(id),
  ])
  return <ProjectList character={character} projects={projects} />
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000`, click `[Use →]` on any character. Expected: full-page project list for that character (empty on first visit). Click `[+ New Video]` — should create a project record and navigate to `/project/[id]` (which 404s for now — that's fine, Plan 2 Task 9 builds it).

- [ ] **Step 4: Commit**

```bash
git add components/stage1b/ProjectList.tsx "app/character/[id]/projects/page.tsx"
git commit -m "feat: Stage 1b project list page"
```

---

## Task 5: Sidebar with URL-based project detection

**Files:**
- Modify: `components/sidebar/Sidebar.tsx`

The sidebar currently takes `projectId?` and `stageReached?` props. Since the root layout renders it with no props, it never shows unlocked stages when inside a project. Fix: remove props and self-detect from URL + fetch project data.

- [ ] **Step 1: Replace `components/sidebar/Sidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase'
import type { Project } from '@/lib/types'

const STAGES = [
  { number: 1, label: 'Characters' },
  { number: 2, label: 'Story Idea' },
  { number: 3, label: 'Titles' },
  { number: 4, label: 'Synopsis' },
  { number: 5, label: 'Plotboard' },
  { number: 6, label: 'Story Page' },
  { number: 7, label: 'Video Prompts' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [project, setProject] = useState<Project | null>(null)

  const projectIdMatch = pathname.match(/^\/project\/([^/]+)/)
  const urlProjectId = projectIdMatch?.[1] ?? null

  useEffect(() => {
    if (!urlProjectId) {
      setProject(null)
      return
    }
    pb.collection('kids_projects')
      .getOne<Project>(urlProjectId)
      .then(setProject)
      .catch(() => setProject(null))
  }, [urlProjectId])

  const stageReached = project?.stage_reached ?? 1

  function stageHref(stageNumber: number): string | null {
    if (!urlProjectId) return stageNumber === 1 ? '/' : null
    switch (stageNumber) {
      case 1: return '/'
      case 2: case 3: case 4: return `/project/${urlProjectId}`
      case 5: return `/project/${urlProjectId}/plotboard/beginning`
      case 6: return `/project/${urlProjectId}/story/beginning`
      case 7: return `/project/${urlProjectId}/prompts/beginning`
      default: return null
    }
  }

  function isActive(stageNumber: number): boolean {
    if (stageNumber === 1) {
      return pathname === '/' || pathname.startsWith('/character')
    }
    if (!urlProjectId) return false
    const projectBase = `/project/${urlProjectId}`
    if (stageNumber >= 2 && stageNumber <= 4) {
      const onProjectPage =
        pathname === projectBase ||
        pathname === `${projectBase}/` ||
        (pathname.startsWith(projectBase) &&
          !pathname.includes('/plotboard') &&
          !pathname.includes('/story') &&
          !pathname.includes('/prompts'))
      if (!onProjectPage) return false
      return stageNumber === Math.min(stageReached, 4)
    }
    if (stageNumber === 5) return pathname.startsWith(`${projectBase}/plotboard`)
    if (stageNumber === 6) return pathname.startsWith(`${projectBase}/story`)
    if (stageNumber === 7) return pathname.startsWith(`${projectBase}/prompts`)
    return false
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">🎬 Kids Studio</div>
      <div className="flex flex-col py-2 flex-1">
        {STAGES.map((stage) => {
          const unlocked = stage.number <= stageReached || stage.number === 1
          const active = isActive(stage.number)
          const href = stageHref(stage.number)

          if (!unlocked) {
            return (
              <div key={stage.number} className="sidebar-item-locked">
                <span className="text-[10px] w-4 text-center opacity-60">{stage.number}</span>
                {stage.label}
              </div>
            )
          }

          if (active) {
            return (
              <div key={stage.number} className="sidebar-item-active">
                <span className="text-[10px] w-4 text-center">{stage.number}</span>
                {stage.label}
              </div>
            )
          }

          return (
            <Link key={stage.number} href={href ?? '/'} className="sidebar-item-unlocked">
              <span className="text-[10px] w-4 text-center">{stage.number}</span>
              {stage.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Sidebar still shows Characters as active, stages 2–7 locked. Navigate to a project URL (`/project/[id]`) after creating one from Step 4 verification — sidebar should show unlocked stages for that project.

- [ ] **Step 3: Commit**

```bash
git add components/sidebar/Sidebar.tsx
git commit -m "feat: sidebar self-fetches project context from URL"
```

---

## Task 6: StoryIdeaSection

**Files:**
- Create: `components/stage2/StoryIdeaSection.tsx`

- [ ] **Step 1: Create `components/stage2/StoryIdeaSection.tsx`**

```typescript
'use client'

import { useState } from 'react'

interface StoryIdeaSectionProps {
  characterName: string
  characterProfile: string
  initialStoryIdea: string
  locked: boolean
  onGenerateTitles: (storyIdea: string) => Promise<void>
}

export default function StoryIdeaSection({
  characterName,
  characterProfile,
  initialStoryIdea,
  locked,
  onGenerateTitles,
}: StoryIdeaSectionProps) {
  const [storyIdea, setStoryIdea] = useState(initialStoryIdea)
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage2_regenerate',
          values: {
            character_name: characterName,
            character_profile: characterProfile,
            current_idea: storyIdea,
          },
        }),
      })
      const { text } = await res.json() as { text: string }
      setStoryIdea(text.trim())
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateTitles() {
    if (!storyIdea.trim()) return
    setLoading(true)
    try {
      await onGenerateTitles(storyIdea)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="label">Stage 2 — Story Idea</span>
        <span className="stage-label">{characterName}</span>
      </div>
      <div className="card-body flex flex-col gap-4">
        <textarea
          className="textarea"
          rows={4}
          placeholder="What is this video about? Describe the story direction…"
          value={storyIdea}
          onChange={(e) => setStoryIdea(e.target.value)}
          disabled={locked}
        />
        <div className="flex gap-2 justify-end">
          <button
            className="btn btn-ghost"
            onClick={handleRegenerate}
            disabled={loading || locked}
          >
            ↻ Regenerate
          </button>
          {!locked && (
            <button
              className="btn btn-primary"
              onClick={handleGenerateTitles}
              disabled={loading || !storyIdea.trim()}
            >
              {loading ? 'Generating…' : 'Generate Titles →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stage2/StoryIdeaSection.tsx
git commit -m "feat: StoryIdeaSection component (Stage 2)"
```

---

## Task 7: TitleCard + TitlesSection

**Files:**
- Create: `components/stage3/TitleCard.tsx`
- Create: `components/stage3/TitlesSection.tsx`

- [ ] **Step 1: Create `components/stage3/TitleCard.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { Synopsis } from '@/lib/types'

interface TitleCardProps {
  synopsis: Synopsis
  characterName: string
  storyIdea: string
  onUpdate: (id: string, title: string, subtitle: string) => void
  onUse: (id: string) => Promise<void>
}

export default function TitleCard({
  synopsis,
  characterName,
  storyIdea,
  onUpdate,
  onUse,
}: TitleCardProps) {
  const [title, setTitle] = useState(synopsis.title)
  const [subtitle, setSubtitle] = useState(synopsis.subtitle)
  const [loading, setLoading] = useState(false)

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage3_regenerate_title',
          values: {
            character_name: characterName,
            story_idea: storyIdea,
            current_title: title,
            current_subtitle: subtitle,
          },
        }),
      })
      const { text } = await res.json() as { text: string }
      const parsed = JSON.parse(text) as { title: string; subtitle: string }
      setTitle(parsed.title)
      setSubtitle(parsed.subtitle)
      onUpdate(synopsis.id, parsed.title, parsed.subtitle)
    } finally {
      setLoading(false)
    }
  }

  async function handleUse() {
    setLoading(true)
    try {
      await onUse(synopsis.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-body flex flex-col gap-3">
        <input
          className="input"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            onUpdate(synopsis.id, e.target.value, subtitle)
          }}
          placeholder="Title"
        />
        <input
          className="input"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value)
            onUpdate(synopsis.id, title, e.target.value)
          }}
          placeholder="Subtitle"
        />
      </div>
      <div className="card-footer">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRegenerate}
          disabled={loading}
        >
          ↻ Regenerate This
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleUse}
          disabled={loading}
        >
          {loading ? 'Generating synopses…' : 'Use →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/stage3/TitlesSection.tsx`**

```typescript
import TitleCard from './TitleCard'
import type { Synopsis } from '@/lib/types'

interface TitlesSectionProps {
  synopses: Synopsis[]
  characterName: string
  storyIdea: string
  onUpdateTitle: (id: string, title: string, subtitle: string) => void
  onSelectTitle: (id: string) => Promise<void>
}

export default function TitlesSection({
  synopses,
  characterName,
  storyIdea,
  onUpdateTitle,
  onSelectTitle,
}: TitlesSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="label">Stage 3 — Choose a Title</div>
      {synopses.map((synopsis) => (
        <TitleCard
          key={synopsis.id}
          synopsis={synopsis}
          characterName={characterName}
          storyIdea={storyIdea}
          onUpdate={onUpdateTitle}
          onUse={onSelectTitle}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/stage3/TitleCard.tsx components/stage3/TitlesSection.tsx
git commit -m "feat: TitleCard and TitlesSection components (Stage 3)"
```

---

## Task 8: SynopsisCard + SynopsisSection

**Files:**
- Create: `components/stage4/SynopsisCard.tsx`
- Create: `components/stage4/SynopsisSection.tsx`

- [ ] **Step 1: Create `components/stage4/SynopsisCard.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { Synopsis } from '@/lib/types'

interface SynopsisCardProps {
  synopsis: Synopsis
  characterName: string
  storyIdea: string
  onUpdate: (id: string, data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>) => void
  onExecute: (id: string) => Promise<void>
}

export default function SynopsisCard({
  synopsis,
  characterName,
  storyIdea,
  onUpdate,
  onExecute,
}: SynopsisCardProps) {
  const [beginning, setBeginning] = useState(synopsis.beginning)
  const [middle, setMiddle] = useState(synopsis.middle)
  const [end, setEnd] = useState(synopsis.end)
  const [loading, setLoading] = useState(false)

  function getField(label: string): string {
    if (label === 'Beginning') return beginning
    if (label === 'Middle') return middle
    return end
  }

  function setField(label: string, value: string) {
    if (label === 'Beginning') setBeginning(value)
    else if (label === 'Middle') setMiddle(value)
    else setEnd(value)
    onUpdate(synopsis.id, {
      beginning: label === 'Beginning' ? value : beginning,
      middle: label === 'Middle' ? value : middle,
      end: label === 'End' ? value : end,
    })
  }

  async function handleRegenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'stage4_regenerate_synopsis',
          values: {
            character_name: characterName,
            story_idea: storyIdea,
            title: synopsis.title,
            subtitle: synopsis.subtitle,
          },
        }),
      })
      const { text } = await res.json() as { text: string }
      const parsed = JSON.parse(text) as { beginning: string; middle: string; end: string }
      setBeginning(parsed.beginning)
      setMiddle(parsed.middle)
      setEnd(parsed.end)
      onUpdate(synopsis.id, parsed)
    } finally {
      setLoading(false)
    }
  }

  async function handleExecute() {
    setLoading(true)
    try {
      await onExecute(synopsis.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="heading-3 text-sm">{synopsis.title}</div>
          {synopsis.subtitle && (
            <div className="text-xs text-white/40 mt-0.5">{synopsis.subtitle}</div>
          )}
        </div>
      </div>
      <div className="card-body flex flex-col gap-4">
        {(['Beginning', 'Middle', 'End'] as const).map((label) => (
          <div key={label}>
            <label className="field-label">{label}</label>
            <textarea
              className="textarea"
              rows={3}
              value={getField(label)}
              onChange={(e) => setField(label, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="card-footer">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleRegenerate}
          disabled={loading}
        >
          ↻ Regenerate
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleExecute}
          disabled={loading || !beginning || !middle || !end}
        >
          {loading ? 'Generating Plotboard…' : 'Execute →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/stage4/SynopsisSection.tsx`**

```typescript
import SynopsisCard from './SynopsisCard'
import type { Synopsis } from '@/lib/types'

interface SynopsisSectionProps {
  synopses: Synopsis[]
  characterName: string
  storyIdea: string
  onUpdateSynopsis: (id: string, data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>) => void
  onExecuteSynopsis: (id: string) => Promise<void>
}

export default function SynopsisSection({
  synopses,
  characterName,
  storyIdea,
  onUpdateSynopsis,
  onExecuteSynopsis,
}: SynopsisSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="label">Stage 4 — Choose a Synopsis</div>
      {synopses.map((synopsis) => (
        <SynopsisCard
          key={synopsis.id}
          synopsis={synopsis}
          characterName={characterName}
          storyIdea={storyIdea}
          onUpdate={onUpdateSynopsis}
          onExecute={onExecuteSynopsis}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/stage4/SynopsisCard.tsx components/stage4/SynopsisSection.tsx
git commit -m "feat: SynopsisCard and SynopsisSection components (Stage 4)"
```

---

## Task 9: ProjectPage + project route

**Files:**
- Create: `components/project/ProjectPage.tsx`
- Create: `app/project/[id]/page.tsx`

This is the orchestrator for Stages 2–4. It owns all state, coordinates AI calls, and manages progressive reveal.

**Progressive reveal logic:**
- Stage 2 always shows.
- Stage 3 (titles) shows after `[Generate Titles →]` succeeds.
- During `[Use →]` on a title: generates all 5 synopses in parallel, shows loading banner, then reveals Stage 4.
- Stage 4 (synopses) shows when all 5 synopses have `beginning` content.
- `[Execute →]` in Stage 4: generates 30 plot cards, updates stage_reached to 5, navigates to plotboard.

**Resume logic (loaded from PocketBase on page load):**
- `initialSynopses` from server: if they have `beginning` content → start at Stage 4.
- If they have only `title`/`subtitle` → start at Stage 3.
- Otherwise → start at Stage 2.

- [ ] **Step 1: Create `components/project/ProjectPage.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StoryIdeaSection from '@/components/stage2/StoryIdeaSection'
import TitlesSection from '@/components/stage3/TitlesSection'
import SynopsisSection from '@/components/stage4/SynopsisSection'
import { updateProject } from '@/lib/projects'
import { createSynopsis, updateSynopsis, deleteSynopsis } from '@/lib/synopses'
import { createPlotCardsForProject } from '@/lib/plot-cards'
import type { Character, Project, Synopsis } from '@/lib/types'

interface ProjectPageProps {
  project: Project
  character: Character
  initialSynopses: Synopsis[]
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

type Stage = 2 | 3 | 4

function computeInitialStage(synopses: Synopsis[]): Stage {
  if (synopses.length > 0 && synopses.some((s) => s.beginning)) return 4
  if (synopses.length > 0) return 3
  return 2
}

export default function ProjectPage({
  project,
  character,
  initialSynopses,
}: ProjectPageProps) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(computeInitialStage(initialSynopses))
  const [synopses, setSynopses] = useState<Synopsis[]>(initialSynopses)
  const [generatingSynopses, setGeneratingSynopses] = useState(false)
  const [storyIdea, setStoryIdea] = useState(project.story_idea || '')

  const profile = buildCharacterProfile(character)

  async function handleGenerateTitles(idea: string) {
    setStoryIdea(idea)

    // Delete any existing synopses (regenerating)
    if (synopses.length > 0) {
      await Promise.all(synopses.map((s) => deleteSynopsis(s.id)))
    }

    await updateProject(project.id, { story_idea: idea, stage_reached: 3 })

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'stage3_generate_titles',
        values: { character_name: character.name, story_idea: idea },
      }),
    })
    const { text } = await res.json() as { text: string }
    const pairs = JSON.parse(text) as { title: string; subtitle: string }[]

    const created = await Promise.all(
      pairs.slice(0, 5).map((pair) =>
        createSynopsis({ project_id: project.id, title: pair.title, subtitle: pair.subtitle })
      )
    )
    setSynopses(created)
    setStage(3)
  }

  function handleUpdateTitle(id: string, title: string, subtitle: string) {
    setSynopses((prev) => prev.map((s) => (s.id === id ? { ...s, title, subtitle } : s)))
    updateSynopsis(id, { title, subtitle })
  }

  async function handleSelectTitle(synopsisId: string) {
    const selected = synopses.find((s) => s.id === synopsisId)
    if (!selected) return

    await updateProject(project.id, {
      selected_title: selected.title,
      selected_subtitle: selected.subtitle,
      stage_reached: 4,
    })

    setGeneratingSynopses(true)
    const updated = await Promise.all(
      synopses.map(async (syn) => {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'stage4_regenerate_synopsis',
            values: {
              character_name: character.name,
              story_idea: storyIdea,
              title: syn.title,
              subtitle: syn.subtitle,
            },
          }),
        })
        const { text } = await res.json() as { text: string }
        const parsed = JSON.parse(text) as { beginning: string; middle: string; end: string }
        await updateSynopsis(syn.id, parsed)
        return { ...syn, ...parsed }
      })
    )
    setSynopses(updated)
    setGeneratingSynopses(false)
    setStage(4)
  }

  function handleUpdateSynopsis(
    id: string,
    data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>
  ) {
    setSynopses((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
    updateSynopsis(id, data)
  }

  async function handleExecuteSynopsis(synopsisId: string) {
    const selected = synopses.find((s) => s.id === synopsisId)
    if (!selected) return

    await Promise.all([
      updateSynopsis(synopsisId, { selected: true }),
      updateProject(project.id, {
        selected_title: selected.title,
        selected_subtitle: selected.subtitle,
        stage_reached: 5,
      }),
    ])

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'stage5_generate_plotboard',
        values: {
          character_name: character.name,
          character_profile: profile,
          title: selected.title,
          synopsis_beginning: selected.beginning,
          synopsis_middle: selected.middle,
          synopsis_end: selected.end,
        },
      }),
    })
    const { text } = await res.json() as { text: string }
    const beats = JSON.parse(text) as {
      beginning: string[]
      middle: string[]
      end: string[]
    }

    await createPlotCardsForProject(project.id, beats)
    router.push(`/project/${project.id}/plotboard/beginning`)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="label mb-1">{character.name}</div>
          <h1 className="heading-2">Video Project</h1>
        </div>
      </div>

      <div className="page-body flex flex-col gap-6 max-w-3xl">
        <StoryIdeaSection
          characterName={character.name}
          characterProfile={profile}
          initialStoryIdea={storyIdea}
          locked={stage >= 3}
          onGenerateTitles={handleGenerateTitles}
        />

        {stage >= 3 && (
          <TitlesSection
            synopses={synopses}
            characterName={character.name}
            storyIdea={storyIdea}
            onUpdateTitle={handleUpdateTitle}
            onSelectTitle={handleSelectTitle}
          />
        )}

        {generatingSynopses && (
          <div className="stage-locked-banner">Generating synopses…</div>
        )}

        {stage >= 4 && !generatingSynopses && (
          <SynopsisSection
            synopses={synopses}
            characterName={character.name}
            storyIdea={storyIdea}
            onUpdateSynopsis={handleUpdateSynopsis}
            onExecuteSynopsis={handleExecuteSynopsis}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/project/[id]/page.tsx`**

```typescript
import { getProject } from '@/lib/projects'
import { getCharacter } from '@/lib/characters'
import { getSynopsesForProject } from '@/lib/synopses'
import ProjectPage from '@/components/project/ProjectPage'

export const dynamic = 'force-dynamic'

export default async function ProjectRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)
  const [character, synopses] = await Promise.all([
    getCharacter(project.character_id),
    getSynopsesForProject(id),
  ])
  return <ProjectPage project={project} character={character} initialSynopses={synopses} />
}
```

- [ ] **Step 3: Run all tests**

```bash
npm run test:run
```

Expected: all tests PASS

- [ ] **Step 4: Run build**

```bash
npm run build
```

Expected: clean build. Routes should include:
- `ƒ /` 
- `ƒ /character/[id]/edit`
- `ƒ /character/[id]/projects`
- `ƒ /project/[id]`

- [ ] **Step 5: End-to-end flow verification in browser**

```bash
npm run dev
```

Walk through the full flow:
1. `http://localhost:3000` → character grid with 10 characters
2. Click `[Use →]` on a character → project list (empty)
3. Click `[+ New Video]` → navigates to `/project/[id]`
4. Sidebar shows: Characters unlocked, Stage 2 (Story Idea) active, 3–7 locked
5. Type a story idea, click `[Generate Titles →]` → loading → 5 title cards appear
6. Sidebar now shows Stage 3 active
7. Edit a title, click `[↻ Regenerate This]` → title updates
8. Click `[Use →]` on any title → loading banner → 5 synopsis cards appear
9. Sidebar now shows Stage 4 active
10. Edit a synopsis field, click `[↻ Regenerate]` → synopsis regenerates
11. Click `[Execute →]` → long loading (30 plot cards being created) → navigates to `/project/[id]/plotboard/beginning` (404 for now — Plan 3 builds this)

If `ANTHROPIC_API_KEY` is still the placeholder, AI calls will fail with auth errors. Replace it in `.env.local` before testing.

- [ ] **Step 6: Commit**

```bash
git add components/project/ProjectPage.tsx "app/project/[id]/page.tsx"
git commit -m "feat: ProjectPage and project route (Stages 2-4 with AI)"
```

---

## Self-Review

**Spec coverage check:**

- ✅ Stage 1b: full-page project list, in-progress with stage badge, `[Resume]`, `[+ New Video]`
- ✅ Stage 2: free-text story idea, `[Regenerate]`, `[Generate Titles →]` calls AI
- ✅ Stage 3: 5 TitleCards, editable title + subtitle, `[Regenerate This]`, `[Use →]`
- ✅ Stage 4: 5 SynopsisCards with beginning/middle/end, `[Regenerate]`, `[Execute →]`
- ✅ `[Execute →]` generates all 30 plot cards and navigates to plotboard
- ✅ All AI calls load prompts from PocketBase via `buildPrompt(key, values)`
- ✅ `stage_reached` updated in PocketBase at each stage transition
- ✅ Sidebar unlocks stages dynamically using URL-detected project data
- ✅ Resume: page initializes at correct stage based on existing synopses

**Not in Plan 2 (deferred):**
- Plotboard, Story Page, Video Prompts (Plans 3 and 4)

**Placeholder scan:** None found.

**Type consistency:** `Synopsis`, `Project`, `Character`, `PlotCard` imported from `lib/types.ts` throughout. `updateSynopsis` signature matches `Synopsis` type. `createSynopsis` matches `kids_synopses` schema.

---

## Next Plans

- **Plan 3:** `2026-04-19-plan-3-plotboard.md` — Stage 5: paginated plotboard with drag-to-reorder
- **Plan 4:** `2026-04-19-plan-4-story-prompts.md` — Stages 6–7: Story Page + Video Prompts with AI
