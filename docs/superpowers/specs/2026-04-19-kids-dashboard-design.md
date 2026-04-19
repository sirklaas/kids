# Kids YouTube Video Production Dashboard
## Design Document — 2026-04-19

---

## Design System Constraints

- **Dark theme** — neutral dark background, TBD accent color (to be decided on first running build)
- **Class-based from day one** — every reusable UI element gets its own CSS class. No ad-hoc inline styles. A change to `.btn-primary` updates every button in the app; a change to `.card` updates every card.
- Implement as a `styles/design-system.css` (or Tailwind `@layer components`) file with named classes:
  - `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`
  - `.card`, `.card-header`, `.card-body`
  - `.stage-label`, `.clip-label`, `.field-label`
  - `.heading-1`, `.heading-2`, `.heading-3`
  - `.input`, `.textarea`
  - `.sidebar`, `.sidebar-item`, `.sidebar-item-active`, `.sidebar-item-locked`
- All components reference these classes — never hardcode colors, radii, or spacing directly in component files

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Deployment | Vercel |
| Backend / Persistence | PocketBase |
| AI | Anthropic (Claude) |
| Auth | None — single-user personal tool |
| Video AI (Stage 7) | Deferred — button stubbed |

---

## Navigation

**Left sidebar** — persistent across all routes. Behaviour adapts to context:
- On `/` (character grid): sidebar shows all 7 stage labels, all dimmed except "Characters"
- Inside a project: sidebar reflects the active project — stages unlocked up to `stage_reached` are clickable, deeper stages dimmed
- Clicking a stage in the sidebar navigates directly to that stage's route for the current project

Sidebar entries:
1. Characters
2. Story Idea
3. Titles
4. Synopsis
5. Plotboard
6. Story Page
7. Video Prompts

---

## Route Map

```
/                                     → Stage 1: Character grid
/character/[id]/projects              → Character's project list (resume or new)
/project/[id]                         → Stages 2–4: Story Idea → Titles → Synopsis (progressive reveal)
/project/[id]/plotboard/beginning     → Stage 5: Beginning act (3×3)
/project/[id]/plotboard/middle        → Stage 5: Middle act (3×4)
/project/[id]/plotboard/end           → Stage 5: End act (3×3)
/project/[id]/story/[act]             → Stage 6: Story Page
/project/[id]/prompts/[act]           → Stage 7: Video Prompts
```

---

## PocketBase Collections

5 collections total, all prefixed `kids_`.

### `kids_characters`
10 fixed rows — one per character slot.

| Field | Type |
|---|---|
| name | text |
| title | text |
| avatar_url | text |
| age | text |
| personality | text |
| visual_description | text |
| voice_style | text |
| catchphrases | text |
| backstory | text |

### `kids_projects`
Many per character.

| Field | Type |
|---|---|
| character_id | relation → kids_characters |
| story_idea | text |
| selected_title | text |
| selected_subtitle | text |
| stage_reached | number (2–7) — per-project stage |
| status | select: in_progress / completed |

Display name in project list: `selected_title` if set, otherwise falls back to truncated `story_idea`.

### `kids_synopses`
5 generated per project; user selects one.

| Field | Type |
|---|---|
| project_id | relation → kids_projects |
| title | text |
| subtitle | text |
| beginning | text |
| middle | text |
| end | text |
| selected | bool |

### `kids_plot_cards`
30 per project (9 beginning + 12 middle + 9 end).

| Field | Type |
|---|---|
| project_id | relation → kids_projects |
| act | select: beginning / middle / end |
| order | number |
| scene_beat | text |
| duration_sec | number (default 15) |

### `kids_story_cards`
One per plot card. Combines written scene + video prompt fields (always 1-to-1).

| Field | Type |
|---|---|
| plot_card_id | relation → kids_plot_cards |
| project_id | relation → kids_projects |
| written_scene | text |
| environment | text |
| characters | text |
| voice_over | text |
| spoken_text | text |
| sound_effects | text |
| music | text |

### `kids_prompts`
One row per AI action. Editable via PocketBase admin UI — no code deploy needed to improve prompts.

