# Multi-Character Series Design

**Date:** 2026-04-21  
**Status:** Approved for implementation  
**Branch:** `feature/multi-character-video-pipeline`

---

## Overview

Transform the single-character workflow into a multi-character series system where each series can contain 1-8 characters. Each character has full profile data plus an AI-generated Nano Banana prompt for video generation.

---

## User Flow

### 1. Series Page (Home)
- Grid of 10 series slots (replaces character grid)
- Each card: Series name + preview of characters (avatars)
- Actions: Create Series, Edit Series, Continue to Story

### 2. Edit Series Wizard (3 Steps)

**Step 1: Series Info**
- Series name (text)
- Series description (textarea)
  - Example: "A serie about a bear called @Paddington - He is always looking for honey - his two friends are @Tiger and @Igor"
- [Next: Characters] button

**Step 2: Character Builder**
- Character grid (1-8 slots)
- Each slot shows: avatar, name, role (Main/Sidekick)
- [+ Add Character] button (appears in empty slots)
- Click character to edit or [×] to remove
- [Save Series & Continue] button

**Step 3: AI Character Generator (Modal)**
When adding a character:
- Character Type: [Animal/Human/Creature/Vehicle/Other ▼] + manual input option
- Personality: [Brave/Funny/Shy/Clever/Adventurous/Other ▼] + manual input option  
- Name Idea: [optional text input]
- [Generate with AI] button
- Preview panel showing generated:
  - Name, Title, Visual Description, Personality, Voice Style, Catchphrases, Backstory
- [Regenerate] or [Use This Character] buttons

**Step 4: Nano Banana Prompt Generator (Per Character)**
- After character creation, show [Generate Nano Banana Prompt] button
- Generates image generation prompt for Nano Banana
- Output: Plain text prompt optimized for character consistency
- [Copy to Clipboard] [Download .txt]

---

## Database Schema Changes

### New Collection: `kids_series`
```typescript
{
  id: string
  name: string
  description: string
  image_url?: string
  created: string
  updated: string
}
```

### New Collection: `kids_series_characters` (Link Table)
```typescript
{
  id: string
  series_id: string        // relation to kids_series
  character_id: string     // relation to kids_characters
  character_order: number  // 1-8 (display order)
  is_main_character: boolean
  created: string
  updated: string
}
```

### Updated: `kids_characters`
```typescript
{
  // ... existing fields ...
  nano_banana_prompt?: string  // AI generated image prompt
  character_type?: string      // Animal/Human/Creature/Vehicle/Other
  personality_type?: string    // Brave/Funny/Shy/Clever/Adventurous/Other
}
```

### Updated: `kids_projects`
```typescript
{
  // ... existing fields ...
  // REMOVED: character_id: string
  // ADDED:
  series_id: string            // relation to kids_series
}
```

---

## API Prompts

### 1. Generate Character (`stage1_generate_character`)
**System:**
```
You are a creative character designer for kids YouTube videos (ages 4-8).
Create memorable, visual characters that children will love.
Return valid JSON only.
```

**User Template:**
```
Character Type: {{character_type}}
Personality: {{personality}}
Name Idea: {{name_idea}}

Create a complete character profile:
- name: Catchy, memorable name
- title: Descriptive title (e.g., "The Brave Bunny")
- visual_description: Detailed description for image generation (appearance, colors, clothing)
- personality: Key personality traits
- voice_style: How they speak (tone, catchphrases, speech patterns)
- catchphrases: Array of 2-3 signature lines
- backstory: 1 paragraph origin story
- age: Character's age in story

Return JSON:
{
  "name": "...",
  "title": "...",
  "visual_description": "...",
  "personality": "...",
  "voice_style": "...",
  "catchphrases": ["...", "..."],
  "backstory": "...",
  "age": "..."
}
```

### 2. Generate Nano Banana Prompt (`stage1_generate_nano_prompt`)
**System:**
```
You are an AI image prompt engineer specializing in character consistency.
Create detailed prompts for Nano Banana or similar character generation tools.
Focus on: clear visual identity, consistent style, neutral poses for rigging.
```

**User Template:**
```
Character Data:
Name: {{name}}
Visual: {{visual_description}}
Personality: {{personality}}
Age: {{age}}

Create a character generation prompt with:
- Full visual description optimized for AI image generation
- Style specification (3D render, Disney/Pixar style, highly detailed)
- Neutral standing pose for character rigging
- Clean background (studio lighting, solid color)
- Consistent features for multiple image generations

Return plain text prompt only (no JSON, no markdown).
```

---

## Component Structure

```
app/
  page.tsx                          # Series grid (replaces characters)
  
  series/
    [id]/
      edit/
        page.tsx                    # Edit Series wizard container
        Step1SeriesInfo.tsx         # Series name/description
        Step2CharacterBuilder.tsx   # Character grid + add/remove
        Step3AIGenerator.tsx        # AI character modal
    
  character/
    [id]/
      nano-prompt/
        page.tsx                    # Nano Banana prompt generator
        
components/stage1/
  SeriesCard.tsx                      # Series grid card
  CharacterCardMini.tsx               # Small character preview
  AIGeneratorModal.tsx                # Character generation UI
  NanoBananaPrompt.tsx                # Prompt generator UI
  
lib/
  series.ts                           # CRUD helpers for series
  series-characters.ts                # Link table helpers
  prompts.ts                          # Add new prompt keys
```

---

## UI Design Notes

- Use existing purple/gold color scheme (#4F1271, #e9c46a)
- Character avatars: 48x48px circles with gradient backgrounds
- Character grid: 4 columns max, responsive
- AI Generator modal: 600px wide, glassmorphism style
- Nano Banana output: monospace font, copy button with feedback

---

## Migration Plan

1. **Database:**
   - Create `kids_series` collection
   - Create `kids_series_characters` link table
   - Add fields to `kids_characters`
   - Update `kids_projects` (character_id → series_id)

2. **Data Migration:**
   - Existing characters become series with 1 character
   - Character names become series names initially
   - User can later merge characters into multi-character series

3. **Code Migration:**
   - Update all `character_id` references to `series_id`
   - Update components to use series data
   - Add character expansion in queries

---

## Success Criteria

- [ ] Can create series with 1-8 characters
- [ ] AI generates complete character profiles
- [ ] Each character has Nano Banana prompt
- [ ] Series flows through all 7 stages (Story Idea → Video Prompts)
- [ ] Video prompts include all characters appropriately
- [ ] Backward compatible with existing single-character projects

---

## Next Step

Proceed to `writing-plans` skill to create detailed implementation plan.
