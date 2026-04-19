'use client'

import type { StoryCard as StoryCardType, Act } from '@/lib/types'

export type PromptField =
  | 'environment'
  | 'characters'
  | 'voice_over'
  | 'spoken_text'
  | 'sound_effects'
  | 'music'

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

const PROMPT_FIELDS: Array<{ key: PromptField; label: string }> = [
  { key: 'environment', label: 'Environment' },
  { key: 'characters', label: 'Characters' },
  { key: 'voice_over', label: 'Voice Over' },
  { key: 'spoken_text', label: 'Spoken Text' },
  { key: 'sound_effects', label: 'Sound Effects' },
  { key: 'music', label: 'Music' },
]

interface VideoPromptCardProps {
  card: StoryCardType
  onUpdateField: (id: string, field: PromptField, value: string) => void
  onRegenerate: (id: string) => void
  onSendToVideoAI: (id: string) => void
  regenerating: boolean
  sending: boolean
}

export default function VideoPromptCard({
  card,
  onUpdateField,
  onRegenerate,
  onSendToVideoAI,
  regenerating,
  sending,
}: VideoPromptCardProps) {
  const plotCard = card.expand?.plot_card_id
  const label = plotCard ? clipLabel(plotCard.act, plotCard.order) : '—'

  return (
    <div className="video-prompt-card">
      <div className="clip-label mb-3">{label}</div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          {PROMPT_FIELDS.map(({ key, label: fieldLabel }) => (
            <div key={key}>
              <label className="field-label">{fieldLabel}</label>
              <textarea
                className="textarea text-xs"
                rows={2}
                value={card[key] ?? ''}
                onChange={(e) => onUpdateField(card.id, key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          <label className="field-label">Written Scene</label>
          <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
            {card.written_scene}
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-5">
          <button
            className="btn btn-ghost text-xs"
            onClick={() => onRegenerate(card.id)}
            disabled={regenerating || sending}
          >
            {regenerating ? 'Regenerating…' : '↻ Regenerate Prompt'}
          </button>
          <button
            className="btn btn-secondary text-xs"
            onClick={() => onSendToVideoAI(card.id)}
            disabled={regenerating || sending}
          >
            {sending ? 'Sending…' : '▶ Send to Video AI'}
          </button>
        </div>
      </div>
    </div>
  )
}
