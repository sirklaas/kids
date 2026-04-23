'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { deleteSeries, updateSeries } from '@/lib/series'
import { Series } from '@/lib/types'

interface SeriesCardProps {
  series: Series & { character_count?: number }
}

const DEFAULT_SCENES = { beginning: 8, middle: 10, end: 8 }

export function SeriesCard({ series }: SeriesCardProps) {
  const router = useRouter()
  const [scenes, setScenes] = useState({
    beginning: series.beginning_scenes ?? DEFAULT_SCENES.beginning,
    middle: series.middle_scenes ?? DEFAULT_SCENES.middle,
    end: series.end_scenes ?? DEFAULT_SCENES.end,
  })
  const [saving, setSaving] = useState(false)

  // Sync with database values when series prop updates
  useEffect(() => {
    setScenes({
      beginning: series.beginning_scenes ?? DEFAULT_SCENES.beginning,
      middle: series.middle_scenes ?? DEFAULT_SCENES.middle,
      end: series.end_scenes ?? DEFAULT_SCENES.end,
    })
  }, [series.beginning_scenes, series.middle_scenes, series.end_scenes])

  const handleUseSeries = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/project/new?series_id=${series.id}`)
  }

  const handleEditSeries = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/series/${series.id}`)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Delete "${series.name}"?\n\nThis will also delete all ${series.character_count ?? 0} characters. This cannot be undone.`)) {
      return
    }

    try {
      await deleteSeries(series.id)
      alert(`✅ "${series.name}" deleted`)
      window.location.reload()
    } catch (err) {
      console.error('Failed to delete series:', err)
      alert('❌ Could not delete series')
    }
  }

  const handleSceneChange = (act: 'beginning' | 'middle' | 'end', value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= 50) {
      setScenes(prev => ({ ...prev, [act]: num }))
    }
  }

  const handleSaveScenes = async () => {
    setSaving(true)
    try {
      console.log(`[SeriesCard] Saving scene counts for ${series.id}:`, scenes)
      await updateSeries(series.id, {
        beginning_scenes: scenes.beginning,
        middle_scenes: scenes.middle,
        end_scenes: scenes.end,
      })
      console.log(`[SeriesCard] ✅ Saved scene counts`)
      alert(`✅ Saved: ${scenes.beginning}/${scenes.middle}/${scenes.end}`)
      // Refresh the page data to confirm save
      router.refresh()
    } catch (err) {
      console.error('Failed to save scene counts:', err)
      alert('❌ Could not save scene counts')
    } finally {
      setSaving(false)
    }
  }

  // Always allow saving - simpler UX
  const hasChanges = true

  return (
    <div className="card h-full flex flex-col p-4">
      {/* Image */}
      <Link href={`/series/${series.id}`}>
        <div className="h-40 rounded-lg bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
          {series.image_url ? (
            <img src={series.image_url} alt={series.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">🎬</span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="mt-4 flex-1 flex flex-col px-1">
        <Link href={`/series/${series.id}`}>
          <h3 className="heading-3 text-lg hover:text-gold transition-colors cursor-pointer">{series.name}</h3>
        </Link>

        {series.description && (
          <p className="text-body-sm text-white/70 mt-2 line-clamp-2 flex-1 px-0.5">{series.description}</p>
        )}

        <div className="mt-3 flex items-center gap-2 px-0.5">
          <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold">
            {series.character_count ?? 0} characters
          </span>
        </div>

        {/* Scene Counts */}
        <div className="mt-3 pt-3 border-t border-white/10" suppressHydrationWarning>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                min={1}
                max={50}
                value={scenes.beginning}
                onChange={(e) => handleSceneChange('beginning', e.target.value)}
                className="w-12 bg-white/10 border border-white/20 rounded px-1 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                suppressHydrationWarning
              />
              <input
                type="number"
                min={1}
                max={50}
                value={scenes.middle}
                onChange={(e) => handleSceneChange('middle', e.target.value)}
                className="w-12 bg-white/10 border border-white/20 rounded px-1 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                suppressHydrationWarning
              />
              <input
                type="number"
                min={1}
                max={50}
                value={scenes.end}
                onChange={(e) => handleSceneChange('end', e.target.value)}
                className="w-12 bg-white/10 border border-white/20 rounded px-1 py-1.5 text-center text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                suppressHydrationWarning
              />
            </div>
            <button
              onClick={handleSaveScenes}
              disabled={saving}
              className="btn-primary text-xs px-3 py-1.5"
              style={{ height: '33px' }}
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
        <button onClick={handleUseSeries} className="btn-primary flex-1 text-sm py-2" style={{ height: '33px' }}>Use</button>
        <button onClick={handleEditSeries} className="btn-secondary flex-1 text-sm py-2" style={{ height: '33px' }}>Edit</button>
        <button
          onClick={handleDelete}
          className="btn-secondary flex-1 text-sm py-2 bg-white/10 hover:bg-white/20 text-white/60 border-white/20"
          style={{ height: '33px' }}
          title="Delete series"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
