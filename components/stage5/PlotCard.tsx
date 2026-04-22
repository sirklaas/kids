'use client'

import type { PlotCard as PlotCardType, Act } from '@/lib/types'

interface PlotCardProps {
  card: PlotCardType
  index: number
  act: Act
  onUpdate: (id: string, sceneBeat: string, durationSec: number) => void
  onDragStart: (index: number) => void
  onDragOver: (index: number) => void
  onDrop: () => void
}

function clipLabel(act: Act, order: number): string {
  const prefix = act === 'beginning' ? 'Begin' : act === 'middle' ? 'Middle' : 'End'
  return `${prefix}_${String(order).padStart(2, '0')}`
}

export default function PlotCard({
  card,
  index,
  act,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
}: PlotCardProps) {
  return (
    <div
      className="plot-card"
      draggable
      onDragStart={(e) => {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') {
          e.preventDefault()
          return
        }
        onDragStart(index)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(index)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
    >
      <div className="flex items-center justify-between">
        <span className="clip-label">{clipLabel(act, index + 1)}</span>
        <span className="plot-card-drag-handle" title="Drag to reorder">⠿</span>
      </div>
      <textarea
        className="textarea text-sm"
        rows={6}
        value={card.scene_beat}
        onChange={(e) => onUpdate(card.id, e.target.value, card.duration_sec)}
      />
      <div className="flex items-center gap-2">
        <span className="field-label shrink-0 mb-0">Duration (s)</span>
        <input
          className="input text-sm"
          style={{ width: '4rem' }}
          type="number"
          min={1}
          max={60}
          value={card.duration_sec}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!Number.isNaN(val) && val >= 1 && val <= 60) {
              onUpdate(card.id, card.scene_beat, val)
            }
          }}
        />
      </div>
    </div>
  )
}
