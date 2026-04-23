/**
 * Creates all kids_ collections on the remote PocketBase instance.
 * Safe to re-run — skips collections that already exist.
 */

const PB_URL = 'https://pinkmilk.pockethost.io'
const PB_EMAIL = 'klaas@republick.nl'
const PB_PASS = 'biknu8-pyrnaB-mytvyx'

async function adminAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASS }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const data = await res.json()
  return data.token as string
}

async function listCollections(token: string) {
  const res = await fetch(`${PB_URL}/api/collections`, {
    headers: { Authorization: token },
  })
  if (!res.ok) throw new Error(`List failed: ${res.status}`)
  const data = await res.json()
  return data.items as Array<{ id: string; name: string }>
}

async function createCollection(token: string, body: object) {
  const res = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

// Helpers to build schema fields
function textField(name: string, required = false) {
  return { name, type: 'text', required, options: {} }
}
function boolField(name: string) {
  return { name, type: 'bool', required: false, options: {} }
}
function selectField(name: string, values: string[]) {
  return { name, type: 'select', required: false, options: { maxSelect: 1, values } }
}
function relationField(name: string, collectionId: string, opts: { required?: boolean; cascadeDelete?: boolean } = {}) {
  return {
    name, type: 'relation', required: opts.required ?? false,
    options: { collectionId, cascadeDelete: opts.cascadeDelete ?? false, minSelect: null, maxSelect: 1, displayFields: [] },
  }
}

async function deleteCollection(token: string, name: string) {
  try {
    const res = await fetch(`${PB_URL}/api/collections/${name}`, {
      method: 'DELETE',
      headers: { Authorization: token },
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(JSON.stringify(err))
    }
    console.log(`🗑️  Deleted: ${name}`)
  } catch (err: any) {
    console.error(`Failed to delete ${name}:`, err.message)
    throw err
  }
}

async function updateCollectionSchema(token: string, collectionId: string, newFields: any[]) {
  // Get existing collection
  const res = await fetch(`${PB_URL}/api/collections/${collectionId}`, {
    headers: { Authorization: token },
  })
  if (!res.ok) throw new Error('Failed to get collection')
  const collection = await res.json()
  
  // Merge new fields with existing schema
  const existingFieldNames = new Set(collection.schema.map((f: any) => f.name))
  const fieldsToAdd = newFields.filter(f => !existingFieldNames.has(f.name))
  
  if (fieldsToAdd.length === 0) {
    console.log(`⚠️  No new fields to add`)
    return
  }
  
  console.log(`📝 Adding ${fieldsToAdd.length} new fields:`, fieldsToAdd.map(f => f.name))
  
  const updated = await fetch(`${PB_URL}/api/collections/${collectionId}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema: [...collection.schema, ...fieldsToAdd]
    }),
  })
  
  if (!updated.ok) {
    const err = await updated.json()
    throw new Error(JSON.stringify(err))
  }
  console.log(`✅ Updated schema`)
}

async function main() {
  const token = await adminAuth()
  const existing = await listCollections(token)
  const exists = (n: string) => existing.some((c) => c.name === n)
  const createOrGet = async (name: string, body: object) => {
    if (exists(name)) {
      console.log(`⚠️  Already exists: ${name}`)
      return existing.find((c) => c.name === name)!
    }
    const created = await createCollection(token, body)
    console.log(`✅ Created: ${name}`)
    return created
  }

  const OPEN_RULES = { listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '' }

  // 1. kids_characters — standalone character definitions
  const characters = await createOrGet('kids_characters', {
    name: 'kids_characters',
    type: 'base',
    schema: [
      textField('name', true),
      textField('visual_appearance'), // CHANGED from visual_description
      selectField('age_group', ['toddler', 'child', 'teen', 'adult', 'elder']),
      textField('personality'),
      textField('catchphrases'),
      textField('voice_style'),
      textField('backstory'),
      textField('nano_banana_prompt'),
      textField('character_type'),
      textField('personality_type'),
    ],
    ...OPEN_RULES,
  })

  function numberField(name: string, opts: { min?: number; max?: number; default?: number } = {}) {
  return { name, type: 'number', required: false, options: { min: opts.min ?? 1, max: opts.max ?? 50, default: opts.default } }
}

// 1b. kids_series — standalone series collection
  const seriesSchema = [
    textField('name', true),
    textField('description'),
    textField('image_url'),
    numberField('beginning_scenes', { min: 1, max: 50 }),
    numberField('middle_scenes', { min: 1, max: 50 }),
    numberField('end_scenes', { min: 1, max: 50 }),
  ]
  
  let series
  if (exists('kids_series')) {
    console.log('⚠️  kids_series exists, updating schema...')
    const existingSeries = existing.find(c => c.name === 'kids_series')!
    await updateCollectionSchema(token, existingSeries.id, seriesSchema)
    series = existingSeries
  } else {
    series = await createOrGet('kids_series', {
      name: 'kids_series',
      type: 'base',
      schema: seriesSchema,
      ...OPEN_RULES,
    })
  }

  // 1c. kids_series_characters — link table between series and characters
  await createOrGet('kids_series_characters', {
    name: 'kids_series_characters',
    type: 'base',
    schema: [
      relationField('series_id', series.id, { required: true, cascadeDelete: true }),
      relationField('character_id', characters.id, { required: true, cascadeDelete: false }),
      { name: 'character_order', type: 'number', required: true, options: { min: 1, max: 8 } },
      boolField('is_main_character'),
    ],
    ...OPEN_RULES,
  })

  // 2. kids_projects — Skip if exists (don't delete to preserve data)
  let projects
  if (exists('kids_projects')) {
    console.log('⚠️  kids_projects exists, skipping')
    projects = existing.find((c) => c.name === 'kids_projects')!
  } else {
    projects = await createCollection(token, {
      name: 'kids_projects',
      type: 'base',
      schema: [
        relationField('series_id', series.id),
        textField('story_idea'),
        textField('selected_title'),
        textField('selected_subtitle'),
        { name: 'stage_reached', type: 'number', required: false, options: {} },
        selectField('status', ['in_progress', 'completed']),
      ],
      ...OPEN_RULES,
    })
    console.log(`✅ Created: kids_projects`)
  }

  // 3. kids_synopses — Skip if exists
  if (!exists('kids_synopses')) {
    await createCollection(token, {
      name: 'kids_synopses',
      type: 'base',
      schema: [
        relationField('project_id', projects.id, { required: true, cascadeDelete: true }),
        textField('title'),
        textField('subtitle'),
        selectField('variation_label', ['A', 'B', 'C']),
        textField('beginning'),
        textField('middle'),
        textField('end'),
      ],
      ...OPEN_RULES,
    })
    console.log(`✅ Created: kids_synopses`)
  }

  // 4. kids_plot_cards — beats per act
  let plotCards
  if (exists('kids_plot_cards')) {
    console.log('⚠️  kids_plot_cards exists, skipping')
    plotCards = existing.find((c) => c.name === 'kids_plot_cards')!
  } else {
    plotCards = await createCollection(token, {
      name: 'kids_plot_cards',
      type: 'base',
      schema: [
        relationField('project_id', projects.id, { required: true, cascadeDelete: true }),
        selectField('act', ['beginning', 'middle', 'end']),
        { name: 'order', type: 'number', required: true, options: {} },
        textField('scene_beat'),
        { name: 'duration_sec', type: 'number', required: false, options: {} },
      ],
      ...OPEN_RULES,
    })
    console.log(`✅ Created: kids_plot_cards`)
  }

  // 5. kids_story_cards — text per clip
  const storyCardsSchema = [
    relationField('project_id', projects.id, { required: true, cascadeDelete: true }),
    relationField('plot_card_id', plotCards.id, { required: true, cascadeDelete: true }),
    selectField('act', ['beginning', 'middle', 'end']),
    textField('clip_label'),
    textField('written_scene'),
    textField('environment'),
    textField('characters'),
    textField('voice_over'),
    textField('spoken_text'),
    textField('sound_effects'),
    textField('music'),
  ]
  
  if (exists('kids_story_cards')) {
    console.log('⚠️  kids_story_cards exists, updating schema...')
    const existingCards = existing.find(c => c.name === 'kids_story_cards')!
    await updateCollectionSchema(token, existingCards.id, storyCardsSchema)
  } else {
    await createOrGet('kids_story_cards', {
      name: 'kids_story_cards',
      type: 'base',
      schema: storyCardsSchema,
      ...OPEN_RULES,
    })
  }

  // 6. kids_prompts — AI prompt templates
  await createOrGet('kids_prompts', {
    name: 'kids_prompts',
    type: 'base',
    schema: [
      textField('key', true),
      { name: 'stage', type: 'number', required: false, options: {} },
      textField('system_prompt'),
      textField('user_template'),
      textField('notes'),
    ],
    ...OPEN_RULES,
  })

  console.log('\n🎉 All collections ready!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
