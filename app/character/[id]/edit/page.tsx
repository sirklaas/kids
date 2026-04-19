import { getCharacter } from '@/lib/characters'
import CharacterEditPage from '@/components/stage1/CharacterEditPage'

export const dynamic = 'force-dynamic'

export default async function CharacterEditRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const character = await getCharacter(id)
  return <CharacterEditPage character={character} />
}
