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

export function recipeCountBounds(proteinCount: number): {
  min: number
  max: number
} {
  const min = Math.max(1, proteinCount)
  return { min, max: min + 3 }
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
    (provider === 'gemini' ? 'gemini-flash-lite-latest' : 'gpt-4o-mini')

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
      temperature: 0.3,
      max_tokens: 900,
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

function dedupeRecipes(recipes: Recipe[]): Recipe[] {
  const seen = new Set<string>()
  const out: Recipe[] = []
  for (const recipe of recipes) {
    const key = recipe.title.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({
      ...recipe,
      id: `${recipe.id || 'recipe'}_${out.length}_${Date.now()}`,
    })
  }
  return out
}

async function requestRecipeBatch(
  input: GenerateInput & {
    targetCount: number
    focusProtein?: string
    excludeTitles?: string[]
  },
): Promise<Recipe[]> {
  const data = await callServerApi<RecipesResponse>('/api/recipes', input)
  return data.recipes ?? []
}

/**
 * Parallel generation:
 * - 1 focused request per selected protein (min coverage)
 * - 1 bonus request for up to 3 extra variety recipes
 * Final count is between proteinCount and proteinCount + 3.
 */
export async function generateRecipes(
  input: GenerateInput,
): Promise<{ recipes: Recipe[]; usedMock: boolean }> {
  const proteins =
    input.availableProteins.length > 0
      ? input.availableProteins
      : ['Paneer']
  const { min, max } = recipeCountBounds(proteins.length)
  const bonusCount = max - min

  try {
    const focusedPromises = proteins.map((protein) =>
      requestRecipeBatch({
        ...input,
        availableProteins: [protein],
        focusProtein: protein,
        targetCount: 1,
      }).catch(() => [] as Recipe[]),
    )

    const bonusPromise =
      bonusCount > 0
        ? requestRecipeBatch({
            ...input,
            availableProteins: proteins,
            targetCount: bonusCount,
          }).catch(() => [] as Recipe[])
        : Promise.resolve([] as Recipe[])

    const [focusedGroups, bonus] = await Promise.all([
      Promise.all(focusedPromises),
      bonusPromise,
    ])

    const focused = focusedGroups.flat()
    const merged = dedupeRecipes([...focused, ...bonus])

    if (merged.length < min) {
      // Fill remaining with one more variety call if needed.
      const refill = await requestRecipeBatch({
        ...input,
        availableProteins: proteins,
        targetCount: min - merged.length,
        excludeTitles: merged.map((r) => r.title),
      }).catch(() => [] as Recipe[])
      const filled = dedupeRecipes([...merged, ...refill])
      if (filled.length === 0) throw new Error('No recipes in response')
      return { recipes: filled.slice(0, max), usedMock: false }
    }

    if (merged.length === 0) throw new Error('No recipes in response')
    return { recipes: merged.slice(0, max), usedMock: false }
  } catch (serverError) {
    const serverMsg =
      serverError instanceof Error ? serverError.message : String(serverError)

    try {
      const { max: clientMax } = recipeCountBounds(proteins.length)
      const userPrompt = `Base meal: ${input.baseMeal || 'UNSPECIFIED'}
Proteins: ${proteins.join(', ')}
Servings: ${input.servings}
Return ${clientMax} distinct high-protein Indian sides as JSON {"recipes":[...]}`

      const json = (await clientDirectCompletion(
        userPrompt,
        'Indian home-cook assistant. Return STRICT JSON only.',
      )) as RecipesResponse
      if (!json.recipes?.length) throw new Error('No recipes in response')
      return {
        recipes: dedupeRecipes(json.recipes).slice(0, clientMax),
        usedMock: false,
      }
    } catch (clientError) {
      console.warn('Recipe generation fell back to mocks:', serverMsg, clientError)
      const { max: mockMax } = recipeCountBounds(proteins.length)
      return {
        recipes: buildMockRecipes(
          proteins,
          input.suppressedProteins,
          input.baseMeal,
        ).slice(0, mockMax),
        usedMock: true,
      }
    }
  }
}

export async function adaptRecipe(input: {
  recipeTitle: string
  missingIngredients: string[]
  steps: string[]
  baseMeal?: string
}): Promise<AdaptationResponse> {
  const missing = input.missingIngredients.map((item) => item.trim()).filter(Boolean)
  try {
    return await callServerApi<AdaptationResponse>('/api/adapt', {
      ...input,
      missingIngredients: missing,
    })
  } catch {
    try {
      const userPrompt = `The cook is missing these ingredients from "${input.recipeTitle}": ${missing.join(', ')}.
Base meal: ${input.baseMeal || 'UNSPECIFIED'}
Original steps: ${JSON.stringify(input.steps)}
Return STRICT JSON: { "substitutionNote": "...", "updatedSteps": ["..."] }`
      const json = (await clientDirectCompletion(
        userPrompt,
        'Adapt Indian home recipes when ingredients are missing. STRICT JSON only.',
      )) as AdaptationResponse
      if (!json.substitutionNote || !json.updatedSteps?.length) {
        throw new Error('Invalid adaptation')
      }
      return json
    } catch {
      const label = missing.join(', ')
      return {
        substitutionNote: `Missing ${label}? Skip those items or swap with common kitchen substitutes.`,
        updatedSteps: input.steps.map((step) => {
          const hit = missing.some((item) =>
            step.toLowerCase().includes(item.toLowerCase()),
          )
          return hit ? `${step} (adapt if missing: ${label})` : step
        }),
      }
    }
  }
}
