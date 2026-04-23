/**
 * Add plot_card_id field to kids_story_cards
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

async function main() {
  const token = await adminAuth()
  const collections = await listCollections(token)
  
  const storyCards = collections.find(c => c.name === 'kids_story_cards')
  if (!storyCards) {
    console.log('❌ kids_story_cards not found')
    return
  }
  
  const plotCards = collections.find(c => c.name === 'kids_plot_cards')
  if (!plotCards) {
    console.log('❌ kids_plot_cards not found')
    return
  }
  
  // Get current schema
  const res = await fetch(`${PB_URL}/api/collections/${storyCards.id}`, {
    headers: { Authorization: token },
  })
  if (!res.ok) throw new Error('Failed to get collection')
  const collection = await res.json()
  
  // Check if field already exists
  const hasField = collection.schema.some((f: any) => f.name === 'plot_card_id')
  if (hasField) {
    console.log('✅ plot_card_id already exists')
    return
  }
  
  // Add the new field
  const newField = {
    name: 'plot_card_id',
    type: 'relation',
    required: true,
    options: {
      collectionId: plotCards.id,
      cascadeDelete: true,
      minSelect: null,
      maxSelect: 1,
      displayFields: []
    }
  }
  
  console.log('📝 Adding plot_card_id field...')
  const updated = await fetch(`${PB_URL}/api/collections/${storyCards.id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema: [...collection.schema, newField]
    }),
  })
  
  if (!updated.ok) {
    const err = await updated.json()
    throw new Error(JSON.stringify(err))
  }
  
  console.log('✅ Added plot_card_id field successfully!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
