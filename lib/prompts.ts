import pb from '@/lib/pocketbase'

export interface PromptRecord {
  id: string
  key: string
  system_prompt: string
  user_template: string
  notes: string
}

export async function getPrompt(key: string): Promise<PromptRecord> {
  return pb.collection('kids_prompts').getFirstListItem<PromptRecord>(`key = "${key}"`)
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
