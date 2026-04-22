import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io')

const PROMPTS = [
  {
    key: 'stage2_regenerate',
    system_prompt: `You are a creative kids YouTube story director. Suggest fresh, fun, age-appropriate story directions for children aged 4–8. Each suggestion should be concrete, visual, and showcase the character's personality. Return only the story idea text — one to two sentences, no JSON, no formatting.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Current idea: {{current_idea}}

Suggest a fresh alternative story direction for a YouTube episode featuring {{character_name}}. One or two sentences only. Return the story idea text with no formatting.`,
    notes: 'Stage 2 — regenerate alternative story direction. Returns plain text.',
  },
  {
    key: 'stage3_generate_titles',
    system_prompt: `You are a kids YouTube video title writer. Titles should be catchy, exciting, and appeal to children aged 4–8 and their parents. Each title should make a child want to watch immediately. Return ONLY a valid JSON array — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}

Generate exactly 5 different title and subtitle pairs for this YouTube video.
Return ONLY a JSON array:
[{"title": "Short Catchy Title", "subtitle": "Descriptive subtitle that explains what happens"}, ...]`,
    notes: 'Stage 3 — generate 5 title+subtitle pairs. Returns JSON array.',
  },
  {
    key: 'stage3_regenerate_title',
    system_prompt: `You are a kids YouTube video title writer. Titles should be catchy, exciting, and appeal to children aged 4–8 and their parents. Return ONLY a valid JSON object — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}
Current title: {{current_title}}
Current subtitle: {{current_subtitle}}

Generate one fresh alternative title and subtitle. Return ONLY a JSON object:
{"title": "...", "subtitle": "..."}`,
    notes: 'Stage 3 — regenerate one title card. Returns JSON object.',
  },
  {
    key: 'stage4_generate_synopsis',
    system_prompt: `You are a kids YouTube story writer. Write 3 different ultra-compact 3-part story synopses for children aged 4–8 — one punchy sentence per act. Each variation should feel distinct in tone or story angle. Return ONLY a valid JSON array with 3 objects — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}
Title: {{title}}
Subtitle: {{subtitle}}

Write 3 different compact synopses for this story. Each synopsis is exactly 3 sentences — one per act (beginning, middle, end).
Make each variation feel different in tone or approach.

Return ONLY a JSON array with 3 objects:
[
  {
    "beginning": "One sentence — the setup or problem",
    "middle": "One sentence — the main action or adventure",
    "end": "One sentence — the resolution or lesson"
  },
  ...
]`,
    notes: 'Stage 4 — generate 3 synopsis variations at once. Returns JSON array of 3 objects.',
  },
  {
    key: 'stage4_regenerate_synopsis',
    system_prompt: `You are a kids YouTube story writer. Write ultra-compact 3-part story synopses for children aged 4–8 — one punchy sentence per act. Make each variation feel distinct in tone or story angle. Return ONLY a valid JSON object — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Story idea: {{story_idea}}
Title: {{title}}
Subtitle: {{subtitle}}
Angle: {{variation_angle}}

Write a compact synopsis in exactly 3 sentences — one per act — with the given angle in mind. Return ONLY a JSON object:
{
  "beginning": "One sentence — the setup or problem",
  "middle": "One sentence — the main action or adventure",
  "end": "One sentence — the resolution or lesson"
}`,
    notes: 'Stage 4 — regenerate one compact 3-sentence synopsis variation. Returns JSON object.',
  },
  {
    key: 'stage5_generate_plotboard',
    system_prompt: `You are a kids YouTube scene planner. Break down a story into individual scene beats — one sentence each — describing exactly what happens visually in that clip. Beats should be concrete, visual, and easy to film. Return ONLY a valid JSON object — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Title: {{title}}
Beginning: {{synopsis_beginning}}
Middle: {{synopsis_middle}}
End: {{synopsis_end}}

Generate exactly 30 scene beats split across three acts.
Each beat is one sentence describing a single visual moment in the video.
Return ONLY a JSON object:
{
  "beginning": ["beat 1", "beat 2", "beat 3", "beat 4", "beat 5", "beat 6", "beat 7", "beat 8", "beat 9"],
  "middle": ["beat 1", "beat 2", "beat 3", "beat 4", "beat 5", "beat 6", "beat 7", "beat 8", "beat 9", "beat 10", "beat 11", "beat 12"],
  "end": ["beat 1", "beat 2", "beat 3", "beat 4", "beat 5", "beat 6", "beat 7", "beat 8", "beat 9"]
}
The beginning array must have exactly 9 items, middle exactly 12, end exactly 9.`,
    notes: 'Stage 5 — generate all 30 plot card scene beats. Returns JSON object with 3 arrays.',
  },
  {
    key: 'stage6_write_scenes',
    system_prompt: `You are a kids YouTube scriptwriter. Write fully realised scenes for each clip — vivid, warm, and engaging for children aged 4–8. For each scene, also provide structured production details. Return ONLY a valid JSON array — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Act: {{act}}
Scene beats (JSON array): {{scene_beats_json}}

For each scene beat in the array, write a complete scene. Return ONLY a JSON array with one object per beat, in the same order:
[
  {
    "written_scene": "Full narrative scene description, 3–5 sentences, vivid and engaging for kids",
    "environment": "Visual setting for video AI (e.g. 'Bright sunny classroom with colourful posters, cartoon style')",
    "characters": "Who appears and what they are doing (e.g. '{{character_name}} wearing a red cape, arms out wide')",
    "voice_over": "Narrator text read aloud over this clip, 1–2 sentences",
    "spoken_text": "Dialogue spoken on screen by characters, or empty string if none",
    "sound_effects": "Comma-separated sound effects (e.g. 'birds chirping, footsteps on grass'), or empty string",
    "music": "Music mood for this clip (e.g. 'upbeat ukulele, playful and bouncy')"
  },
  ...
]
The array must contain exactly the same number of items as the scene_beats_json array.`,
    notes: 'Stage 6 — write full scenes for all clips in an act. Returns JSON array of scene objects.',
  },
  {
    key: 'stage6_regenerate_scene',
    system_prompt: `You are a kids YouTube scriptwriter. Write vivid, warm, engaging scene narratives for children aged 4–8. Include what happens, what is said, the mood, and sensory details. Write in a warm storytelling voice. Return ONLY the scene text — no JSON, no formatting.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Act: {{act}}
Clip: {{clip_label}}
Scene beat: {{scene_beat}}

Write a fresh scene narrative for this clip. 3–5 sentences, vivid and engaging for kids aged 4–8. Return the scene text only with no formatting or JSON.`,
    notes: 'Stage 6 — rewrite one scene card. Returns plain text.',
  },
  {
    key: 'stage7_generate_prompts',
    system_prompt: `You are a video production director creating AI video generation prompts for a kids YouTube series. Translate written scenes into precise, detailed production prompts. Return ONLY a valid JSON array — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Act: {{act}}
Scenes (JSON array with clip_label, written_scene, scene_beat for each):
{{scenes_json}}

For each scene, generate structured video production prompts. Return ONLY a JSON array with one object per scene, in the same order:
[
  {
    "environment": "Detailed visual environment for video AI — style, lighting, setting, mood (e.g. 'Bright cartoon-style park, golden afternoon light, lush green grass, cheerful atmosphere')",
    "characters": "Character appearance and action description (e.g. '{{character_name}}, energetic child with curly red hair and yellow raincoat, jumping in puddles with a big grin')",
    "voice_over": "Full narration text to be spoken over this clip by the narrator",
    "spoken_text": "Dialogue spoken on screen by characters, or empty string",
    "sound_effects": "Specific sound effects (e.g. 'splash of puddle, children laughing, light rain'), or empty string",
    "music": "Music description with mood and style (e.g. 'playful ukulele melody, bright and cheerful, 110 BPM')"
  },
  ...
]
The array must contain exactly the same number of items as the input scenes array.`,
    notes: 'Stage 7 — generate video prompts for all clips in an act. Returns JSON array of prompt objects.',
  },
  {
    key: 'stage7_regenerate_prompt',
    system_prompt: `You are a video production director creating AI video generation prompts for a kids YouTube series. Create precise, vivid prompts for a single clip. Return ONLY a valid JSON object — no markdown, no explanation.`,
    user_template: `Character: {{character_name}}
Profile: {{character_profile}}
Act: {{act}}
Clip: {{clip_label}}
Scene beat: {{scene_beat}}
Written scene: {{written_scene}}

Generate fresh structured video production prompts for this clip. Return ONLY a JSON object:
{
  "environment": "Detailed visual environment for video AI — style, lighting, setting, mood",
  "characters": "Character appearance and action description",
  "voice_over": "Full narration text to be spoken over this clip",
  "spoken_text": "Dialogue spoken on screen, or empty string",
  "sound_effects": "Sound effects needed, or empty string",
  "music": "Music description with mood and style"
}`,
    notes: 'Stage 7 — regenerate one video prompt card. Returns JSON object.',
  },
  // Series/Character Generation Prompts
  {
    key: 'character_generate',
    stage: 1,
    system_prompt: `You are a creative character designer for children's animated series. 
Generate unique, memorable characters that would appeal to children ages 3-8.
Characters should have distinct personalities, visual appeal, and potential for interesting storylines.
Always provide detailed descriptions that can be used for both storytelling and image generation.`,
    user_template: `Generate a character based on the following specifications:

Character Type: {{character_type}}
Personality Type: {{personality_type}}
Series Description: {{series_description}}

Please provide:
1. Name (memorable and appropriate for children)
2. Visual appearance (detailed description for image generation)
3. Age group (toddler, child, teen, adult, elder)
4. Personality traits (3-4 key traits)
5. Catchphrase (short, memorable)
6. Voice style (speaking characteristics)
7. Backstory (2-3 sentences)

Format the response in a structured way that can be parsed into the character fields.`,
  },
  {
    key: 'nano_banana_prompt',
    stage: 1,
    system_prompt: `You are an expert at writing image generation prompts for AI video tools like Nano Banana.
Create vivid, detailed prompts that describe characters for consistent image generation.
Focus on visual appearance, style, lighting, and camera angle.`,
    user_template: `Generate a Nano Banana image generation prompt for the following character:

Name: {{name}}
Visual Appearance: {{visual_appearance}}
Age Group: {{age_group}}
Personality: {{personality_traits}}
Series Style: {{series_description}}

Write a single paragraph prompt (50-100 words) that describes:
- Physical appearance in detail
- Clothing/outfit
- Expression and pose
- Art style (bright cel-shaded animation, kids cartoon style)
- Lighting and background hint

The prompt should be suitable for consistent character generation across multiple scenes.`,
  },
  {
    key: 'series_characters_batch',
    stage: 1,
    system_prompt: `You are a creative character designer for children's animated series.
Generate {{count}} distinct characters that work well together as an ensemble cast.
Characters should have complementary personalities, diverse appearances, and clear roles (leader, sidekick, comic relief, etc.).
Ensure they would have great chemistry together in stories.`,
    user_template: `Generate {{count}} characters for a series with the following description:

{{series_description}}

Character Types: {{character_types}}
Personality Mix: {{personality_types}}

For each character provide:
- Name
- Role in the group
- Visual description
- Key personality trait
- Relationship to other characters

Make sure the characters feel like they belong together and would create interesting story dynamics.`,
  },
]

async function upsertPrompt(data: typeof PROMPTS[number]) {
  try {
    const existing = await pb
      .collection('kids_prompts')
      .getFirstListItem(`key = "${data.key}"`)
    await pb.collection('kids_prompts').update(existing.id, data)
    console.log(`Updated: ${data.key}`)
  } catch {
    await pb.collection('kids_prompts').create(data)
    console.log(`Created: ${data.key}`)
  }
}

async function seed() {
  console.log(`Seeding ${PROMPTS.length} prompts to ${pb.baseURL}...`)
  for (const prompt of PROMPTS) {
    await upsertPrompt(prompt)
  }
  console.log('Done.')
}

seed().catch(console.error)
