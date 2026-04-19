import PocketBase from 'pocketbase'

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pinkmilk.pockethost.io'
)

export default pb
