import pb from '@/lib/pocketbase'
import type { Project } from '@/lib/types'

export async function getProjectsForCharacter(characterId: string): Promise<Project[]> {
  return pb.collection('kids_projects').getFullList<Project>({
    filter: pb.filter('character_id = {:id}', { id: characterId }),
    sort: '-created',
    expand: 'character_id',
  })
}

export async function getProject(id: string): Promise<Project> {
  return pb.collection('kids_projects').getOne<Project>(id, {
    expand: 'character_id',
  })
}

export async function createProject(characterId: string): Promise<Project> {
  return pb.collection('kids_projects').create<Project>(
    {
      character_id: characterId,
      story_idea: '',
      selected_title: '',
      selected_subtitle: '',
      stage_reached: 2,
      status: 'in_progress',
    },
    { expand: 'character_id' }
  )
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, 'story_idea' | 'selected_title' | 'selected_subtitle' | 'stage_reached' | 'status'>>
): Promise<Project> {
  return pb.collection('kids_projects').update<Project>(id, data)
}
