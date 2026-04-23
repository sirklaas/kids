import Link from 'next/link'
import { getAllSeries } from '@/lib/series'
import { SeriesCard } from '@/components/series/SeriesCard'
import { getCharacterCount } from '@/lib/series-characters'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const series = await getAllSeries()

  const seriesWithCounts = await Promise.all(
    series.map(async (s) => {
      try {
        const count = await getCharacterCount(s.id)
        return { ...s, character_count: count }
      } catch (err) {
        console.error(`Failed to get character count for series ${s.id}:`, err)
        return { ...s, character_count: 0 }
      }
    })
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="heading-1">Series</h1>
        <Link href="/series/new">
          <button className="btn-primary">+ New Series</button>
        </Link>
      </div>

      {seriesWithCounts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-body text-white/60">
            No series yet. Create your first series!
          </p>
          <Link href="/series/new">
            <button className="btn-primary mt-4">Create Series</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {seriesWithCounts.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  )
}
