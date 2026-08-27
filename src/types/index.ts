export type ScreenStep =
  | 'BASE_MEAL'
  | 'PROTEIN_SELECT'
  | 'SERVINGS_REVIEW'
  | 'RECIPE_RESULTS'
  | 'CALENDAR'
  | 'SETTINGS'

export type ProteinCategory = 'VEG' | 'NON_VEG' | 'FISH'

export type MealCategory = ProteinCategory | 'NONE'

export interface AppState {
  currentStep: ScreenStep
  previousStep: ScreenStep
  baseMeal: string
  selectedProteins: string[]
  servings: number
  activeRecipeId: string | null
  recipes: Recipe[]
  recipeViewMode: 'list' | 'flashcard'
  isGenerating: boolean
  generateError: string | null
}

export interface Ingredient {
  item: string
  amountPerServing: number
  unit: string
  isProteinSource: boolean
  missing?: boolean
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
  substitutionNote?: string
}

export interface RecipesResponse {
  recipes: Recipe[]
}

export interface AdaptationResponse {
  substitutionNote: string
  updatedSteps: string[]
}

export type LlmProvider = 'openai' | 'gemini' | 'custom'

export interface ProteinOption {
  id: string
  label: string
  category: ProteinCategory
}
