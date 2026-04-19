'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/lib/projects'
import type { Character, Project } from '@/lib/types'

interface ProjectListProps {
  character: Character
  projects: Project[]
}

const STAGE_LABELS: Record<number, string> = {
  2: 'Story Idea',
  3: 'Titles',
  4: 'Synopsis',
  5: 'Plotboard',
  6: 'Story Page',
  7: 'Video Prompts',
}

function projectDisplayName(project: Project): string {
  if (project.selected_title) return project.selected_title
  if (project.story_idea) {
    return project.story_idea.length > 60
      ? project.story_idea.slice(0, 60) + '…'
      : project.story_idea
  }
  return 'New Video'
}

function stageRoute(projectId: string, stageReached: number): string {
  if (stageReached >= 7) return `/project/${projectId}/prompts/beginning`
  if (stageReached >= 6) return `/project/${projectId}/story/beginning`
  if (stageReached >= 5) return `/project/${projectId}/plotboard/beginning`
  return `/project/${projectId}`
}

export default function ProjectList({ character, projects }: ProjectListProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleNewVideo() {
    setCreating(true)
    setCreateError(null)
    try {
      const project = await createProject(character.id)
      router.push(`/project/${project.id}`)
    } catch {
      setCreateError('Could not create video. Please try again.')
      setCreating(false)
    }
  }

  const inProgress = projects.filter((p) => p.status === 'in_progress')
  const completed = projects.filter((p) => p.status === 'completed')

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="label mb-1">{character.title}</div>
          <h1 className="heading-2">{character.name}</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleNewVideo}
          disabled={creating}
        >
          {creating ? 'Creating…' : '+ New Video'}
        </button>
        {createError && (
          <div className="text-xs text-red-400 mt-2">{createError}</div>
        )}
      </div>

      <div className="page-body flex flex-col gap-6">
        {inProgress.length > 0 && (
          <section>
            <div className="label mb-3">In Progress</div>
            <div className="flex flex-col gap-2">
              {inProgress.map((project) => (
                <div key={project.id} className="card card-body flex items-center justify-between">
                  <div>
                    <div className="heading-3 text-sm">{projectDisplayName(project)}</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      Stage {project.stage_reached}: {STAGE_LABELS[project.stage_reached] ?? ''}
                    </div>
                  </div>
                  <Link
                    href={stageRoute(project.id, project.stage_reached)}
                    className="btn btn-secondary btn-sm"
                  >
                    Resume →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <div className="label mb-3">Completed</div>
            <div className="flex flex-col gap-2">
              {completed.map((project) => (
                <div key={project.id} className="card card-body flex items-center justify-between">
                  <div className="heading-3 text-sm">{projectDisplayName(project)}</div>
                  <Link
                    href={stageRoute(project.id, project.stage_reached)}
                    className="btn btn-ghost btn-sm"
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length === 0 && (
          <div className="stage-locked-banner">
            No videos yet. Click + New Video to start.
          </div>
        )}
      </div>
    </div>
  )
}
