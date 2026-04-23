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
  // Check if all titles are empty
  const allEmpty = synopses.every(s => !s.title && !s.subtitle)

  return (
    <div className="flex flex-col gap-3">
      <div className="label">Stage 3 — Choose a Title</div>

      {synopses.length === 0 && (
        <div className="card text-center py-8 text-white/50">
          📭 No titles yet. Go back to Stage 2 and click "Generate Titles"
        </div>
      )}

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

      {synopses.length > 0 && allEmpty && (
        <div className="card text-center py-4 bg-red-500/10 border-red-500/30 mt-3">
          <div className="text-red-400 text-sm">
            ⚠️ AI generated empty titles. Try clicking "Generate Titles" again.
          </div>
        </div>
      )}
    </div>
  )
}
