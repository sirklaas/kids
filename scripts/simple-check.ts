/**
 * Simple check
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

async function main() {
  const token = await adminAuth()
  
  // Try to directly access kids_projects
  const res = await fetch(`${PB_URL}/api/collections/kids_projects`, {
    headers: { Authorization: token },
  })
  
  if (res.ok) {
    const data = await res.json()
    console.log('✅ kids_projects exists via direct access')
    console.log('ID:', data.id)
    console.log('Fields:', data.schema.map((f: any) => f.name).join(', '))
  } else {
    console.log('❌ kids_projects not accessible:', res.status)
  }
}

main().catch(console.error)
