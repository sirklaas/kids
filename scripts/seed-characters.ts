import PocketBase from 'pocketbase'

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io')

const CHARACTERS = [
  { name: 'WackyWilliam', title: 'The Explorer', avatar_url: '' },
  { name: 'Daisy', title: 'The Dreamer', avatar_url: '' },
  { name: 'FoxyFinn', title: 'The Trickster', avatar_url: '' },
  { name: 'BraveBella', title: 'The Hero', avatar_url: '' },
  { name: 'SleepySam', title: 'The Thinker', avatar_url: '' },
  { name: 'LuckyLeo', title: 'The Adventurer', avatar_url: '' },
  { name: 'MagicMia', title: 'The Inventor', avatar_url: '' },
  { name: 'CuriousCarlo', title: 'The Scientist', avatar_url: '' },
  { name: 'HappyHana', title: 'The Artist', avatar_url: '' },
  { name: 'TinyTom', title: 'The Storyteller', avatar_url: '' },
]

async function seed() {
  console.log('Seeding 10 characters...')
  for (const char of CHARACTERS) {
    const record = await pb.collection('kids_characters').create(char)
    console.log(`Created: ${record.name} (${record.id})`)
  }
  console.log('Done.')
}

seed().catch(console.error)
