import { buildMockRecipes } from '../data/mockRecipes'
import { getSetting } from '../db'
import type {
  AdaptationResponse,
  LlmProvider,
  Recipe,
  RecipesResponse,
} from '../types'

export interface HistoryEntry {
  date: string
  proteinItem: string
  category: string
  baseMeal?: string
}

export interface GenerateInput {
  baseMeal: string
  availableProteins: string[]
  servings: number
  suppressedProteins: string[]
  recentHistory: HistoryEntry[]
}

async function callServerApi<T>(
  path: '/api/recipes' | '/api/adapt',
  body: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }
  return data
}

/** Optional personal override from Settings (IndexedDB). Prefer server .env key. */
async function clientDirectCompletion(userPrompt: string, system: string) {
  const apiKey = await getSetting('API_KEY')
  if (!apiKey) throw new Error('NO_API_KEY')

  const provider = ((await getSetting('LLM_PROVIDER')) ??
    'gemini') as LlmProvider
  const customBase = (await getSetting('API_BASE_URL')) ?? undefined
  const model =
    (await getSetting('LLM_MODEL')) ??
    (provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini')

  let endpoint =
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  if (provider === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions'
  } else if (provider === 'custom' && customBase) {
    endpoint = `${customBase.replace(/\/$/, '')}/chat/completions`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`API error ${response.status}: ${detail.slice(0, 180)}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty model response')
  const trimmed = content.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    return JSON.parse(trimmed.slice(start, end + 1))
  }
}

export async function generateRecipes(
  input: GenerateInput,
): Promise<{ recipes: Recipe[]; usedMock: boolean }> {
  try {
    const data = await callServerApi<RecipesResponse & { source?: string }>(
      '/api/recipes',
      input,
    )
    if (!data.recipes?.length) throw new Error('No recipes in response')
    return { recipes: data.recipes, usedMock: false }
  } catch (serverError) {
    const serverMsg =
      serverError instanceof Error ? serverError.message : String(serverError)

    // Fall back to optional personal key in Settings, then mocks.
    try {
      const historyLines =
        input.recentHistory.length > 0
          ? input.recentHistory
              .map((h) => {
                const base = h.baseMeal ? ` with ${h.baseMeal}` : ''
                return `- ${h.date}: ${h.proteinItem} (${h.category})${base}`
              })
              .join('\n')
          : '- None logged yet'

      const userPrompt = `CONTEXT FOR TODAY'S SUGGESTIONS:
- Today's base meal already cooked: ${input.baseMeal || 'UNSPECIFIED'}
- Proteins available in the kitchen now: ${input.availableProteins.join(', ') || 'UNSPECIFIED'}
- Number of servings: ${input.servings}
- Proteins to suppress (cooked heavily in last 2 days): ${input.suppressedProteins.join(', ') || 'None'}
- Recent protein history (newest first):
${historyLines}

Suggest 2-4 DISTINCT high-protein Telangana-friendly side dishes that pair with today's base meal.
Return STRICT JSON with a "recipes" array.`

      const json = (await clientDirectCompletion(
        userPrompt,
        'You are an expert Telangana South Indian culinary assistant. Return STRICT JSON only.',
      )) as RecipesResponse
      if (!json.recipes?.length) throw new Error('No recipes in response')
      return { recipes: json.recipes, usedMock: false }
    } catch (clientError) {
      console.warn('Recipe generation fell back to mocks:', serverMsg, clientError)
      return {
        recipes: buildMockRecipes(
          input.availableProteins,
          input.suppressedProteins,
          input.baseMeal,
        ),
        usedMock: true,
      }
    }
  }
}

export async function adaptRecipe(input: {
  recipeTitle: string
  missingIngredient: string
  steps: string[]
  baseMeal?: string
}): Promise<AdaptationResponse> {
  try {
    return await callServerApi<AdaptationResponse>('/api/adapt', input)
  } catch {
    try {
      const userPrompt = `The cook is missing "${input.missingIngredient}" from "${input.recipeTitle}".
Base meal: ${input.baseMeal || 'UNSPECIFIED'}
Current steps: ${JSON.stringify(input.steps)}
Return STRICT JSON: { "substitutionNote": "...", "updatedSteps": ["..."] }`
      const json = (await clientDirectCompletion(
        userPrompt,
        'Adapt Telangana home recipes when an ingredient is missing. STRICT JSON only.',
      )) as AdaptationResponse
      if (!json.substitutionNote || !json.updatedSteps?.length) {
        throw new Error('Invalid adaptation')
      }
      return json
    } catch {
      return {
        substitutionNote: `No ${input.missingIngredient}? Skip it or swap with a common kitchen substitute you already have.`,
        updatedSteps: input.steps.map((step) =>
          step.toLowerCase().includes(input.missingIngredient.toLowerCase())
            ? `${step} (or skip ${input.missingIngredient} if missing)`
            : step,
        ),
      }
    }
  }
}
