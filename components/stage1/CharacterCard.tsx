import Link from 'next/link'
import type { Character } from '@/lib/types'

interface CharacterCardProps {
  character: Character
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const initials = character.name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="character-card">
      <div className="character-avatar">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-white/40">{initials}</span>
        )}
      </div>

      <div>
        <div className="heading-3 text-sm">{character.name}</div>
        {character.title && (
          <div className="text-xs text-white/40 mt-0.5">{character.title}</div>
        )}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Link
          href={`/character/${character.id}/edit`}
          className="btn btn-ghost btn-sm w-full justify-center"
        >
          Change
        </Link>
        <Link
          href={`/character/${character.id}/projects`}
          className="btn btn-secondary btn-sm w-full justify-center"
        >
          Use →
        </Link>
      </div>
    </div>
  )
}
