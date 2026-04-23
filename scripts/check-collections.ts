/**
 * Check what collections exist
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
  
  console.log('Collections:')
  collections.forEach(c => console.log(`  - ${c.name}`))
  
  const storyCards = collections.find(c => c.name === 'kids_story_cards')
  if (storyCards) {
    console.log('\n✅ kids_story_cards exists')
    const res = await fetch(`${PB_URL}/api/collections/${storyCards.id}`, {
      headers: { Authorization: token },
    })
    const collection = await res.json()
    console.log('Fields:', collection.schema.map((f: any) => f.name).join(', '))
  } else {
    console.log('\n❌ kids_story_cards does NOT exist')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
