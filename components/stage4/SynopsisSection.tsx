import SynopsisCard from './SynopsisCard'
import type { Synopsis } from '@/lib/types'

interface SynopsisSectionProps {
  synopses: Synopsis[]
  characterName: string
  storyIdea: string
  onUpdateSynopsis: (id: string, data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>) => void
  onExecuteSynopsis: (id: string) => Promise<void>
}

export default function SynopsisSection({
  synopses,
  characterName,
  storyIdea,
  onUpdateSynopsis,
  onExecuteSynopsis,
}: SynopsisSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="label">Stage 4 — Choose a Synopsis</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-start">
      {synopses.map((synopsis) => (
        <SynopsisCard
          key={synopsis.id}
          synopsis={synopsis}
          characterName={characterName}
          storyIdea={storyIdea}
          onUpdate={onUpdateSynopsis}
          onExecute={onExecuteSynopsis}
        />
      ))}
      </div>
    </div>
  )
}
