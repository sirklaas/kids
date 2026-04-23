/**
 * Create missing kids collections
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
  return data.items as Array<{ id: string; name: string; schema: any[] }>
}

async function createCollection(token: string, body: object) {
  const res = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

async function main() {
  const token = await adminAuth()
  let collections = await listCollections(token)
  const exists = (name: string) => collections.some(c => c.name === name)
  
  console.log('Found collections:', collections.filter(c => c.name.startsWith('kids_')).map(c => c.name).join(', '))
  
  let projects = collections.find(c => c.name === 'kids_projects')
  let plotCards = collections.find(c => c.name === 'kids_plot_cards')
  
  // 1. kids_projects - check existence and refresh if needed
  if (!projects) {
    console.log('⚠️  kids_projects not in list, refreshing...')
    collections = await listCollections(token)
    projects = collections.find(c => c.name === 'kids_projects')
  }
  if (projects) {
    console.log('✅ kids_projects exists')
  } else {
    console.log('❌ kids_projects still not found, something is wrong')
    return
  }
  
  // 2. Create kids_synopses if missing
  if (!exists('kids_synopses')) {
    console.log('📝 Creating kids_synopses...')
    const projectsColl = collections.find(c => c.name === 'kids_projects') || await listCollections(token).then(cols => cols.find(c => c.name === 'kids_projects'))
    await createCollection(token, {
      name: 'kids_synopses',
      type: 'base',
      schema: [
        { name: 'project_id', type: 'relation', required: true, options: { collectionId: projectsColl!.id, cascadeDelete: true, minSelect: null, maxSelect: 1, displayFields: [] } },
        { name: 'title', type: 'text', required: false, options: {} },
        { name: 'subtitle', type: 'text', required: false, options: {} },
        { name: 'variation_label', type: 'select', required: false, options: { maxSelect: 1, values: ['A', 'B', 'C'] } },
        { name: 'beginning', type: 'text', required: false, options: {} },
        { name: 'middle', type: 'text', required: false, options: {} },
        { name: 'end', type: 'text', required: false, options: {} },
      ],
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
    })
    console.log('✅ Created kids_synopses')
  } else {
    console.log('✅ kids_synopses exists')
  }
  
  // 3. Create kids_plot_cards if missing
  if (!plotCards) {
    console.log('📝 Creating kids_plot_cards...')
    const projectsColl = collections.find(c => c.name === 'kids_projects') || await listCollections(token).then(cols => cols.find(c => c.name === 'kids_projects'))
    const plotCardsColl = await createCollection(token, {
      name: 'kids_plot_cards',
      type: 'base',
      schema: [
        { name: 'project_id', type: 'relation', required: true, options: { collectionId: projectsColl!.id, cascadeDelete: true, minSelect: null, maxSelect: 1, displayFields: [] } },
        { name: 'act', type: 'select', required: false, options: { maxSelect: 1, values: ['beginning', 'middle', 'end'] } },
        { name: 'order', type: 'number', required: true, options: {} },
        { name: 'scene_beat', type: 'text', required: false, options: {} },
        { name: 'duration_sec', type: 'number', required: false, options: {} },
      ],
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
    })
    console.log('✅ Created kids_plot_cards')
  } else {
    console.log('✅ kids_plot_cards exists')
  }
  
  // 4. Create kids_story_cards if missing
  if (!exists('kids_story_cards')) {
    console.log('📝 Creating kids_story_cards...')
    const collections2 = await listCollections(token)
    const projectsColl = collections2.find(c => c.name === 'kids_projects')!
    const plotCardsColl = collections2.find(c => c.name === 'kids_plot_cards')!
    await createCollection(token, {
      name: 'kids_story_cards',
      type: 'base',
      schema: [
        { name: 'project_id', type: 'relation', required: true, options: { collectionId: projectsColl.id, cascadeDelete: true, minSelect: null, maxSelect: 1, displayFields: [] } },
        { name: 'plot_card_id', type: 'relation', required: true, options: { collectionId: plotCardsColl.id, cascadeDelete: true, minSelect: null, maxSelect: 1, displayFields: [] } },
        { name: 'act', type: 'select', required: false, options: { maxSelect: 1, values: ['beginning', 'middle', 'end'] } },
        { name: 'clip_label', type: 'text', required: false, options: {} },
        { name: 'written_scene', type: 'text', required: false, options: {} },
        { name: 'environment', type: 'text', required: false, options: {} },
        { name: 'characters', type: 'text', required: false, options: {} },
        { name: 'voice_over', type: 'text', required: false, options: {} },
        { name: 'spoken_text', type: 'text', required: false, options: {} },
        { name: 'sound_effects', type: 'text', required: false, options: {} },
        { name: 'music', type: 'text', required: false, options: {} },
      ],
      listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: ''
    })
    console.log('✅ Created kids_story_cards')
  } else {
    console.log('✅ kids_story_cards exists')
  }
  
  console.log('\n🎉 All collections ready!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