| Field | Type | Notes |
|---|---|---|
| key | text (unique) | Identifier used by the app to load this prompt |
| system_prompt | text | System instructions sent to Claude |
| user_template | text | User message with `{{placeholder}}` variables |
| notes | text | Human description of what this prompt does |

**9 prompt keys:**

| Key | Used in | Placeholders |
|---|---|---|
| `stage2_regenerate` | Stage 2 — regenerate story direction | `{{character_name}}`, `{{character_profile}}`, `{{current_idea}}` |
| `stage3_generate_titles` | Stage 3 — generate 5 title cards | `{{character_name}}`, `{{story_idea}}` |
| `stage3_regenerate_title` | Stage 3 — regenerate one title card | `{{character_name}}`, `{{story_idea}}`, `{{current_title}}`, `{{current_subtitle}}` |
| `stage4_regenerate_synopsis` | Stage 4 — regenerate one synopsis | `{{character_name}}`, `{{story_idea}}`, `{{title}}`, `{{subtitle}}` |
| `stage5_generate_plotboard` | Stage 5 — generate all 30 scene beats | `{{character_name}}`, `{{character_profile}}`, `{{title}}`, `{{synopsis_beginning}}`, `{{synopsis_middle}}`, `{{synopsis_end}}` |
| `stage6_write_scenes` | Stage 6 — write full scenes for an act | `{{character_name}}`, `{{character_profile}}`, `{{act}}`, `{{scene_beats_json}}` |
| `stage6_regenerate_scene` | Stage 6 — rewrite one scene | `{{character_name}}`, `{{character_profile}}`, `{{scene_beat}}`, `{{current_scene}}` |
| `stage7_generate_prompts` | Stage 7 — generate video prompts for an act | `{{character_name}}`, `{{character_profile}}`, `{{act}}`, `{{scenes_json}}` |
| `stage7_regenerate_prompt` | Stage 7 — rewrite one video prompt | `{{character_name}}`, `{{scene_beat}}`, `{{written_scene}}` |

---

## Stage Descriptions

### Stage 1 — Character Selection (`/`)

- 2×5 grid of 10 `CharacterCard` components
- Each card: avatar, name, title, `[Change]` → `CharacterEditPage`, `[Use]` → navigates to `/character/[id]/projects`

**CharacterEditPage** — editable fields: name, age, personality, visual description, voice style, catchphrases, backstory.

### Stage 1b — Project List (`/character/[id]/projects`)

- Full-page list of all projects for this character
- Shows in-progress (with stage badge) and completed projects
- `[Resume]` on in-progress projects → navigates to `stage_reached` route
- `[+ New Video]` button at top → creates new project record, navigates to `/project/[id]`

### Stage 2 — Story Idea (`/project/[id]`)

Appears first on the project page.

- Character name as context label
- Free-text input for story direction
- `[Regenerate]` — AI proposes alternative
- `[Generate Titles →]` — calls AI, reveals Stage 3 below

### Stage 3 — Title Selection

Progressive reveal below Stage 2.

- 5 `TitleCard` components
- Each: editable Title, editable Subtitle, `[Regenerate This]`, `[Use →]` → reveals Stage 4

### Stage 4 — Synopsis Selection

Progressive reveal below Stage 3.

- 5 `SynopsisCard` components
- Each: Title + Subtitle, three editable sections (Beginning / Middle / End)
- `[Regenerate]`, `[Execute →]` → AI generates **all 30 plot cards** (9 beginning + 12 middle + 9 end) from the selected synopsis in a single call, then navigates to `/project/[id]/plotboard/beginning`

### Stage 5 — Plotboard (3 paginated routes)

Each act is a separate full-page route. Clean, focused.

| Route | Grid | Cards |
|---|---|---|
| `/plotboard/beginning` | 3×3 | 9 |
| `/plotboard/middle` | 3×4 | 12 |
| `/plotboard/end` | 3×3 | 9 |

