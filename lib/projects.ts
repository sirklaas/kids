import pb from '@/lib/pocketbase'
import type { Project } from '@/lib/types'

export async function getProjectsForCharacter(characterId: string): Promise<Project[]> {
  return pb.collection('kids_projects').getFullList<Project>({
    filter: pb.filter('character_id = {:id}', { id: characterId }),
    sort: '-created',
    expand: 'character_id',
    requestKey: null,
  })
}

export async function getProjectsForSeries(seriesId: string): Promise<Project[]> {
  return pb.collection('kids_projects').getFullList<Project>({
    filter: pb.filter('series_id = {:id}', { id: seriesId }),
    sort: 'created',
    requestKey: null,
  })
}

export async function getProject(id: string): Promise<Project> {
  return pb.collection('kids_projects').getOne<Project>(id, {
    expand: 'character_id',
    requestKey: null,
  })
}

export async function createProject(seriesId: string): Promise<Project> {
  return pb.collection('kids_projects').create<Project>(
    {
      series_id: seriesId,
      story_idea: '',
      selected_title: '',
      selected_subtitle: '',
      stage_reached: 2,
      status: 'in_progress',
    },
    { requestKey: null }
  )
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, 'story_idea' | 'selected_title' | 'selected_subtitle' | 'stage_reached' | 'status'>>
): Promise<Project> {
  return pb.collection('kids_projects').update<Project>(id, data, { requestKey: null })
}
