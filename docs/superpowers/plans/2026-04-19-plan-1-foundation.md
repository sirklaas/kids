# Kids Dashboard — Plan 1: Foundation + Stage 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Next.js app with a class-based design system, PocketBase integration, persistent sidebar, and a fully working Stage 1 character grid with edit page.

**Architecture:** Next.js App Router with a persistent left sidebar shell. All styling goes through named CSS classes defined in `globals.css` using Tailwind's `@layer components` — no inline styles or ad-hoc Tailwind in components. PocketBase is remote; the JS SDK connects via `NEXT_PUBLIC_POCKETBASE_URL`. Stage 1 renders 10 character cards from PocketBase; clicking [Use] navigates to the project list (built in Plan 2).

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, PocketBase JS SDK, Vitest + React Testing Library, Remote PocketBase instance

---

## File Map

```
app/
  layout.tsx                        Root shell — sidebar + main content area
  page.tsx                          Stage 1: character grid
  character/[id]/
    edit/page.tsx                   CharacterEditPage
    projects/page.tsx               Project list (Plan 2)
  project/[id]/
    page.tsx                        Stages 2–4 (Plan 2)
    plotboard/[act]/page.tsx        Stage 5 (Plan 3)
    story/[act]/page.tsx            Stage 6 (Plan 4)
    prompts/[act]/page.tsx          Stage 7 (Plan 4)

components/
  sidebar/
    Sidebar.tsx                     Persistent 7-stage nav
  stage1/
    CharacterCard.tsx               Single character card (avatar, name, buttons)
    CharacterEditPage.tsx           Edit form component

lib/
  pocketbase.ts                     Singleton PocketBase client
  types.ts                          TypeScript types for all 6 collections
  characters.ts                     CRUD helpers for kids_characters
  prompts.ts                        Load prompt from kids_prompts, fill placeholders

app/globals.css                     Design system — ALL named CSS classes live here
vitest.config.ts                    Vitest config
vitest.setup.ts                     Testing Library setup
__tests__/
  lib/characters.test.ts            Unit tests for character helpers
  lib/prompts.test.ts               Unit tests for prompt loader + template filler
scripts/
  seed-characters.ts                Seeds 10 initial character rows
  seed-prompts.ts                   Seeds 9 initial prompt rows
```

---

## Task 1: Initialize Next.js project

**Files:**
- Create: project root (scaffold)

- [ ] **Step 1: Scaffold the project**

```bash
cd /Users/mac/GitHubLocal/kids
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected output: files created, `npm run dev` ready.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install pocketbase @anthropic-ai/sdk
```

- [ ] **Step 3: Install dev/test dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: server on `http://localhost:3000`, no errors.

- [ ] **Step 5: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 2: Vitest configuration

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Verify Vitest works**

```bash
npm run test:run
```

Expected: "No test files found" (no errors).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "feat: configure Vitest with React Testing Library"
```

---

## Task 3: TypeScript types

**Files:**
- Create: `lib/types.ts`
- Create: `__tests__/lib/types.test.ts`

- [ ] **Step 1: Write the failing type-shape test**

Create `__tests__/lib/types.test.ts`:

```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type { Character, Project, Synopsis, PlotCard, StoryCard } from '@/lib/types'

