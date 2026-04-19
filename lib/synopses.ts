import pb from '@/lib/pocketbase'
import type { Synopsis } from '@/lib/types'

export async function getSynopsesForProject(projectId: string): Promise<Synopsis[]> {
  return pb.collection('kids_synopses').getFullList<Synopsis>({
    filter: pb.filter('project_id = {:id}', { id: projectId }),
    sort: 'created',
  })
}

export async function createSynopsis(data: {
  project_id: string
  title: string
  subtitle: string
  beginning?: string
  middle?: string
  end?: string
  selected?: boolean
}): Promise<Synopsis> {
  return pb.collection('kids_synopses').create<Synopsis>({
    project_id: data.project_id,
    title: data.title,
    subtitle: data.subtitle,
    beginning: data.beginning ?? '',
    middle: data.middle ?? '',
    end: data.end ?? '',
    selected: data.selected ?? false,
  })
}

export async function updateSynopsis(
  id: string,
  data: Partial<Pick<Synopsis, 'title' | 'subtitle' | 'beginning' | 'middle' | 'end' | 'selected'>>
): Promise<Synopsis> {
  return pb.collection('kids_synopses').update<Synopsis>(id, data)
}

export async function deleteSynopsis(id: string): Promise<void> {
  await pb.collection('kids_synopses').delete(id)
}
