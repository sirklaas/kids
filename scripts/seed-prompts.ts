import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io')

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
