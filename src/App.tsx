import { useCallback, useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ScreenTransition } from './components/ScreenTransition'
import { bumpRecentBaseMeal, logCookedMeal } from './db'
import { categoryForProtein } from './data/proteins'
import { adaptRecipe, generateRecipes } from './lib/llm'
import { parseBaseMeals } from './lib/dates'
import {
  getSuppressedProteins,
  rankProteinsForSuggestion,
  getRollingWeekLogs,
} from './lib/rotation'
import { BaseMealScreen } from './screens/BaseMealScreen'
import { CalendarScreen } from './screens/CalendarScreen'
import { ProteinSelectScreen } from './screens/ProteinSelectScreen'
import { RecipeResultsScreen } from './screens/RecipeResultsScreen'
import { ServingsScreen } from './screens/ServingsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import type { AppState, Recipe, ScreenStep } from './types'

const INITIAL: AppState = {
  currentStep: 'BASE_MEAL',
  previousStep: 'BASE_MEAL',
  baseMeal: '',
  selectedProteins: [],
  servings: 3,
  activeRecipeId: null,
  recipes: [],
  recipeViewMode: 'list',
  isGenerating: false,
  generateError: null,
}

function stepLabel(step: ScreenStep): string | undefined {
  if (step === 'BASE_MEAL') return 'Step 1 of 3'
  if (step === 'PROTEIN_SELECT') return 'Step 2 of 3'
  if (step === 'SERVINGS_REVIEW') return 'Step 3 of 3'
  return undefined
}

function withOriginalSteps(recipes: Recipe[]): Recipe[] {
  return recipes.map((recipe) => ({
    ...recipe,
    originalSteps: recipe.originalSteps ?? [...recipe.steps],
    baseIngredients: recipe.baseIngredients.map((ing) => ({ ...ing })),
  }))
}

function prefetchKey(
  baseMeal: string,
  proteins: string[],
  servings: number,
): string {
  return JSON.stringify({
    baseMeal: baseMeal.trim(),
    proteins: [...proteins].sort(),
    servings,
  })
}

