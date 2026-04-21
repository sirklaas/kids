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
  regenerating: boolean
  generatingPrompt: boolean
}

export default function StoryCard({
  card,
  onUpdate,
  onRegenerate,
  onGeneratePrompt,
  regenerating,
  generatingPrompt,
}: StoryCardProps) {
  const plotCard = card.expand?.plot_card_id
  const label = plotCard ? clipLabel(plotCard.act, plotCard.order) : '—'
  const beat = plotCard?.scene_beat ?? ''

  return (
    <div className="story-card">
      <div className="clip-label">{label}</div>
      <div className="text-xs text-white/50 mt-1 line-clamp-2">{beat}</div>
      <textarea
        className="textarea text-xs mt-2"
        rows={10}
        value={card.written_scene ?? ''}
        onChange={(e) => onUpdate(card.id, e.target.value)}
      />
      <div className="flex gap-2 mt-2">
        <button
          className="btn btn-ghost text-xs"
          onClick={() => onRegenerate(card.id)}
          disabled={regenerating || generatingPrompt}
        >
          {regenerating ? 'Regenerating…' : '↻ Regenerate Scene'}
        </button>
        <button
          className="btn btn-secondary text-xs"
          onClick={() => onGeneratePrompt(card.id)}
          disabled={regenerating || generatingPrompt}
        >
          {generatingPrompt ? 'Generating…' : '→ Video Prompt'}
        </button>
      </div>
    </div>
  )
}
