'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSeries, updateSeries, createSeries } from '@/lib/series'
import { Series } from '@/lib/types'

interface EditSeriesPageProps {
  params: { id: string }
}

export default function EditSeriesPage({ params }: EditSeriesPageProps) {
  const router = useRouter()
  const isNew = params.id === 'new'

  const [series, setSeries] = useState<Partial<Series>>({
    name: '',
    description: '',
    image_url: '',
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (isNew) {
      createSeries({ name: 'New Series' }).then((newSeries) => {
        router.replace(`/series/${newSeries.id}`)
      })
      return
    }

    loadSeries()
  }, [params.id, isNew, router])

  async function loadSeries() {
    try {
      const data = await getSeries(params.id)
      setSeries(data)
    } catch (err) {
      console.error('Failed to load series:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!series.name) return

    setSaving(true)
    try {
      await updateSeries(params.id, {
        name: series.name,
        description: series.description,
        image_url: series.image_url,
      })
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  async function goToStep2() {
    await handleSave()
    setStep(2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to Series
          </Link>
          <h1 className="heading-1 mt-2">
            {isNew ? 'Create Series' : 'Edit Series'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-4 py-2 rounded-full text-sm ${
            step === 1 ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/60'
          }`}>
            1. Series Info
          </span>
          <span className="text-white/40">→</span>
          <span className={`px-4 py-2 rounded-full text-sm ${
            step === 2 ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/60'
          }`}>
            2. Characters
          </span>
        </div>
      </div>

      {step === 1 ? (
        <div className="card">
          <h2 className="heading-2 mb-6">Series Information</h2>

          <div className="space-y-6">
            <div>
              <label className="field-label">Series Name *</label>
              <input
                type="text"
                value={series.name || ''}
                onChange={(e) => setSeries({ ...series, name: e.target.value })}
                placeholder="e.g., Adventures of Paddington"
                className="input w-full"
              />
            </div>

            <div>
              <label className="field-label">Description</label>
              <textarea
                value={series.description || ''}
                onChange={(e) => setSeries({ ...series, description: e.target.value })}
                placeholder="Describe your series. What's it about? Who are the main characters?"
                className="textarea w-full h-32"
              />
              <p className="text-xs text-white/50 mt-1">
                This helps the AI understand the tone and style of your series.
              </p>
            </div>

            <div>
              <label className="field-label">Series Image URL</label>
              <input
                type="text"
                value={series.image_url || ''}
                onChange={(e) => setSeries({ ...series, image_url: e.target.value })}
                placeholder="https://..."
                className="input w-full"
              />
              {series.image_url && (
                <img
                  src={series.image_url}
                  alt="Preview"
                  className="mt-3 h-32 w-32 object-cover rounded-lg"
                />
              )}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Link href="/">
              <button className="btn-secondary">Cancel</button>
            </Link>
            <button
              onClick={goToStep2}
              disabled={!series.name || saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Next: Add Characters →'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-body text-white/60">
            Step 2: Character Builder coming in next task...
          </p>
          <button
            onClick={() => setStep(1)}
            className="btn-secondary mt-4"
          >
            ← Back to Step 1
          </button>
        </div>
      )}
    </div>
  )
}
