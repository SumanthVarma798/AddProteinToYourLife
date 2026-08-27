import { useMemo, useState } from 'react'
import { PrimaryButton } from '../components/PrimaryButton'
import type { Recipe } from '../types'

type Props = {
  recipes: Recipe[]
  servings: number
  viewMode: 'list' | 'flashcard'
  onViewModeChange: (mode: 'list' | 'flashcard') => void
  onToggleIngredient: (recipeId: string, ingredientItem: string) => void
  onCooked: (recipe: Recipe) => void
  usedMockHint?: boolean
  error?: string | null
}

export function RecipeResultsScreen({
  recipes,
  servings,
  viewMode,
  onViewModeChange,
  onToggleIngredient,
  onCooked,
  usedMockHint,
  error,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [flashStep, setFlashStep] = useState(0)

  const active = recipes[activeIndex] ?? recipes[0]

  const scaledIngredients = useMemo(() => {
    if (!active) return []
    return active.baseIngredients.map((ing) => ({
      ...ing,
      total: +(ing.amountPerServing * servings).toFixed(2),
    }))
  }, [active, servings])

  if (!active) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-lg text-ink">No recipes yet. Go back and generate.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5">
      {usedMockHint ? (
        <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          Showing kitchen-tested starter recipes. Add an API key in Settings for
          fresh AI suggestions.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-nonveg/10 px-3 py-2 text-sm font-medium text-nonveg">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <PrimaryButton
          fullWidth
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          onClick={() => onViewModeChange('list')}
        >
          List View
        </PrimaryButton>
        <PrimaryButton
          fullWidth
          variant={viewMode === 'flashcard' ? 'primary' : 'secondary'}
          onClick={() => {
            onViewModeChange('flashcard')
            setFlashStep(0)
          }}
        >
          Flashcards
        </PrimaryButton>
      </div>

      {recipes.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {recipes.map((recipe, index) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => {
                setActiveIndex(index)
                setFlashStep(0)
              }}
              className={`touch-target shrink-0 rounded-xl border-2 px-3 text-sm font-semibold ${
                index === activeIndex
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-ink'
              }`}
            >
              {recipe.title}
            </button>
          ))}
        </div>
      ) : null}

      <article className="rounded-2xl border border-border bg-white p-4">
        <h1 className="text-2xl font-bold text-ink">{active.title}</h1>
        <p className="mt-1 text-base text-muted">
          {active.prepTimeMinutes} min · ~{active.proteinPerServingGrams}g
          protein/serving · {active.category.replace('_', '-')}
        </p>
        <p className="mt-2 text-base text-ink">{active.flavorComplementNote}</p>
        {active.substitutionNote ? (
          <p className="mt-2 rounded-lg bg-fish/10 px-3 py-2 text-sm font-medium text-fish">
            {active.substitutionNote}
          </p>
        ) : null}
      </article>

      {viewMode === 'list' ? (
        <>
          <section>
            <h2 className="mb-2 text-lg font-bold text-ink">
              Ingredients for {servings}
            </h2>
            <ul className="flex flex-col gap-2">
              {scaledIngredients.map((ing) => (
                <li key={ing.item}>
                  <button
                    type="button"
                    onClick={() => onToggleIngredient(active.id, ing.item)}
                    className={`touch-target flex w-full items-center justify-between rounded-xl border-2 px-3 text-left text-base ${
                      ing.missing
                        ? 'border-nonveg/40 bg-nonveg/5 text-muted line-through'
                        : 'border-border bg-surface text-ink'
                    }`}
                  >
                    <span>
                      {ing.missing ? 'Missing · ' : ''}
                      {ing.item}
                      {ing.isProteinSource ? ' (protein)' : ''}
                    </span>
                    <span className="font-semibold">
                      {ing.total} {ing.unit}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">
              Tap an ingredient if you do not have it - we will adapt the steps.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-ink">Steps</h2>
            <ol className="flex flex-col gap-3">
              {active.steps.map((step, i) => (
                <li
                  key={`${active.id}-step-${i}`}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-left text-lg leading-snug text-ink"
                >
                  <span className="mr-2 font-bold text-primary">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : (
        <section className="flex flex-1 flex-col gap-4">
          <div className="flex min-h-48 flex-1 items-center justify-center rounded-2xl border-2 border-primary/30 bg-white px-5 py-8 text-center">
            <p className="text-2xl font-bold leading-snug text-ink">
              {active.steps[flashStep] ?? 'Done!'}
            </p>
          </div>
          <p className="text-center text-sm font-semibold text-muted">
            Step {Math.min(flashStep + 1, active.steps.length)} of{' '}
            {active.steps.length}
          </p>
          <div className="flex gap-2">
            <PrimaryButton
              variant="secondary"
              onClick={() => setFlashStep((s) => Math.max(0, s - 1))}
              disabled={flashStep === 0}
            >
              Previous
            </PrimaryButton>
            <PrimaryButton
              onClick={() =>
                setFlashStep((s) => Math.min(active.steps.length - 1, s + 1))
              }
              disabled={flashStep >= active.steps.length - 1}
            >
              Next Step
            </PrimaryButton>
          </div>
        </section>
      )}

      <div className="safe-bottom pt-2">
        <PrimaryButton onClick={() => onCooked(active)}>
          Cooked This! (Save to Calendar)
        </PrimaryButton>
      </div>
    </div>
  )
}