describe('types', () => {
  it('Character has required fields', () => {
    expectTypeOf<Character>().toHaveProperty('id')
    expectTypeOf<Character>().toHaveProperty('name')
    expectTypeOf<Character>().toHaveProperty('avatar_url')
    expectTypeOf<Character>().toHaveProperty('visual_description')
  })

  it('Project has stage_reached as number', () => {
    expectTypeOf<Project['stage_reached']>().toBeNumber()
    expectTypeOf<Project['status']>().toEqualTypeOf<'in_progress' | 'completed'>()
  })

  it('StoryCard includes video prompt fields', () => {
    expectTypeOf<StoryCard>().toHaveProperty('written_scene')
    expectTypeOf<StoryCard>().toHaveProperty('environment')
    expectTypeOf<StoryCard>().toHaveProperty('music')
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm run test:run
```

Expected: FAIL — `Cannot find module '@/lib/types'`

- [ ] **Step 3: Create `lib/types.ts`**

```typescript
export interface Character {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  name: string
  title: string
  avatar_url: string
  age: string
  personality: string
  visual_description: string
  voice_style: string
  catchphrases: string
  backstory: string
}

export interface Project {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  character_id: string
  story_idea: string
  selected_title: string
  selected_subtitle: string
  stage_reached: number
  status: 'in_progress' | 'completed'
  expand?: { character_id?: Character }
}

export interface Synopsis {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  project_id: string
  title: string
  subtitle: string
  beginning: string
  middle: string
  end: string
  selected: boolean
}

export interface PlotCard {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  project_id: string
  act: 'beginning' | 'middle' | 'end'
  order: number
  scene_beat: string
  duration_sec: number
}

export interface StoryCard {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  plot_card_id: string
  project_id: string
  written_scene: string
  environment: string
  characters: string
  voice_over: string
  spoken_text: string
  sound_effects: string
  music: string
  expand?: { plot_card_id?: PlotCard }
}

export type Act = 'beginning' | 'middle' | 'end'

export const ACT_CLIP_COUNTS: Record<Act, number> = {
  beginning: 9,
  middle: 12,
  end: 9,
}

export const ACT_GRID: Record<Act, { cols: number; rows: number }> = {
  beginning: { cols: 3, rows: 3 },
  middle: { cols: 3, rows: 4 },
  end: { cols: 3, rows: 3 },
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm run test:run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts __tests__/lib/types.test.ts
git commit -m "feat: add TypeScript types for all PocketBase collections"
```

---

## Task 4: PocketBase client + environment

**Files:**
- Create: `lib/pocketbase.ts`
- Create: `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.local`**

```bash
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

- [ ] **Step 2: Add `.env.local` to `.gitignore`**

Verify `.gitignore` already includes `.env.local` (Next.js scaffold adds it). If not, add it.

- [ ] **Step 3: Create `lib/pocketbase.ts`**

```typescript
import PocketBase from 'pocketbase'

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io'
)

export default pb
```

- [ ] **Step 4: Commit**

```bash
git add lib/pocketbase.ts .env.local .gitignore
git commit -m "feat: add PocketBase singleton client"
```

---

## Task 5: PocketBase schema setup

**Files:** none (manual PocketBase admin UI steps — remote instance)

PocketBase is already running remotely. Open the admin UI at your PocketBase URL + `/_/` and log in.

- [ ] **Step 1: Set env vars in `.env.local`**

```bash
NEXT_PUBLIC_POCKETBASE_URL=https://pinkmilk.pockethost.io
ANTHROPIC_API_KEY=sk-ant-...
```

`ANTHROPIC_API_KEY` is added now for later use in Plan 2.

- [ ] **Step 2: Verify connection**

```bash
curl "https://pinkmilk.pockethost.io/api/health"
```

Expected: `{"code":200,"message":"API is healthy."}`

Open the admin UI at `https://pinkmilk.pockethost.io/_/` (credentials in `~/GitHubLocal/skills/pocketbase/SKILL.md`).

- [ ] **Step 3: Create `kids_characters` collection**

In Collections → New collection → name: `kids_characters`

Add fields:
| Name | Type | Required |
|---|---|---|
| name | Text | yes |
| title | Text | no |
| avatar_url | Text | no |
| age | Text | no |
| personality | Text | no |
| visual_description | Text | no |
| voice_style | Text | no |
| catchphrases | Text | no |
| backstory | Text | no |

- [ ] **Step 5: Create `kids_projects` collection**

Add fields:
| Name | Type | Options |
|---|---|---|
| character_id | Relation | kids_characters, single |
| story_idea | Text | no |
| selected_title | Text | no |
| selected_subtitle | Text | no |
| stage_reached | Number | min 2, max 7 |
| status | Select | values: in_progress, completed |

- [ ] **Step 6: Create `kids_synopses` collection**

| Name | Type |
|---|---|
| project_id | Relation → kids_projects |
| title | Text |
| subtitle | Text |
| beginning | Text |
| middle | Text |
| end | Text |
| selected | Bool |

- [ ] **Step 7: Create `kids_plot_cards` collection**

| Name | Type | Options |
|---|---|---|
| project_id | Relation → kids_projects | |
| act | Select | values: beginning, middle, end |
| order | Number | |
| scene_beat | Text | |
| duration_sec | Number | default 15 |

- [ ] **Step 8: Create `kids_story_cards` collection**

| Name | Type |
|---|---|
| plot_card_id | Relation → kids_plot_cards |
| project_id | Relation → kids_projects |
| written_scene | Text |
| environment | Text |
| characters | Text |
| voice_over | Text |
| spoken_text | Text |
| sound_effects | Text |
| music | Text |

- [ ] **Step 9: Create `kids_prompts` collection**

| Name | Type | Options |
|---|---|---|
| key | Text | required, unique |
| system_prompt | Text | required |
| user_template | Text | required |
| notes | Text | optional |

- [ ] **Step 10: Set API rules**

For all 6 collections, in the API Rules tab set List/View/Create/Update/Delete rules to empty string `""` (allow all — single-user app, no auth needed).

- [ ] **Step 11: Commit**

```bash
git add .env.local
git commit -m "chore: PocketBase schema configured on remote instance"
```

---

## Task 6: Character data helpers + seed

**Files:**
- Create: `lib/characters.ts`
- Create: `__tests__/lib/characters.test.ts`
- Create: `scripts/seed-characters.ts`

- [ ] **Step 1: Write failing tests for character helpers**

Create `__tests__/lib/characters.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      getFullList: vi.fn().mockResolvedValue([
        { id: '1', name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' },
        { id: '2', name: 'Daisy', title: 'The Dreamer', avatar_url: '' },
      ]),
      getOne: vi.fn().mockResolvedValue(
        { id: '1', name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' }
      ),
      update: vi.fn().mockResolvedValue(
        { id: '1', name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' }
      ),
    }),
  },
}))

import { getAllCharacters, getCharacter, updateCharacter } from '@/lib/characters'

describe('getAllCharacters', () => {
  it('returns array of characters', async () => {
    const result = await getAllCharacters()
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('WackyWilliam')
  })
})

describe('getCharacter', () => {
  it('returns a single character by id', async () => {
    const result = await getCharacter('1')
    expect(result.id).toBe('1')
    expect(result.name).toBe('WackyWilliam')
  })
})

describe('updateCharacter', () => {
  it('calls update with correct collection and data', async () => {
    const result = await updateCharacter('1', { name: 'NewName' })
    expect(result.id).toBe('1')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run
```

Expected: FAIL — `Cannot find module '@/lib/characters'`

- [ ] **Step 3: Create `lib/characters.ts`**

```typescript
import pb from '@/lib/pocketbase'
import type { Character } from '@/lib/types'

export async function getAllCharacters(): Promise<Character[]> {
  return pb.collection('kids_characters').getFullList<Character>({
    sort: 'created',
  })
}

export async function getCharacter(id: string): Promise<Character> {
  return pb.collection('kids_characters').getOne<Character>(id)
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<Character, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'>>
): Promise<Character> {
  return pb.collection('kids_characters').update<Character>(id, data)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run
```

Expected: PASS

- [ ] **Step 5: Create `scripts/seed-characters.ts`**

```typescript
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io')

const CHARACTERS = [
  { name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' },
  { name: 'Daisy', title: 'The Dreamer', avatar_url: '' },
  { name: 'FoxyFinn', title: 'The Trickster', avatar_url: '' },
  { name: 'BraveBella', title: 'The Hero', avatar_url: '' },
  { name: 'SleepySam', title: 'The Thinker', avatar_url: '' },
  { name: 'LuckyLeo', title: 'The Adventurer', avatar_url: '' },
  { name: 'MagicMia', title: 'The Inventor', avatar_url: '' },
  { name: 'CuriousCarlo', title: 'The Scientist', avatar_url: '' },
  { name: 'HappyHana', title: 'The Artist', avatar_url: '' },
  { name: 'TinyTom', title: 'The Storyteller', avatar_url: '' },
]

async function seed() {
  console.log('Seeding 10 characters...')
  for (const char of CHARACTERS) {
    const record = await pb.collection('kids_characters').create(char)
    console.log(`Created: ${record.name} (${record.id})`)
  }
  console.log('Done.')
}

seed().catch(console.error)
```

- [ ] **Step 6: Run seed script**

```bash
npx tsx scripts/seed-characters.ts
```

Expected: 10 "Created:" lines. Verify in PocketBase admin UI under kids_characters.

- [ ] **Step 7: Commit**

```bash
git add lib/characters.ts __tests__/lib/characters.test.ts scripts/seed-characters.ts
git commit -m "feat: add character helpers and seed 10 characters"
```

---

## Task 7: Prompts helper + seed

**Files:**
- Create: `lib/prompts.ts`
- Create: `__tests__/lib/prompts.test.ts`
- Create: `scripts/seed-prompts.ts`

- [ ] **Step 1: Write failing tests for prompt helpers**

Create `__tests__/lib/prompts.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/pocketbase', () => ({
  default: {
    collection: vi.fn().mockReturnValue({
      getFirstListItem: vi.fn().mockResolvedValue({
        id: 'p1',
        key: 'stage3_generate_titles',
        system_prompt: 'You are a kids story title writer.',
        user_template: 'Character: {{character_name}}. Story: {{story_idea}}. Generate 5 titles.',
        notes: '',
      }),
    }),
  },
}))

import { getPrompt, fillTemplate } from '@/lib/prompts'

describe('fillTemplate', () => {
  it('replaces all {{placeholders}} with values', () => {
    const result = fillTemplate(
      'Character: {{character_name}}. Story: {{story_idea}}.',
      { character_name: 'WackyWilliam', story_idea: 'finds a mushroom' }
    )
    expect(result).toBe('Character: WackyWilliam. Story: finds a mushroom.')
  })

  it('leaves unmatched placeholders as empty string', () => {
    const result = fillTemplate('Hello {{name}}!', {})
    expect(result).toBe('Hello !')
  })
})

describe('getPrompt', () => {
  it('returns prompt record by key', async () => {
    const prompt = await getPrompt('stage3_generate_titles')
    expect(prompt.key).toBe('stage3_generate_titles')
    expect(prompt.system_prompt).toContain('kids story')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm run test:run
```

Expected: FAIL — `Cannot find module '@/lib/prompts'`

- [ ] **Step 3: Create `lib/prompts.ts`**

```typescript
import pb from '@/lib/pocketbase'

export interface PromptRecord {
  id: string
  key: string
  system_prompt: string
  user_template: string
  notes: string
}

export async function getPrompt(key: string): Promise<PromptRecord> {
  return pb.collection('kids_prompts').getFirstListItem<PromptRecord>(
    `key = "${key}"`
  )
}

export function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '')
}

export async function buildPrompt(
  key: string,
  values: Record<string, string>
): Promise<{ system: string; user: string }> {
  const prompt = await getPrompt(key)
  return {
    system: prompt.system_prompt,
    user: fillTemplate(prompt.user_template, values),
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm run test:run
```

Expected: PASS

- [ ] **Step 5: Create `scripts/seed-prompts.ts`**

```typescript
import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090')

const PROMPTS = [
  {
    key: 'stage2_regenerate',
    system_prompt: `You are a creative kids YouTube story director. Generate alternative story directions that are fun, age-appropriate, and engaging for children aged 4–8. Keep suggestions concise — one sentence.`,
    user_template: `Character: {{character_name}}.
Profile: {{character_profile}}
Current story idea: {{current_idea}}

Suggest one fresh alternative story direction for this character. One sentence only.`,
    notes: 'Stage 2 — regenerate alternative story direction',
  },
  {
    key: 'stage3_generate_titles',
    system_prompt: `You are a kids YouTube video title writer. Titles should be catchy, fun, and appeal to children aged 4–8 and their parents. Each title should make a child want to watch immediately.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}

Generate exactly 5 title+subtitle pairs. Return as JSON array:
[{"title": "...", "subtitle": "..."}, ...]`,
    notes: 'Stage 3 — generate 5 title+subtitle pairs',
  },
  {
    key: 'stage3_regenerate_title',
    system_prompt: `You are a kids YouTube video title writer. Titles should be catchy, fun, and appeal to children aged 4–8 and their parents.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}
Current title: {{current_title}}
Current subtitle: {{current_subtitle}}

Generate one fresh alternative title+subtitle pair. Return as JSON:
{"title": "...", "subtitle": "..."}`,
    notes: 'Stage 3 — regenerate one title card',
  },
  {
    key: 'stage4_regenerate_synopsis',
    system_prompt: `You are a kids YouTube story writer. Create engaging 3-part story outlines with a clear beginning, middle, and end. Stories should be fun, educational, and age-appropriate for children 4–8.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}
Title: {{title}}
Subtitle: {{subtitle}}

Write a story synopsis with three sections. Return as JSON:
{"beginning": "...", "middle": "...", "end": "..."}`,
    notes: 'Stage 4 — regenerate one synopsis',
  },
  {
    key: 'stage5_generate_plotboard',
    system_prompt: `You are a kids YouTube video scene planner. You write short, vivid scene beats — one sentence each — that describe exactly what happens visually in each clip. Each beat should be concrete and easy to visualise.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Title: {{title}}
Beginning: {{synopsis_beginning}}
Middle: {{synopsis_middle}}
End: {{synopsis_end}}

Generate exactly 30 scene beats: 9 for beginning, 12 for middle, 9 for end.
Each beat is one sentence describing what visually happens in that clip.
Return as JSON:
{
  "beginning": ["beat 1", "beat 2", ... 9 items],
  "middle": ["beat 1", ... 12 items],
  "end": ["beat 1", ... 9 items]
}`,
    notes: 'Stage 5 — generate all 30 plot card scene beats in one call',
  },
  {
    key: 'stage6_write_scenes',
    system_prompt: `You are a kids YouTube scriptwriter. Write fully realised scenes for each clip — vivid, warm, and engaging for children aged 4–8. Include what happens, what is said, the mood, and sensory details. Write in a storytelling voice.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Act: {{act}}
Scene beats (JSON): {{scene_beats_json}}

For each scene beat, write a full scene of 3–5 sentences.
Return as JSON array where each item matches the input order:
["full scene 1", "full scene 2", ...]`,
    notes: 'Stage 6 — write full scenes for all clips in an act',
  },
  {
    key: 'stage6_regenerate_scene',
    system_prompt: `You are a kids YouTube scriptwriter. Write vivid, warm, engaging scenes for children aged 4–8. Include what happens, what is said, the mood, and sensory details.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Scene beat: {{scene_beat}}
Current scene: {{current_scene}}

Rewrite this scene fresh. 3–5 sentences. Return the scene text only, no JSON.`,
    notes: 'Stage 6 — rewrite one scene card',
  },
  {
    key: 'stage7_generate_prompts',
    system_prompt: `You are an AI video prompt engineer for kids YouTube content. You translate written scenes into structured video generation prompts with precise visual and audio descriptions.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Act: {{act}}
Scenes (JSON — array of {scene_beat, written_scene}): {{scenes_json}}

For each scene, generate a structured video prompt. Return as JSON array:
[
  {
    "environment": "...",
    "characters": "...",
    "voice_over": "...",
    "spoken_text": "...",
    "sound_effects": "...",
    "music": "..."
  },
  ...
]`,
    notes: 'Stage 7 — generate video prompts for all clips in an act',
  },
  {
    key: 'stage7_regenerate_prompt',
    system_prompt: `You are an AI video prompt engineer for kids YouTube content. Create precise, vivid video generation prompts with clear visual and audio descriptions.`,
    user_template: `Character: {{character_name}}
Scene beat: {{scene_beat}}
Written scene: {{written_scene}}

Generate a fresh structured video prompt. Return as JSON:
{
  "environment": "...",
  "characters": "...",
  "voice_over": "...",
  "spoken_text": "...",
  "sound_effects": "...",
  "music": "..."
}`,
    notes: 'Stage 7 — regenerate one video prompt card',
  },
]

async function seed() {
  console.log('Seeding 9 prompts...')
  for (const prompt of PROMPTS) {
    const record = await pb.collection('kids_prompts').create(prompt)
    console.log(`Created: ${record.key}`)
  }
  console.log('Done.')
}

seed().catch(console.error)
```

- [ ] **Step 6: Run prompt seed**

```bash
npx tsx scripts/seed-prompts.ts
```

Expected: 9 "Created:" lines. Verify in PocketBase admin under `kids_prompts`.

- [ ] **Step 7: Commit**

```bash
git add lib/prompts.ts __tests__/lib/prompts.test.ts scripts/seed-prompts.ts
git commit -m "feat: add prompts helper and seed 9 initial AI prompts to kids_prompts"
```

---

## Task 9: Design system CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `app/globals.css` with the design system**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Design System ─────────────────────────────────────────── */

@layer base {
  body {
    @apply bg-zinc-950 text-white min-h-screen;
  }
}

@layer components {

  /* Buttons */
  .btn {
    @apply px-4 py-2 rounded-md font-medium text-sm transition-colors
           cursor-pointer inline-flex items-center gap-2 select-none
           border disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .btn-primary {
    @apply btn bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500;
  }
  .btn-secondary {
    @apply btn bg-white/8 hover:bg-white/12 text-white border-white/15;
  }
  .btn-ghost {
    @apply btn bg-transparent hover:bg-white/6 text-white/60
           hover:text-white border-transparent;
  }
  .btn-success {
    @apply btn bg-green-600/25 hover:bg-green-600/35 text-green-400
           border-green-500/40;
  }
  .btn-danger {
    @apply btn bg-red-600/20 hover:bg-red-600/30 text-red-400
           border-red-500/40;
  }
  .btn-sm {
    @apply text-xs px-3 py-1.5;
  }

  /* Cards */
  .card {
    @apply bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden;
  }
  .card-selected {
    @apply bg-indigo-600/10 border-indigo-500/40;
  }
  .card-header {
    @apply px-4 py-3 bg-white/[0.04] border-b border-white/8
           flex items-center justify-between;
  }
  .card-body {
    @apply p-4;
  }
  .card-footer {
    @apply px-4 py-3 border-t border-white/8
           flex items-center justify-between;
  }

  /* Sidebar */
  .sidebar {
    @apply w-52 bg-black/40 border-r border-white/8
           flex flex-col h-screen sticky top-0 shrink-0;
  }
  .sidebar-logo {
    @apply px-4 py-4 text-sm font-bold text-white/80 border-b border-white/8;
  }
  .sidebar-item {
    @apply px-3 py-2.5 text-sm rounded-lg mx-2 my-0.5
           flex items-center gap-2.5 transition-colors;
  }
  .sidebar-item-active {
    @apply sidebar-item bg-indigo-600/25 text-white
           border border-indigo-500/30;
  }
  .sidebar-item-unlocked {
    @apply sidebar-item text-white/65 hover:bg-white/6
           hover:text-white cursor-pointer border border-transparent;
  }
  .sidebar-item-locked {
    @apply sidebar-item text-white/20 cursor-not-allowed
           border border-transparent;
  }

  /* Form fields */
  .input {
    @apply w-full bg-white/5 border border-white/12 rounded-md
           px-3 py-2 text-sm text-white placeholder:text-white/25
           focus:outline-none focus:border-indigo-500/60
           focus:ring-1 focus:ring-indigo-500/30 transition-colors;
  }
  .textarea {
    @apply input resize-none leading-relaxed;
  }

  /* Typography */
  .heading-1 { @apply text-2xl font-bold text-white; }
  .heading-2 { @apply text-xl font-semibold text-white; }
  .heading-3 { @apply text-base font-semibold text-white; }

  /* Labels */
  .label {
    @apply text-xs uppercase tracking-widest text-white/35 font-medium;
  }
  .field-label {
    @apply text-xs text-white/40 mb-1 block;
  }
  .stage-label {
    @apply text-xs font-mono text-white/30;
  }
  .clip-label {
    @apply text-xs font-mono text-white/35;
  }

  /* Reference / beat line */
  .reference-text {
    @apply text-sm italic text-white/40 pl-3 border-l-2 border-white/12;
  }

  /* Page shells */
  .page-header {
    @apply flex items-center justify-between px-6 py-4
           border-b border-white/8 bg-black/20;
  }
  .page-body {
    @apply p-6;
  }

  /* Act indicator (Plotboard top bar) */
  .act-indicator {
    @apply flex items-center gap-3 text-sm;
  }
  .act-indicator-active {
    @apply font-semibold text-indigo-400;
  }
  .act-indicator-done {
    @apply text-white/40;
  }
  .act-indicator-locked {
    @apply text-white/20;
  }

  /* Character card (Stage 1) */
  .character-card {
    @apply card p-4 flex flex-col items-center gap-3 text-center
           hover:border-white/20 transition-colors;
  }
  .character-avatar {
    @apply w-16 h-16 rounded-full bg-white/10 flex items-center
           justify-content-center overflow-hidden;
  }

  /* Plotboard card */
  .plot-card {
    @apply card p-3 flex flex-col gap-2;
  }
  .plot-card-drag-handle {
    @apply text-white/20 cursor-grab active:cursor-grabbing
           hover:text-white/50 transition-colors;
  }

  /* Story card (Stage 6) */
  .story-card {
    @apply card;
  }
  .story-card-scene {
    @apply text-[0.9rem] leading-7 text-white/85 bg-white/[0.03]
           rounded-lg p-4 border border-white/8;
  }

  /* Video prompt card (Stage 7) — 3-column grid handled by layout */
  .prompt-fields-col {
    @apply flex flex-col gap-3 p-4 border-r border-white/8;
  }
  .prompt-scene-col {
    @apply p-5 border-r border-white/8;
  }
  .prompt-actions-col {
    @apply flex flex-col gap-3 p-4 justify-center;
  }

  /* Divider */
  .divider {
    @apply border-t border-white/8 my-4;
  }

  /* Stage unlock gate */
  .stage-locked-banner {
    @apply text-center py-16 text-white/30 text-sm;
  }
}
```

- [ ] **Step 2: Verify Tailwind doesn't error**

```bash
npm run build
```

Expected: build succeeds (or `npm run dev` — no CSS errors).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add class-based design system to globals.css"
```

---

## Task 10: Sidebar component

**Files:**
- Create: `components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Create `components/sidebar/Sidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const STAGES = [
  { number: 1, label: 'Characters', href: '/' },
  { number: 2, label: 'Story Idea', href: null },
  { number: 3, label: 'Titles', href: null },
  { number: 4, label: 'Synopsis', href: null },
  { number: 5, label: 'Plotboard', href: null },
  { number: 6, label: 'Story Page', href: null },
  { number: 7, label: 'Video Prompts', href: null },
]

interface SidebarProps {
  projectId?: string
  stageReached?: number
}

export default function Sidebar({ projectId, stageReached = 1 }: SidebarProps) {
  const pathname = usePathname()

  function stageHref(stageNumber: number): string | null {
    if (!projectId) return stageNumber === 1 ? '/' : null
    switch (stageNumber) {
      case 1: return '/'
      case 2: case 3: case 4: return `/project/${projectId}`
      case 5: return `/project/${projectId}/plotboard/beginning`
      case 6: return `/project/${projectId}/story/beginning`
      case 7: return `/project/${projectId}/prompts/beginning`
      default: return null
    }
  }

  function isActive(stageNumber: number): boolean {
    if (stageNumber === 1) return pathname === '/'
    const href = stageHref(stageNumber)
    return href ? pathname.startsWith(href.split('/').slice(0, -1).join('/')) : false
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">🎬 Kids Studio</div>
      <div className="flex flex-col py-2 flex-1">
        {STAGES.map((stage) => {
          const href = stageHref(stage.number)
          const unlocked = stage.number <= stageReached || stage.number === 1
          const active = isActive(stage.number)

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

- [ ] **Step 2: Commit**

```bash
git add components/sidebar/Sidebar.tsx
git commit -m "feat: add Sidebar component with stage-aware navigation"
```

---

## Task 11: Root layout with sidebar

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/sidebar/Sidebar'

export const metadata: Metadata = {
  title: 'Kids Studio',
  description: 'YouTube video production dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify layout renders in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: sidebar on the left with "Kids Studio" logo and 7 stage items. Stage 1 active, 2–7 dimmed.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: root layout with persistent sidebar"
```

---

## Task 12: CharacterCard component

**Files:**
- Create: `components/stage1/CharacterCard.tsx`

- [ ] **Step 1: Create `components/stage1/CharacterCard.tsx`**

```typescript
import Link from 'next/link'
import type { Character } from '@/lib/types'

interface CharacterCardProps {
  character: Character
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const initials = character.name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="character-card">
      <div className="character-avatar">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-white/40">{initials}</span>
        )}
      </div>

      <div>
        <div className="heading-3 text-sm">{character.name}</div>
        {character.title && (
          <div className="text-xs text-white/40 mt-0.5">{character.title}</div>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Link href={`/character/${character.id}/edit`} className="btn btn-ghost btn-sm w-full justify-center">
          Change
        </Link>
        <Link href={`/character/${character.id}/projects`} className="btn btn-secondary btn-sm w-full justify-center">
          Use →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stage1/CharacterCard.tsx
git commit -m "feat: CharacterCard component"
```

---

## Task 13: Stage 1 page — character grid

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
import { getAllCharacters } from '@/lib/characters'
import CharacterCard from '@/components/stage1/CharacterCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const characters = await getAllCharacters()

  return (
    <div>
      <div className="page-header">
        <h1 className="heading-2">Characters</h1>
      </div>
      <div className="page-body">
        <div className="grid grid-cols-5 gap-4 max-w-4xl">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: 10 character cards in a 5-column grid. Each shows initials (no avatar yet), name, title, and two buttons.

PocketBase is remote at `https://pinkmilk.pockethost.io` — no local server needed.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: Stage 1 character grid page"
```

---

## Task 14: CharacterEditPage

**Files:**
- Create: `components/stage1/CharacterEditPage.tsx`
- Create: `app/character/[id]/edit/page.tsx`

- [ ] **Step 1: Create `components/stage1/CharacterEditPage.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCharacter } from '@/lib/characters'
import type { Character } from '@/lib/types'

interface CharacterEditPageProps {
  character: Character
}

const FIELDS: Array<{ key: keyof Character; label: string; multiline?: boolean }> = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title / Role' },
  { key: 'age', label: 'Age' },
  { key: 'personality', label: 'Personality Traits', multiline: true },
  { key: 'visual_description', label: 'Visual Description', multiline: true },
  { key: 'voice_style', label: 'Voice Style' },
  { key: 'catchphrases', label: 'Catchphrases', multiline: true },
  { key: 'backstory', label: 'Backstory', multiline: true },
  { key: 'avatar_url', label: 'Avatar URL' },
]

export default function CharacterEditPage({ character }: CharacterEditPageProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Character>>({
    name: character.name,
    title: character.title,
    age: character.age,
    personality: character.personality,
    visual_description: character.visual_description,
    voice_style: character.voice_style,
    catchphrases: character.catchphrases,
    backstory: character.backstory,
    avatar_url: character.avatar_url,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateCharacter(character.id, form)
    router.push('/')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="heading-2">Edit Character</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => router.push('/')}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Character'}
          </button>
        </div>
      </div>

      <div className="page-body max-w-2xl flex flex-col gap-5">
        {FIELDS.map(({ key, label, multiline }) => (
          <div key={key}>
            <label className="field-label">{label}</label>
            {multiline ? (
              <textarea
                className="textarea"
                rows={3}
                value={(form[key] as string) || ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            ) : (
              <input
                className="input"
                type="text"
                value={(form[key] as string) || ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/character/[id]/edit/page.tsx`**

```typescript
import { getCharacter } from '@/lib/characters'
import CharacterEditPage from '@/components/stage1/CharacterEditPage'

export const dynamic = 'force-dynamic'

export default async function CharacterEditRoute({
  params,
}: {
  params: { id: string }
}) {
  const character = await getCharacter(params.id)
  return <CharacterEditPage character={character} />
}
```

- [ ] **Step 3: Verify in browser**

Click `[Change]` on any character card. Expected: edit form with all fields pre-filled. Fill in a name, click Save — returns to character grid with updated name.

- [ ] **Step 4: Commit**

```bash
git add components/stage1/CharacterEditPage.tsx app/character/[id]/edit/page.tsx
git commit -m "feat: CharacterEditPage — view and save all character fields"
```

---

## Self-Review

**Spec coverage check:**
- ✅ 2×5 character grid with avatar, name, title, [Change], [Use]
- ✅ CharacterEditPage with all editable fields
- ✅ Persistent sidebar, 7 stages, locked/active/unlocked states
- ✅ Class-based design system — all named classes in globals.css
- ✅ PocketBase collections: all 6 created with correct fields and `kids_` prefix
- ✅ TypeScript types for all collections
- ✅ `story_cards` includes video prompt fields (merged)
- ✅ `kids_prompts` collection + 9 seeded prompts with `{{placeholder}}` templates
- ✅ `buildPrompt(key, values)` helper ready for Plan 2 AI calls

**Not in Plan 1 (intentionally deferred to Plan 2):**
- Stage 1b: Project list (`/character/[id]/projects`)
- Stages 2–4: Story Idea, Titles, Synopsis
- AI integration

**Placeholder scan:** None found.

**Type consistency:** `Character`, `Project`, `Synopsis`, `PlotCard`, `StoryCard` defined once in `lib/types.ts`, imported everywhere. `updateCharacter` signature matches `Character` type.

---

## Next Plans

- **Plan 2:** `2026-04-19-plan-2-story-pipeline.md` — Stage 1b (project list), Stages 2–4 with AI
- **Plan 3:** `2026-04-19-plan-3-plotboard.md` — Stage 5 with drag-to-reorder
- **Plan 4:** `2026-04-19-plan-4-story-prompts.md` — Stages 6–7 with AI