async function loadRecipeContext(
  baseMeal: string,
  selectedProteins: string[],
  servings: number,
) {
  const [suppressed, weekLogs] = await Promise.all([
    getSuppressedProteins(),
    getRollingWeekLogs(),
  ])
  const ranked = rankProteinsForSuggestion(selectedProteins, weekLogs)
  const recentHistory = [...weekLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((l) => l.category !== 'NONE')
    .slice(0, 5)
    .map((l) => ({
      date: l.date,
      proteinItem: l.proteinItem,
      category: l.category,
      baseMeal: l.baseMeal,
    }))

  return {
    baseMeal: baseMeal.trim(),
    availableProteins: ranked,
    servings,
    suppressedProteins: suppressed,
    recentHistory,
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL)
  const [usedMock, setUsedMock] = useState(false)
  const [isAdapting, setIsAdapting] = useState(false)
  const prefetchRef = useRef<{
    key: string
    promise: Promise<{ recipes: Recipe[]; usedMock: boolean }>
  } | null>(null)

  const goTo = useCallback((step: ScreenStep) => {
    setState((prev) => ({
      ...prev,
      previousStep: prev.currentStep,
      currentStep: step,
    }))
  }, [])

  const openCalendar = () => goTo('CALENDAR')
  const openSettings = () => goTo('SETTINGS')
  const goHome = () =>
    setState((prev) => ({
      ...prev,
      currentStep: 'BASE_MEAL',
      previousStep: 'BASE_MEAL',
    }))

  // Prefetch recipes while mom reviews servings so Generate feels instant.
  useEffect(() => {
    if (state.currentStep !== 'SERVINGS_REVIEW') return
    if (state.selectedProteins.length === 0) return

    const key = prefetchKey(
      state.baseMeal,
      state.selectedProteins,
      state.servings,
    )
    if (prefetchRef.current?.key === key) return

    const promise = loadRecipeContext(
      state.baseMeal,
      state.selectedProteins,
      state.servings,
    ).then((input) => generateRecipes(input))

    prefetchRef.current = { key, promise }
    void promise.catch(() => {
      if (prefetchRef.current?.key === key) {
        prefetchRef.current = null
      }
    })
  }, [
    state.currentStep,
    state.baseMeal,
    state.selectedProteins,
    state.servings,
  ])

  const handleBack = () => {
    setState((prev) => {
      if (prev.currentStep === 'PROTEIN_SELECT') {
        return { ...prev, currentStep: 'BASE_MEAL' }
      }
      if (prev.currentStep === 'SERVINGS_REVIEW') {
        return { ...prev, currentStep: 'PROTEIN_SELECT' }
      }
      if (prev.currentStep === 'RECIPE_RESULTS') {
        return { ...prev, currentStep: 'SERVINGS_REVIEW' }
      }
      if (prev.currentStep === 'CALENDAR' || prev.currentStep === 'SETTINGS') {
        return { ...prev, currentStep: prev.previousStep }
      }
      return prev
    })
  }

  const toggleProtein = (label: string) => {
    setState((prev) => {
      const exists = prev.selectedProteins.includes(label)
      return {
        ...prev,
        selectedProteins: exists
          ? prev.selectedProteins.filter((p) => p !== label)
          : [...prev.selectedProteins, label],
      }
    })
  }

  const handleGenerate = async () => {
    setState((prev) => ({
      ...prev,
      isGenerating: true,
      generateError: null,
    }))

    const meals = parseBaseMeals(state.baseMeal)
    await Promise.all(meals.map((meal) => bumpRecentBaseMeal(meal)))

    const key = prefetchKey(
      state.baseMeal,
      state.selectedProteins,
      state.servings,
    )

    try {
      let result: { recipes: Recipe[]; usedMock: boolean }
      if (prefetchRef.current?.key === key) {
        result = await prefetchRef.current.promise
      } else {
        const input = await loadRecipeContext(
          state.baseMeal,
          state.selectedProteins,
          state.servings,
        )
        result = await generateRecipes(input)
      }

      setUsedMock(result.usedMock)
      const recipes = withOriginalSteps(result.recipes)
      setState((prev) => ({
        ...prev,
        recipes,
        activeRecipeId: recipes[0]?.id ?? null,
        isGenerating: false,
        currentStep: 'RECIPE_RESULTS',
        previousStep: 'SERVINGS_REVIEW',
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        generateError:
          error instanceof Error ? error.message : 'Could not generate recipes',
      }))
    }
  }

  const handleToggleIngredient = (recipeId: string, ingredientItem: string) => {
    setState((prev) => ({
      ...prev,
      recipes: prev.recipes.map((recipe) => {
        if (recipe.id !== recipeId) return recipe
        return {
          ...recipe,
          baseIngredients: recipe.baseIngredients.map((ing) =>
            ing.item === ingredientItem
              ? { ...ing, missing: !ing.missing }
              : ing,
          ),
        }
      }),
    }))
  }

  const handleRegenerate = async (recipeId: string) => {
    const recipe = state.recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    const missing = recipe.baseIngredients
      .filter((ing) => ing.missing)
      .map((ing) => ing.item)
    const baselineSteps = recipe.originalSteps ?? recipe.steps

    setIsAdapting(true)
    setState((prev) => ({ ...prev, generateError: null }))

    try {
      if (missing.length === 0) {
        setState((prev) => ({
          ...prev,
          recipes: prev.recipes.map((r) =>
            r.id === recipeId
              ? {
                  ...r,
                  steps: [...baselineSteps],
                  substitutionNote: undefined,
                }
              : r,
          ),
        }))
      } else {
        const adapted = await adaptRecipe({
          recipeTitle: recipe.title,
          missingIngredients: missing,
          steps: baselineSteps,
          baseMeal: state.baseMeal.trim(),
        })
        setState((prev) => ({
          ...prev,
          recipes: prev.recipes.map((r) =>
            r.id === recipeId
              ? {
                  ...r,
                  steps: adapted.updatedSteps,
                  substitutionNote: adapted.substitutionNote,
                }
              : r,
          ),
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        generateError:
          error instanceof Error
            ? error.message
            : 'Could not update the recipe',
      }))
    } finally {
      setIsAdapting(false)
    }
  }

  const handleCooked = async (recipe: Recipe) => {
    const protein =
      recipe.baseIngredients.find((i) => i.isProteinSource)?.item ??
      recipe.title
    await logCookedMeal({
      proteinItem: protein,
      category: recipe.category ?? categoryForProtein(protein),
      baseMeal: state.baseMeal.trim() || undefined,
    })
    goTo('CALENDAR')
  }

  const showFlowHeader = state.currentStep !== 'SETTINGS'
  const showBack =
    state.currentStep === 'PROTEIN_SELECT' ||
    state.currentStep === 'SERVINGS_REVIEW' ||
    state.currentStep === 'RECIPE_RESULTS'
  const isCalendar = state.currentStep === 'CALENDAR'

  return (
    <div className="flex min-h-[100dvh] flex-col bg-cream">
      {showFlowHeader ? (
        <AppHeader
          title={isCalendar ? 'Calendar' : 'Add Protein'}
          stepLabel={isCalendar ? undefined : stepLabel(state.currentStep)}
          showBack={showBack}
          onBack={handleBack}
          onCalendar={isCalendar ? undefined : openCalendar}
          onHome={isCalendar ? goHome : undefined}
          showCalendar={!isCalendar}
          onSettings={
            state.currentStep === 'BASE_MEAL' || isCalendar
              ? openSettings
              : undefined
          }
        />
      ) : null}

      <ScreenTransition stepKey={state.currentStep}>
        {state.currentStep === 'BASE_MEAL' ? (
          <BaseMealScreen
            value={state.baseMeal}
            onChange={(baseMeal) => setState((p) => ({ ...p, baseMeal }))}
            onNext={() => goTo('PROTEIN_SELECT')}
          />
        ) : null}

        {state.currentStep === 'PROTEIN_SELECT' ? (
          <ProteinSelectScreen
            selected={state.selectedProteins}
            onToggle={toggleProtein}
            onNext={() => goTo('SERVINGS_REVIEW')}
          />
        ) : null}

        {state.currentStep === 'SERVINGS_REVIEW' ? (
          <ServingsScreen
            baseMeal={state.baseMeal}
            proteins={state.selectedProteins}
            servings={state.servings}
            onServingsChange={(servings) =>
              setState((p) => ({ ...p, servings }))
            }
            onGenerate={() => void handleGenerate()}
            isGenerating={state.isGenerating}
          />
        ) : null}

        {state.currentStep === 'RECIPE_RESULTS' ? (
          <RecipeResultsScreen
            recipes={state.recipes}
            servings={state.servings}
            viewMode={state.recipeViewMode}
            onViewModeChange={(recipeViewMode) =>
              setState((p) => ({ ...p, recipeViewMode }))
            }
            onToggleIngredient={handleToggleIngredient}
            onRegenerate={(id) => void handleRegenerate(id)}
            isAdapting={isAdapting}
            onCooked={(recipe) => void handleCooked(recipe)}
            usedMockHint={usedMock}
            error={state.generateError}
          />
        ) : null}

        {state.currentStep === 'CALENDAR' ? <CalendarScreen /> : null}

        {state.currentStep === 'SETTINGS' ? (
          <div className="flex flex-1 flex-col">
            <AppHeader
              title="Settings"
              showBack
              onBack={handleBack}
              showCalendar={false}
            />
            <SettingsScreen onClose={handleBack} />
          </div>
        ) : null}
      </ScreenTransition>
    </div>
  )
}
