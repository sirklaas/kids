'use client'

import { useState, useEffect } from 'react'
import { getAllPrompts, updatePrompt, type PromptRecord } from '@/lib/prompts'

const STAGE_INFO: Record<string, { stage: number; title: string; description: string }> = {
  stage2_regenerate: { stage: 2, title: 'Regenerate Story Idea', description: 'Creates alternative story directions' },
  stage3_generate_titles: { stage: 3, title: 'Generate Titles', description: 'Generates 5 title and subtitle pairs' },
  stage3_regenerate_title: { stage: 3, title: 'Regenerate Title', description: 'Creates one alternative title' },
  stage4_generate_synopsis: { stage: 4, title: 'Generate Synopsis (3 variations)', description: 'Creates 3 different 3-act synopsis variations at once' },
  stage4_regenerate_synopsis: { stage: 4, title: 'Regenerate Synopsis', description: 'Creates one alternative 3-act synopsis variation' },
  stage5_generate_plotboard: { stage: 5, title: 'Generate Plotboard', description: 'Creates 30 scene beats across 3 acts' },
  stage6_write_scenes: { stage: 6, title: 'Write Scenes', description: 'Writes full scenes for an entire act' },
  stage6_regenerate_scene: { stage: 6, title: 'Regenerate Scene', description: 'Rewrites a single scene card' },
  stage7_generate_prompts: { stage: 7, title: 'Generate Video Prompts', description: 'Creates prompts for all clips in an act' },
  stage7_regenerate_prompt: { stage: 7, title: 'Regenerate Video Prompt', description: 'Creates prompts for a single clip' },
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Form state
  const [systemPrompt, setSystemPrompt] = useState('')
  const [userTemplate, setUserTemplate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadPrompts()
  }, [])

  useEffect(() => {
    if (selectedPrompt) {
      setSystemPrompt(selectedPrompt.system_prompt)
      setUserTemplate(selectedPrompt.user_template)
      setNotes(selectedPrompt.notes)
      setSaveMessage(null)
    }
  }, [selectedPrompt])

  async function loadPrompts() {
    try {
      setLoading(true)
      const all = await getAllPrompts()
      // Sort by stage number
      const sorted = all.sort((a, b) => {
        const stageA = STAGE_INFO[a.key]?.stage ?? 99
        const stageB = STAGE_INFO[b.key]?.stage ?? 99
        return stageA - stageB || a.key.localeCompare(b.key)
      })
      setPrompts(sorted)
    } catch (err) {
      setError('Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!selectedPrompt) return
    setSaving(true)
    setSaveMessage(null)
    try {
      await updatePrompt(selectedPrompt.id, {
        system_prompt: systemPrompt,
        user_template: userTemplate,
        notes,
      })
      setSaveMessage('✓ Saved successfully')
      // Update local state
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === selectedPrompt.id
            ? { ...p, system_prompt: systemPrompt, user_template: userTemplate, notes }
            : p
        )
      )
    } catch (err) {
      setSaveMessage('✗ Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Group prompts by stage
  const promptsByStage: Record<number, PromptRecord[]> = {}
  prompts.forEach((p) => {
    const stage = STAGE_INFO[p.key]?.stage ?? 0
    if (!promptsByStage[stage]) promptsByStage[stage] = []
    promptsByStage[stage].push(p)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/60">Loading prompts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Left side - Stage Cards */}
      <div className="w-[400px] border-r border-white/10 bg-black/20 overflow-y-auto">
        <div className="p-6">
          <h1 className="heading-2 mb-6">AI Prompts</h1>
          <p className="text-sm text-white/50 mb-6">
            Click a card to edit the AI prompt. Changes are saved to PocketBase.
          </p>

          {Object.entries(promptsByStage).map(([stageNum, stagePrompts]) => (
            <div key={stageNum} className="mb-6">
              <div className="label mb-3">Stage {stageNum}</div>
              <div className="grid gap-6">
                {stagePrompts.map((prompt) => {
                  const info = STAGE_INFO[prompt.key]
                  const isSelected = selectedPrompt?.id === prompt.id
                  return (
                    <button
                      key={prompt.id}
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-white/10 border-white/30'
                          : 'bg-black/20 border-white/10 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium text-sm mb-1">
                        {info?.title ?? prompt.key}
                      </div>
                      <div className="text-xs text-white/50">
                        {info?.description ?? prompt.notes}
                      </div>
                      <div className="text-[10px] text-white/30 mt-2 font-mono">
                        {prompt.key}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedPrompt ? (
          <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-3">
                  {STAGE_INFO[selectedPrompt.key]?.title ?? selectedPrompt.key}
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  {STAGE_INFO[selectedPrompt.key]?.description ?? selectedPrompt.notes}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saveMessage && (
                  <span
                    className={`text-sm ${
                      saveMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {saveMessage}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save This Prompt'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* System Prompt */}
              <div>
                <label className="field-label mb-2">System Prompt</label>
                <p className="text-xs text-white/40 mb-2">
                  Defines the AI&apos;s role and behavior for this task
                </p>
                <textarea
                  className="textarea font-mono text-xs"
                  rows={10}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter system prompt..."
                />
              </div>

              {/* User Template */}
              <div>
                <label className="field-label mb-2">User Template</label>
                <p className="text-xs text-white/40 mb-2">
                  Template with {'{{placeholders}}'} that get filled with actual values
                </p>
                <textarea
                  className="textarea font-mono text-xs"
                  rows={12}
                  value={userTemplate}
                  onChange={(e) => setUserTemplate(e.target.value)}
                  placeholder="Enter user template with {{placeholders}}..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="field-label mb-2">Notes</label>
                <p className="text-xs text-white/40 mb-2">
                  Internal notes about what this prompt does
                </p>
                <textarea
                  className="textarea text-xs"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes..."
                />
              </div>

              {/* Key reference */}
              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-white/30">
                  <span className="text-white/50">Prompt Key:</span>{' '}
                  <code className="font-mono bg-black/30 px-1 py-0.5 rounded">{selectedPrompt.key}</code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/40 text-center">
              <p className="mb-2">Select a prompt from the left to edit</p>
              <p className="text-sm text-white/30">
                Click on any stage card to view and modify the AI prompt
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
