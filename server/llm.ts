/** Shared Gemini / OpenAI-compatible recipe helpers for API routes and Vite middleware. */

export type ProteinCategory = 'VEG' | 'NON_VEG' | 'FISH'

export interface Ingredient {
  item: string
  amountPerServing: number
  unit: string
  isProteinSource: boolean
}

export interface Recipe {
  id: string
  title: string
  prepTimeMinutes: number
  proteinPerServingGrams: number
  category: ProteinCategory
  baseIngredients: Ingredient[]
  steps: string[]
  flavorComplementNote: string
}

export interface GenerateBody {
  baseMeal: string
  availableProteins: string[]
  servings: number
  suppressedProteins: string[]
  recentHistory?: Array<{
    date: string
    proteinItem: string
    category: string
    baseMeal?: string
  }>
}

export interface AdaptBody {
  recipeTitle: string
  missingIngredients?: string[]
  missingIngredient?: string
  steps: string[]
  baseMeal?: string
}

/** Compact schema kept in the user prompt once to cut tokens. */
const RECIPE_JSON_HINT = `JSON:{"recipes":[{"id":"r1","title":"","prepTimeMinutes":0,"proteinPerServingGrams":0,"category":"VEG|NON_VEG|FISH","baseIngredients":[{"item":"","amountPerServing":0,"unit":"","isProteinSource":true}],"steps":["..."],"flavorComplementNote":""}]}`

export const RECIPE_SYSTEM_PROMPT = `Indian home-cook assistant for high-protein sides. Return STRICT JSON only.
Rules: pair with the base meal; use available proteins; avoid suppressed/recent repeats; any Indian region OK; max 4 short steps; max 6 ingredients per recipe.`

export function buildGenerateUserPrompt(input: GenerateBody): string {
  const history =
    input.recentHistory && input.recentHistory.length > 0
      ? input.recentHistory
          .slice(0, 5)
          .map((h) => `${h.date}:${h.proteinItem}`)
          .join(', ')
      : 'none'

  return `Base meal: ${input.baseMeal?.trim() || 'UNSPECIFIED'}
Proteins: ${input.availableProteins.join(', ') || 'UNSPECIFIED'}
Servings: ${input.servings}
Suppress: ${input.suppressedProteins.join(', ') || 'none'}
Recent: ${history}

Return exactly 2 distinct high-protein Indian sides for this base meal.
${RECIPE_JSON_HINT}`
}

export function resolveMissingIngredients(input: AdaptBody): string[] {
  if (input.missingIngredients?.length) {
    return input.missingIngredients.map((item) => item.trim()).filter(Boolean)
  }
  if (input.missingIngredient?.trim()) {
    return [input.missingIngredient.trim()]
  }
  return []
}

export function buildAdaptUserPrompt(input: AdaptBody): string {
  const missing = resolveMissingIngredients(input)
  return `Recipe: ${input.recipeTitle}
Missing: ${missing.join(', ')}
Base meal: ${input.baseMeal?.trim() || 'UNSPECIFIED'}
Steps: ${JSON.stringify(input.steps)}

Rewrite steps without missing items. JSON:{"substitutionNote":"","updatedSteps":["..."]}`
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('Model did not return valid JSON')
  }
}

export type LlmProvider = 'openai' | 'gemini' | 'custom'

export function resolveLlmConfig(env: NodeJS.ProcessEnv = process.env) {
  const provider = (env.LLM_PROVIDER || 'gemini') as LlmProvider
  const apiKey =
    env.GEMINI_API_KEY ||
    env.GOOGLE_API_KEY ||
    env.OPENAI_API_KEY ||
    env.LLM_API_KEY ||
    ''

  const customBase = env.LLM_API_BASE_URL || ''
  // flash-lite is ~5-6x faster than gemini-3.6-flash for this workload
  const model =
    env.LLM_MODEL ||
    (provider === 'gemini' ? 'gemini-flash-lite-latest' : 'gpt-4o-mini')

  let endpoint = 'https://api.openai.com/v1/chat/completions'
  if (provider === 'gemini') {
    endpoint =
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  } else if (provider === 'custom' && customBase) {
    endpoint = `${customBase.replace(/\/$/, '')}/chat/completions`
  }

  return { provider, apiKey, model, endpoint }
}

async function geminiNativeJson(options: {
  system: string
  user: string
  apiKey: string
  model: string
  maxOutputTokens: number
}): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: options.system }] },
      contents: [{ role: 'user', parts: [{ text: options.user }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: options.maxOutputTokens,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`API error ${response.status}: ${detail.slice(0, 240)}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
  if (!content) throw new Error('Empty model response')
  return extractJson(content)
}

async function openAiCompatJson(options: {
  system: string
  user: string
  apiKey: string
  model: string
  endpoint: string
  maxOutputTokens: number
}): Promise<unknown> {
  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0.3,
      max_tokens: options.maxOutputTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`API error ${response.status}: ${detail.slice(0, 240)}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty model response')
  return extractJson(content)
}

export async function chatCompletionJson(options: {
  system: string
  user: string
  env?: NodeJS.ProcessEnv
  maxOutputTokens?: number
}): Promise<unknown> {
  const { provider, apiKey, model, endpoint } = resolveLlmConfig(options.env)
  if (!apiKey) {
    throw new Error('NO_API_KEY')
  }

  const maxOutputTokens = options.maxOutputTokens ?? 900

  if (provider === 'gemini') {
    return geminiNativeJson({
      system: options.system,
      user: options.user,
      apiKey,
      model,
      maxOutputTokens,
    })
  }

  return openAiCompatJson({
    system: options.system,
    user: options.user,
    apiKey,
    model,
    endpoint,
    maxOutputTokens,
  })
}

export async function generateRecipesFromLlm(
  body: GenerateBody,
  env?: NodeJS.ProcessEnv,
) {
  const json = (await chatCompletionJson({
    system: RECIPE_SYSTEM_PROMPT,
    user: buildGenerateUserPrompt(body),
    env,
    maxOutputTokens: 900,
  })) as { recipes?: Recipe[] }

  if (!json.recipes?.length) {
    throw new Error('No recipes in response')
  }
  return json.recipes.slice(0, 2)
}

export async function adaptRecipeFromLlm(
  body: AdaptBody,
  env?: NodeJS.ProcessEnv,
) {
  const missing = resolveMissingIngredients(body)
  if (!missing.length) {
    throw new Error('No missing ingredients provided')
  }

  const json = (await chatCompletionJson({
    system:
      'Adapt Indian home recipes when ingredients are missing. STRICT JSON only.',
    user: buildAdaptUserPrompt(body),
    env,
    maxOutputTokens: 500,
  })) as { substitutionNote?: string; updatedSteps?: string[] }

  if (!json.substitutionNote || !json.updatedSteps?.length) {
    throw new Error('Invalid adaptation payload')
  }
  return json
}
