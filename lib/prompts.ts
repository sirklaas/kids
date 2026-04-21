import pb from '@/lib/pocketbase'

export interface PromptRecord {
  id: string
  key: string
  system_prompt: string
  user_template: string
  notes: string
}

export async function getPrompt(key: string): Promise<PromptRecord> {
  return pb.collection('kids_prompts').getFirstListItem<PromptRecord>(`key = "${key}"`, { requestKey: null })
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? '')
}

export async function buildPrompt(
  key: string,
  values: Record<string, string>
): Promise<{ system: string; user: string }> {
  const prompt = await getPrompt(key)
  return {
    system: prompt.system_prompt,
    user: fillTemplate(prompt.user_template, values),
  }
}

export async function getAllPrompts(): Promise<PromptRecord[]> {
  return pb.collection('kids_prompts').getFullList<PromptRecord>({ requestKey: null })
}

export async function updatePrompt(
  id: string,
  data: Partial<Pick<PromptRecord, 'system_prompt' | 'user_template' | 'notes'>>
): Promise<PromptRecord> {
  return pb.collection('kids_prompts').update<PromptRecord>(id, data, { requestKey: null })
}
