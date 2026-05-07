import SynopsisCard from './SynopsisCard'
import type { Synopsis } from '@/lib/types'

interface SynopsisSectionProps {
  synopses: Synopsis[]
  characterName: string
  storyIdea: string
  onUpdateSynopsis: (id: string, data: Pick<Synopsis, 'beginning' | 'middle' | 'end'>) => void
  onExecuteSynopsis: (id: string) => Promise<void>
  onGenerateSynopses: () => Promise<void>
  isGenerating?: boolean
}

export default function SynopsisSection({
  synopses,
  characterName,
  storyIdea,
  onUpdateSynopsis,
  onExecuteSynopsis,
  onGenerateSynopses,
  isGenerating,
}: SynopsisSectionProps) {
  const sharedTitle = synopses[0]?.title
  const sharedSubtitle = synopses[0]?.subtitle
  
  if (synopses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="card text-center p-12 max-w-xl mx-auto w-full border-dashed border-white/20 bg-white/5">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="heading-2 mb-2">Clean Sheet</h2>
          <p className="text-body text-white/60 mb-8">
            Your title is locked in. Ready to brainstorm the story?
          </p>
          <button
            className="btn btn-primary px-8 py-3 text-lg h-auto"
            onClick={onGenerateSynopses}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating variations...' : 'Generate 4 Synopsis Angles'}
          </button>
        </div>
      </div>
    )
  }

  // Check for empty synopses
  const emptyCount = synopses.filter(s => !s.beginning && !s.middle && !s.end).length
  const hasContent = synopses.some(s => s.beginning || s.middle || s.end)
  
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="shrink-0">
        <div className="label">Stage 4 — Choose a Synopsis</div>
        {sharedTitle && (
          <div className="text-sm text-white/60 mt-1">
            Title: <span className="text-white/80">{sharedTitle}</span>
          </div>
        )}
        {hasContent && (
          <div className="text-xs text-green-400 mt-1">
            ✅ {synopses.length - emptyCount} of {synopses.length} synopses have content
          </div>
        )}
        {emptyCount > 0 && emptyCount === synopses.length && (
          <div className="text-xs text-red-400 mt-1">
            ⚠️ All synopses are empty - check console for AI errors
          </div>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '1.5rem',
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
