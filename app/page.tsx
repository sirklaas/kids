import { getAllCharacters } from '@/lib/characters'
import CharacterCard from '@/components/stage1/CharacterCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const characters = await getAllCharacters()

  return (
    <div>
      <div className="page-header">
        <h1 className="heading-2">Series</h1>
      </div>
      <div className="page-body">
        <div className="grid grid-cols-5 gap-4 max-w-4xl">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      </div>
    </div>
  )
}
