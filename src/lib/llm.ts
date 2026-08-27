import { buildMockRecipes } from '../data/mockRecipes'
import { getSetting } from '../db'
import type {
  AdaptationResponse,
  LlmProvider,
  Recipe,
  RecipesResponse,
} from '../types'

const SYSTEM_PROMPT = `You are an expert Telangana South Indian culinary assistant specializing in high-protein meal pairings.
Return STRICT JSON matching the schema below. Do not output any markdown headers or text outside the JSON.

OUTPUT FORMAT (STRICT JSON):
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
      "flavorComplementNote": "Pairs well with rice and dal."
    }
  ]
}`

function providerEndpoint(provider: LlmProvider, customBase?: string): string {
  if (provider === 'custom' && customBase) {
    return `${customBase.replace(/\/$/, '')}/chat/completions`
  }
  if (provider === 'gemini') {
    return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
  }
  return 'https://api.openai.com/v1/chat/completions'
}

function defaultModel(provider: LlmProvider): string {
  if (provider === 'gemini') return 'gemini-2.0-flash'
  return 'gpt-4o-mini'
}

function extractJson(text: string): unknown {
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

async function chatCompletion(userPrompt: string): Promise<unknown> {
  const apiKey = await getSetting('API_KEY')
  if (!apiKey) {
    throw new Error('NO_API_KEY')
  }
  const provider = ((await getSetting('LLM_PROVIDER')) ?? 'openai') as LlmProvider
  const customBase = (await getSetting('API_BASE_URL')) ?? undefined
  const model =
    (await getSetting('LLM_MODEL')) ?? defaultModel(provider)

  const response = await fetch(providerEndpoint(provider, customBase), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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
  return extractJson(content)
}

export async function generateRecipes(input: {
  baseMeal: string
  availableProteins: string[]
  servings: number
  suppressedProteins: string[]
}): Promise<{ recipes: Recipe[]; usedMock: boolean }> {
  const userPrompt = `Today's Base Meal: ${input.baseMeal || 'UNSPECIFIED'}
Available Proteins in Kitchen: ${input.availableProteins.join(', ') || 'UNSPECIFIED'}
Number of Servings: ${input.servings}
Suppressed Proteins (cooked in last 2 days): ${input.suppressedProteins.join(', ') || 'None'}

Suggest 2-4 high-protein Telangana-friendly side dishes using only available proteins when possible.`

  try {
    const json = (await chatCompletion(userPrompt)) as RecipesResponse
    if (!json.recipes?.length) throw new Error('No recipes in response')
    return { recipes: json.recipes, usedMock: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message !== 'NO_API_KEY') {
      console.warn('Falling back to mock recipes:', message)
    }
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

export async function adaptRecipe(input: {
  recipeTitle: string
  missingIngredient: string
  steps: string[]
}): Promise<AdaptationResponse> {
  const userPrompt = `The user is missing "${input.missingIngredient}" from the recipe "${input.recipeTitle}".
Current steps: ${JSON.stringify(input.steps)}
Return STRICT JSON:
{
  "substitutionNote": "...",
  "updatedSteps": ["..."]
}`

  try {
    const json = (await chatCompletion(userPrompt)) as AdaptationResponse
    if (!json.substitutionNote || !json.updatedSteps?.length) {
      throw new Error('Invalid adaptation payload')
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
