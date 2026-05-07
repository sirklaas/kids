'use client'

import type { StoryCard as StoryCardType, Act } from '@/lib/types'

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

interface StoryCardProps {
  card: StoryCardType
  onUpdate: (id: string, writtenScene: string) => void
  onRegenerate: (id: string) => void
  onGeneratePrompt: (id: string) => void
  onGenerateImage: (id: string) => void
  regenerating: boolean
  generatingPrompt: boolean
  generatingImage: boolean
}

export default function StoryCard({
  card,
  onUpdate,
  onRegenerate,
  onGeneratePrompt,
  onGenerateImage,
  regenerating,
  generatingPrompt,
  generatingImage,
}: StoryCardProps) {
  const plotCard = card.expand?.plot_card_id
  const label = plotCard ? clipLabel(plotCard.act, plotCard.order) : '—'
  const beat = plotCard?.scene_beat ?? ''

  return (
    <div className="story-card flex flex-col">
      {/* 16:9 Image Container */}
      <div className="relative w-full bg-black/40 border-b border-white/10 shrink-0" style={{ paddingBottom: '56.25%' }}>
        {card.image_url ? (
          <img 
            src={card.image_url} 
            alt="Scene" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <span className="text-4xl opacity-20 mb-3">🖼️</span>
            <button
              className="btn btn-secondary text-xs"
              onClick={() => onGenerateImage(card.id)}
              disabled={generatingImage || regenerating}
            >
              {generatingImage ? 'Generating Image...' : '✨ Generate Image'}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="clip-label">{label}</div>
      <div className="text-xs text-white/50 mt-1 line-clamp-2">{beat}</div>
        <textarea
          className="textarea text-xs mt-2"
          rows={6}
          value={card.written_scene ?? ''}
          onChange={(e) => onUpdate(card.id, e.target.value)}
        />
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
          <button
            className="btn btn-ghost text-xs flex-1 justify-center"
            onClick={() => onRegenerate(card.id)}
            disabled={regenerating || generatingImage}
          >
            {regenerating ? 'Regenerating…' : '↻ Regenerate Text'}
          </button>
          {card.image_url && (
            <button
              className="btn btn-primary text-xs flex-1 justify-center"
              onClick={() => onGeneratePrompt(card.id)}
              disabled={generatingPrompt}
            >
              {generatingPrompt ? 'Generating…' : '→ Video Prompt'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
