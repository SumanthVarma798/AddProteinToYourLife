import { useCallback, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { ScreenTransition } from './components/ScreenTransition'
import { bumpRecentBaseMeal, logCookedMeal } from './db'
import { categoryForProtein } from './data/proteins'
import { adaptRecipe, generateRecipes } from './lib/llm'
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

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL)
  const [usedMock, setUsedMock] = useState(false)

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
    if (state.baseMeal.trim()) {
      await bumpRecentBaseMeal(state.baseMeal.trim())
    }

    const [suppressed, weekLogs] = await Promise.all([
      getSuppressedProteins(),
      getRollingWeekLogs(),
    ])
    const ranked = rankProteinsForSuggestion(
      state.selectedProteins,
      weekLogs,
    )

    const recentHistory = [...weekLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((l) => l.category !== 'NONE')
      .slice(0, 14)
      .map((l) => ({
        date: l.date,
        proteinItem: l.proteinItem,
        category: l.category,
        baseMeal: l.baseMeal,
      }))

    try {
      const result = await generateRecipes({
        baseMeal: state.baseMeal.trim(),
        availableProteins: ranked,
        servings: state.servings,
        suppressedProteins: suppressed,
        recentHistory,
      })
      setUsedMock(result.usedMock)
      setState((prev) => ({
        ...prev,
        recipes: result.recipes,
        activeRecipeId: result.recipes[0]?.id ?? null,
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

  const handleToggleIngredient = async (
    recipeId: string,
    ingredientItem: string,
  ) => {
    const recipe = state.recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    const ingredient = recipe.baseIngredients.find(
      (i) => i.item === ingredientItem,
    )
    if (!ingredient) return

    const makingMissing = !ingredient.missing
    let nextRecipe: Recipe = {
      ...recipe,
      baseIngredients: recipe.baseIngredients.map((i) =>
        i.item === ingredientItem ? { ...i, missing: makingMissing } : i,
      ),
    }

    if (makingMissing) {
      const adapted = await adaptRecipe({
        recipeTitle: recipe.title,
        missingIngredient: ingredientItem,
        steps: recipe.steps,
        baseMeal: state.baseMeal.trim(),
      })
      nextRecipe = {
        ...nextRecipe,
        substitutionNote: adapted.substitutionNote,
        steps: adapted.updatedSteps,
      }
    } else {
      nextRecipe = { ...nextRecipe, substitutionNote: undefined }
    }

    setState((prev) => ({
      ...prev,
      recipes: prev.recipes.map((r) => (r.id === recipeId ? nextRecipe : r)),
    }))
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

  const showFlowHeader =
    state.currentStep !== 'CALENDAR' && state.currentStep !== 'SETTINGS'
  const showBack =
    state.currentStep === 'PROTEIN_SELECT' ||
    state.currentStep === 'SERVINGS_REVIEW' ||
    state.currentStep === 'RECIPE_RESULTS' ||
    state.currentStep === 'SETTINGS'

  return (
    <div className="flex min-h-[100dvh] flex-col bg-cream">
      {showFlowHeader ? (
        <AppHeader
          stepLabel={stepLabel(state.currentStep)}
          showBack={showBack}
          onBack={handleBack}
          onCalendar={openCalendar}
          onSettings={
            state.currentStep === 'BASE_MEAL' ? openSettings : undefined
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
            onToggleIngredient={(id, item) =>
              void handleToggleIngredient(id, item)
            }
            onCooked={(recipe) => void handleCooked(recipe)}
            usedMockHint={usedMock}
            error={state.generateError}
          />
        ) : null}

        {state.currentStep === 'CALENDAR' ? (
          <CalendarScreen onHome={goHome} onSettings={openSettings} />
        ) : null}

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
