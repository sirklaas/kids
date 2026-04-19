import TitleCard from './TitleCard'
import type { Synopsis } from '@/lib/types'

interface TitlesSectionProps {
  synopses: Synopsis[]
  characterName: string
  storyIdea: string
  onUpdateTitle: (id: string, title: string, subtitle: string) => void
  onSelectTitle: (id: string) => Promise<void>
}

export default function TitlesSection({
  synopses,
  characterName,
  storyIdea,
  onUpdateTitle,
  onSelectTitle,
}: TitlesSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="label">Stage 3 — Choose a Title</div>
      {synopses.map((synopsis) => (
        <TitleCard
          key={synopsis.id}
          synopsis={synopsis}
          characterName={characterName}
          storyIdea={storyIdea}
          onUpdate={onUpdateTitle}
          onUse={onSelectTitle}
        />
      ))}
    </div>
  )
}
