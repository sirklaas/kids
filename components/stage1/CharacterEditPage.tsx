'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCharacter } from '@/lib/characters'
import type { Character } from '@/lib/types'

interface CharacterEditPageProps {
  character: Character
}

const FIELDS: Array<{ key: keyof Character; label: string; multiline?: boolean }> = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title / Role' },
  { key: 'age', label: 'Age' },
  { key: 'personality', label: 'Personality Traits', multiline: true },
  { key: 'visual_description', label: 'Visual Description', multiline: true },
  { key: 'voice_style', label: 'Voice Style' },
  { key: 'catchphrases', label: 'Catchphrases', multiline: true },
  { key: 'backstory', label: 'Backstory', multiline: true },
  { key: 'avatar_url', label: 'Avatar URL' },
]

export default function CharacterEditPage({ character }: CharacterEditPageProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Character>>({
    name: character.name,
    title: character.title,
    age: character.age,
    personality: character.personality,
    visual_description: character.visual_description,
    voice_style: character.voice_style,
    catchphrases: character.catchphrases,
    backstory: character.backstory,
    avatar_url: character.avatar_url,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await updateCharacter(character.id, form)
      router.push('/')
    } catch {
      setSaveError('Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="heading-2">Edit Character</h1>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/')}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Character'}
            </button>
          </div>
          {saveError && (
            <div className="text-xs text-red-400">{saveError}</div>
          )}
        </div>
      </div>

      <div className="page-body max-w-2xl flex flex-col gap-5">
        {FIELDS.map(({ key, label, multiline }) => (
          <div key={key}>
            <label className="field-label">{label}</label>
            {multiline ? (
              <textarea
                className="textarea"
                rows={3}
                value={(form[key] as string) || ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            ) : (
              <input
                className="input"
                type="text"
                value={(form[key] as string) || ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
