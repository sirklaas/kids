/**
 * Creates all 6 kids_ collections on the remote PocketBase instance.
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
  const data = await res.json() as any
  if (!data.token) throw new Error(`Auth failed: ${JSON.stringify(data)}`)
  return data.token
}

async function createOrGet(token: string, body: object): Promise<{ id: string; name: string }> {
  const name = (body as any).name

  // Check if already exists
  const check = await fetch(`${PB_URL}/api/collections/${name}`, {
    headers: { Authorization: token },
  })
  if (check.ok) {
    const existing = await check.json() as any
    console.log(`⚠️  Already exists: ${name} (${existing.id})`)
    return { id: existing.id, name: existing.name }
  }

  const res = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(body),
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(`Failed to create ${name}: ${JSON.stringify(data)}`)
  console.log(`✅ Created: ${name} (${data.id})`)
  return { id: data.id, name: data.name }
}

function textField(name: string, required = false) {
  return { name, type: 'text', required, options: {} }
}
function numberField(name: string, min?: number, max?: number) {
  return { name, type: 'number', required: false, options: { min: min ?? null, max: max ?? null } }
}
function boolField(name: string) {
  return { name, type: 'bool', required: false, options: {} }
}
function selectField(name: string, values: string[]) {
  return { name, type: 'select', required: false, options: { maxSelect: 1, values } }
}
function relationField(name: string, collectionId: string) {
  return {
    name, type: 'relation', required: false,
    options: { collectionId, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: [] },
  }
}

const OPEN_RULES = { listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '' }

async function main() {
  console.log('🔐 Authenticating...')
  const token = await adminAuth()
  console.log('✅ Authenticated\n')

  // 1. kids_characters — no relations
  const chars = await createOrGet(token, {
    name: 'kids_characters',
    type: 'base',
    schema: [
      textField('name', true),
      textField('title'),
      textField('avatar_url'),
      textField('age'),
      textField('personality'),
      textField('visual_description'),
      textField('voice_style'),
      textField('catchphrases'),
      textField('backstory'),
    ],
    ...OPEN_RULES,
  })

  // 2. kids_projects — relation to kids_characters
  const projects = await createOrGet(token, {
    name: 'kids_projects',
    type: 'base',
    schema: [
      relationField('character_id', chars.id),
      textField('story_idea'),
      textField('selected_title'),
      textField('selected_subtitle'),
      numberField('stage_reached', 2, 7),
      selectField('status', ['in_progress', 'completed']),
    ],
    ...OPEN_RULES,
  })

  // 3. kids_synopses — relation to kids_projects
  await createOrGet(token, {
    name: 'kids_synopses',
    type: 'base',
    schema: [
      relationField('project_id', projects.id),
      textField('title'),
      textField('subtitle'),
      textField('beginning'),
      textField('middle'),
      textField('end'),
      boolField('selected'),
    ],
    ...OPEN_RULES,
  })

  // 4. kids_plot_cards — relation to kids_projects
  const plotCards = await createOrGet(token, {
    name: 'kids_plot_cards',
    type: 'base',
    schema: [
      relationField('project_id', projects.id),
      selectField('act', ['beginning', 'middle', 'end']),
      numberField('order'),
      textField('scene_beat'),
      numberField('duration_sec'),
    ],
    ...OPEN_RULES,
  })

  // 5. kids_story_cards — relations to kids_plot_cards + kids_projects
  await createOrGet(token, {
    name: 'kids_story_cards',
    type: 'base',
    schema: [
      relationField('plot_card_id', plotCards.id),
      relationField('project_id', projects.id),
      textField('written_scene'),
      textField('environment'),
      textField('characters'),
      textField('voice_over'),
      textField('spoken_text'),
      textField('sound_effects'),
      textField('music'),
    ],
    ...OPEN_RULES,
  })

  // 6. kids_prompts — no relations
  await createOrGet(token, {
    name: 'kids_prompts',
    type: 'base',
    schema: [
      textField('key', true),
      textField('system_prompt', true),
      textField('user_template', true),
      textField('notes'),
    ],
    ...OPEN_RULES,
  })

  console.log('\n🎉 All 6 collections ready!')
}

main().catch(console.error)
