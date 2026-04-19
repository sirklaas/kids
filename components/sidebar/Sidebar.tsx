'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const STAGES = [
  { number: 1, label: 'Characters' },
  { number: 2, label: 'Story Idea' },
  { number: 3, label: 'Titles' },
  { number: 4, label: 'Synopsis' },
  { number: 5, label: 'Plotboard' },
  { number: 6, label: 'Story Page' },
  { number: 7, label: 'Video Prompts' },
]

interface SidebarProps {
  projectId?: string
  stageReached?: number
}

export default function Sidebar({ projectId, stageReached = 1 }: SidebarProps) {
  const pathname = usePathname()

  function stageHref(stageNumber: number): string | null {
    if (!projectId) return stageNumber === 1 ? '/' : null
    switch (stageNumber) {
      case 1: return '/'
      case 2: case 3: case 4: return `/project/${projectId}`
      case 5: return `/project/${projectId}/plotboard/beginning`
      case 6: return `/project/${projectId}/story/beginning`
      case 7: return `/project/${projectId}/prompts/beginning`
      default: return null
    }
  }

  function isActive(stageNumber: number): boolean {
    if (stageNumber === 1) return pathname === '/' || pathname.startsWith('/character')
    const href = stageHref(stageNumber)
    if (!href) return false
    if (stageNumber === 2 || stageNumber === 3 || stageNumber === 4) {
      return pathname.startsWith(`/project/${projectId}`) && !pathname.includes('/plotboard') && !pathname.includes('/story') && !pathname.includes('/prompts')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">🎬 Kids Studio</div>
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
      </div>
    </nav>
  )
}
