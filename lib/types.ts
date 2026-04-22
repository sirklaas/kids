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
  nano_banana_prompt?: string
  character_type?: string
  personality_type?: string
}

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

export interface Project {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  series_id: string
  story_idea: string
  selected_title: string
  selected_subtitle: string
  stage_reached: number
  status: 'in_progress' | 'completed'
  expand?: { series_id?: Series }
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
