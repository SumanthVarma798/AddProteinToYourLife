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
  /** Preferred: all missing ingredients selected by the cook. */
  missingIngredients?: string[]
  /** Legacy single-ingredient field. */
  missingIngredient?: string
  steps: string[]
  baseMeal?: string
}

export const RECIPE_SYSTEM_PROMPT = `You are an expert Indian home-cooking assistant specializing in high-protein meal pairings for elderly cooks.
Return STRICT JSON only. No markdown fences. No commentary outside JSON.

Rules:
- Base meals are often South Indian (pappu, pulusu, fry curry, rice plates), but protein side dishes may come from ANY region of India (North, South, East, West, coastal, etc.) when they pair well.
- Recipes must complement the given base meal.
- Use ONLY proteins from the available kitchen list when possible.
- Avoid suppressed proteins and avoid repeating the same protein from recent history when alternatives exist.
- Steps must be short, clear, and large-print friendly (simple verbs, no jargon).
- Prefer common Indian home-kitchen techniques and seasonings.
- Scale ingredient amounts as per-serving values.

OUTPUT FORMAT:
{
  "recipes": [
    {
      "id": "recipe_1",
      "title": "Egg Pepper Roast",
      "prepTimeMinutes": 15,
      "proteinPerServingGrams": 18,
      "category": "NON_VEG",
      "baseIngredients": [
        { "item": "Eggs", "amountPerServing": 2, "unit": "whole", "isProteinSource": true }
      ],
      "steps": ["Step one.", "Step two."],
      "flavorComplementNote": "Pairs well with rice and the given base meal."
    }
  ]
}`

export function buildGenerateUserPrompt(input: GenerateBody): string {
  const historyLines =
    input.recentHistory && input.recentHistory.length > 0
      ? input.recentHistory
          .map((h) => {
            const base = h.baseMeal ? ` with ${h.baseMeal}` : ''
            return `- ${h.date}: ${h.proteinItem} (${h.category})${base}`
          })
          .join('\n')
      : '- None logged yet'

  return `CONTEXT FOR TODAY'S SUGGESTIONS:
- Today's base meal already cooked (often South Indian): ${input.baseMeal?.trim() || 'UNSPECIFIED'}
- Proteins available in the kitchen now: ${input.availableProteins.join(', ') || 'UNSPECIFIED'}
- Number of servings: ${input.servings}
- Proteins to suppress (cooked heavily in last 2 days): ${input.suppressedProteins.join(', ') || 'None'}
- Recent protein history (newest first):
${historyLines}

TASK:
Suggest 2-4 DISTINCT high-protein Indian side dishes that pair specifically with today's base meal.
Sides may be from any Indian region; they do not need to be South Indian style.
Vary categories when possible. Prefer proteins not seen recently in history.
Return STRICT JSON matching the schema.`
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
  return `The cook is missing these ingredients from the recipe "${input.recipeTitle}": ${missing.join(', ') || 'None'}.
Base meal on the table: ${input.baseMeal?.trim() || 'UNSPECIFIED'}
Original steps: ${JSON.stringify(input.steps)}

Rewrite the recipe steps so it still works without the missing ingredients.
Use practical Indian home-kitchen substitutions from any region when helpful.
Return STRICT JSON:
{
  "substitutionNote": "Short practical note about what changed.",
  "updatedSteps": ["..."]
}`
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
  const model =
    env.LLM_MODEL ||
    (provider === 'gemini' ? 'gemini-3.6-flash' : 'gpt-4o-mini')

  let endpoint = 'https://api.openai.com/v1/chat/completions'
  if (provider === 'gemini') {
    endpoint =
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  } else if (provider === 'custom' && customBase) {
    endpoint = `${customBase.replace(/\/$/, '')}/chat/completions`
  }

  return { provider, apiKey, model, endpoint }
}

export async function chatCompletionJson(options: {
  system: string
  user: string
  env?: NodeJS.ProcessEnv
}): Promise<unknown> {
  const { apiKey, model, endpoint } = resolveLlmConfig(options.env)
  if (!apiKey) {
    throw new Error('NO_API_KEY')
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

export async function generateRecipesFromLlm(
  body: GenerateBody,
  env?: NodeJS.ProcessEnv,
) {
  const json = (await chatCompletionJson({
    system: RECIPE_SYSTEM_PROMPT,
    user: buildGenerateUserPrompt(body),
    env,
  })) as { recipes?: Recipe[] }

  if (!json.recipes?.length) {
    throw new Error('No recipes in response')
  }
  return json.recipes
}

export async function adaptRecipeFromLlm(body: AdaptBody, env?: NodeJS.ProcessEnv) {
  const missing = resolveMissingIngredients(body)
  if (!missing.length) {
    throw new Error('No missing ingredients provided')
  }

  const json = (await chatCompletionJson({
    system:
      'You adapt Indian home recipes when ingredients are missing. Return STRICT JSON only.',
    user: buildAdaptUserPrompt(body),
    env,
  })) as { substitutionNote?: string; updatedSteps?: string[] }

  if (!json.substitutionNote || !json.updatedSteps?.length) {
    throw new Error('Invalid adaptation payload')
  }
  return json
}
