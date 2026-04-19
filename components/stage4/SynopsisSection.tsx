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
  const sharedTitle = synopses[0]?.title
  const sharedSubtitle = synopses[0]?.subtitle
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="shrink-0">
        <div className="label">Stage 4 — Choose a Synopsis</div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '12px',
          flex: 1,
          minHeight: 0,
        }}
      >
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
