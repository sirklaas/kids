'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase'
import type { Project } from '@/lib/types'

const STAGES = [
  { number: 1, label: 'Series' },
  { number: 2, label: 'Story Idea' },
  { number: 3, label: 'Titles' },
  { number: 4, label: 'Synopsis' },
  { number: 5, label: 'Plotboard' },
  { number: 6, label: 'Story Page' },
  { number: 7, label: 'Video Prompts' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [project, setProject] = useState<Project | null>(null)

  const projectIdMatch = pathname.match(/^\/project\/([^/]+)/)
  const urlProjectId = projectIdMatch?.[1] ?? null

  useEffect(() => {
    if (!urlProjectId) {
      setProject(null)
      return
    }
    let cancelled = false
    pb.collection('kids_projects')
      .getOne<Project>(urlProjectId)
      .then((p) => { if (!cancelled) setProject(p) })
      .catch(() => { if (!cancelled) setProject(null) })
    return () => { cancelled = true }
  }, [urlProjectId])

  const [liveStage, setLiveStage] = useState<number | null>(null)

  useEffect(() => {
    const handler = (e: Event) => setLiveStage((e as CustomEvent<number>).detail)
    window.addEventListener('kids:stage', handler)
    return () => window.removeEventListener('kids:stage', handler)
  }, [])

  const stageReached = liveStage ?? project?.stage_reached ?? 1

  function stageHref(stageNumber: number): string | null {
    if (!urlProjectId) return stageNumber === 1 ? '/' : null
    switch (stageNumber) {
      case 1: return '/'
      case 2: case 3: case 4: return `/project/${urlProjectId}`
      case 5: return `/project/${urlProjectId}/plotboard/beginning`
      case 6: return `/project/${urlProjectId}/story/beginning`
      case 7: return `/project/${urlProjectId}/prompts/beginning`
      default: return null
    }
  }

  function isActive(stageNumber: number): boolean {
    if (stageNumber === 1) {
      return pathname === '/' || pathname.startsWith('/series')
    }
    if (!urlProjectId) return false
    const projectBase = `/project/${urlProjectId}`
    if (stageNumber >= 2 && stageNumber <= 4) {
      const onProjectPage =
        pathname === projectBase ||
        pathname === `${projectBase}/` ||
        (pathname.startsWith(projectBase) &&
          !pathname.includes('/plotboard') &&
          !pathname.includes('/story') &&
          !pathname.includes('/prompts'))
      if (!onProjectPage) return false
      return stageNumber === Math.min(stageReached, 4)
    }
    if (stageNumber === 5) return pathname.startsWith(`${projectBase}/plotboard`)
    if (stageNumber === 6) return pathname.startsWith(`${projectBase}/story`)
    if (stageNumber === 7) return pathname.startsWith(`${projectBase}/prompts`)
    return false
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo" style={{ fontFamily: 'var(--font-barlow), system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>🎬 Kids Studio</span>
        <span style={{ fontSize: '10px', background: '#FFD700', padding: '2px 6px', borderRadius: '4px', color: '#000', fontWeight: 600 }}>v6.0</span>
      </div>
      <div className="flex flex-col py-2 flex-1">
        {STAGES.map((stage) => {
          const unlocked = stage.number <= stageReached || stage.number === 1
          const active = isActive(stage.number)
          const href = stageHref(stage.number)

          if (!unlocked) {
            return (
              <div key={stage.number} className="sidebar-item-locked">
                <span className="text-[10px] w-4 text-center opacity-60">{stage.number}</span>
                {stage.label}
              </div>
            )
          }

          if (active) {
            return (
              <div key={stage.number} className="sidebar-item-active">
                <span className="text-[10px] w-4 text-center">{stage.number}</span>
                {stage.label}
              </div>
            )
          }

          return (
            <Link key={stage.number} href={href ?? '/'} className="sidebar-item-unlocked">
              <span className="text-[10px] w-4 text-center">{stage.number}</span>
              {stage.label}
            </Link>
          )
        })}
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            href="/prompts"
            className={`sidebar-item-${pathname === '/prompts' ? 'active' : 'unlocked'}`}
          >
            <span className="text-[10px] w-4 text-center">🤖</span>
            AI Prompts
          </Link>
        </div>
      </div>
    </nav>
  )
}
