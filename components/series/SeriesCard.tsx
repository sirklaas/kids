'use client'

import Link from 'next/link'
import { Series } from '@/lib/types'

interface SeriesCardProps {
  series: Series & { character_count?: number }
}

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link href={`/series/${series.id}`}>
      <div className="card hover:scale-[1.02] transition-transform cursor-pointer h-full flex flex-col">
        <div className="h-40 rounded-lg bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center overflow-hidden">
          {series.image_url ? (
            <img
              src={series.image_url}
              alt={series.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">🎬</span>
          )}
        </div>

        <div className="mt-4 flex-1 flex flex-col">
          <h3 className="heading-3 text-lg">{series.name}</h3>

          {series.description && (
            <p className="text-body-sm text-white/70 mt-2 line-clamp-2 flex-1">
              {series.description}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-gold/20 text-gold">
              {series.character_count ?? 0} characters
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