**PlotCard fields:**
- Clip label (e.g. `Begin_01`)
- One editable line — scene beat
- Drag handle for reorder within act
- Editable duration (default 15s)

Act progress indicator in header: `BEGINNING · MIDDLE · END` with current highlighted.

Bottom bar: `← Back` | `▶ Execute [Act] → Story Page`

AI populates all `kids_plot_cards` for the selected act on Execute, then navigates to `/project/[id]/story/[act]`.

### Stage 6 — Story Page (`/project/[id]/story/[act]`)

Full-width stacked `StoryCard` components — one per plot card in the act.

**StoryCard layout:**
- Header: clip label (e.g. `Beginning — Clip 01`) + file name (`WackyWilliam_Begin_01`)
- Scene beat reference line (read-only, italic)
- Full AI-written prose — editable by user
- `[↻ Regenerate Scene]`
- `[Execute → Generate Video Prompt]`

Bottom bar: `← Back to Plotboard` | `▶ Execute All Scenes →`

### Stage 7 — Video Prompts (`/project/[id]/prompts/[act]`)

Full-width stacked `VideoPromptCard` components.

**VideoPromptCard — 3-column layout:**

| Column | Width | Content |
|---|---|---|
| Left | 1/4 | 6 editable prompt fields |
| Centre | 2/4 | Full written scene (readable prose) |
| Right | 1/4 | `[↻ Regenerate Prompt]` + `[▶ Send to Video AI]` |

**Prompt fields:** Environment, Characters, Voice Over, Spoken Text, Sound Effects, Music.

Written scene shown in centre at comfortable reading size — the primary readability column.

Bottom bar: `← Back to Story Page` | `▶ Send All to Video AI`

**`[Send to Video AI]`** — stubbed for now; video platform TBD.

---

## File Naming Convention

```
[CharacterName]_[Act]_[ClipNumber]
```

Examples: `WackyWilliam_Begin_01`, `WackyWilliam_Middle_07`, `WackyWilliam_End_03`

---

## Named Components

```
CharacterCard         Stage 1 grid item
CharacterEditPage     Character profile editor
StoryIdeaBar          Stage 2 input + regenerate
TitleCard             Stage 3 card (×5)
SynopsisCard          Stage 4 card (×5)
PlotCard              Stage 5 grid item
PlotBoard             Stage 5 full-page (3 route variants)
StoryCard             Stage 6 full-width card
StoryPage             Stage 6 page wrapper
VideoPromptCard       Stage 7 full-width 3-column card
VideoPromptPage       Stage 7 page wrapper
```

---

## AI Call Boundaries

AI is called only on explicit user action — never auto-advances. Every call loads its prompt from `kids_prompts` by `key`, fills `{{placeholders}}`, then calls Claude.

| Trigger | Prompt key | AI produces |
|---|---|---|
| `[Regenerate]` in Stage 2 | `stage2_regenerate` | Alternative story direction |
| `[Generate Titles →]` | `stage3_generate_titles` | 5 title + subtitle pairs |
| `[Regenerate This]` in Stage 3 | `stage3_regenerate_title` | New title + subtitle for one card |
| `[Regenerate]` in Stage 4 | `stage4_regenerate_synopsis` | New synopsis (beginning/middle/end) |
| `[Execute →]` in Stage 4 | `stage5_generate_plotboard` | All 30 scene beats (9+12+9) in one call |
| `[Execute [Act] → Story Page]` in Stage 5 | `stage6_write_scenes` | Full written scenes for that act |
| `[Execute All Scenes]` in Stage 6 | `stage7_generate_prompts` | All video prompt cards for current act |
| `[Regenerate Scene]` in Stage 6 | `stage6_regenerate_scene` | Rewrites one story card |
| `[Regenerate Prompt]` in Stage 7 | `stage7_regenerate_prompt` | Rewrites one video prompt card |

---

## Session State & Persistence

- All data stored in PocketBase
- `kids_projects.stage_reached` tracks furthest stage unlocked
- Resume: navigating to `/character/[id]/projects` shows in-progress projects with direct resume link
- No browser localStorage dependency — all state server-side in PocketBase
