import { useEffect, useMemo, useState } from 'react'
import { GeneratingWaitCard } from '../components/GeneratingWaitCard'
import { PrimaryButton } from '../components/PrimaryButton'
import type { Recipe } from '../types'

type Props = {
  recipe: Recipe
  servings: number
  viewMode: 'list' | 'flashcard'
  onViewModeChange: (mode: 'list' | 'flashcard') => void
  onToggleIngredient: (recipeId: string, ingredientItem: string) => void
  onRegenerate: (recipeId: string) => void
  isAdapting: boolean
  onCooked: (recipe: Recipe) => void
  error?: string | null
}

export function RecipeDetailScreen({
  recipe,
  servings,
  viewMode,
  onViewModeChange,
  onToggleIngredient,
  onRegenerate,
  isAdapting,
  onCooked,
  error,
}: Props) {
  const [flashStep, setFlashStep] = useState(0)
  const [baselineMissing, setBaselineMissing] = useState<string[]>([])

  useEffect(() => {
    setFlashStep(0)
    setBaselineMissing(
      recipe.baseIngredients.filter((i) => i.missing).map((i) => i.item),
    )
  }, [recipe.id])

  useEffect(() => {
    if (isAdapting) return
    setBaselineMissing(
      recipe.baseIngredients.filter((i) => i.missing).map((i) => i.item),
    )
  }, [isAdapting, recipe])

  const scaledIngredients = useMemo(
    () =>
      recipe.baseIngredients.map((ing) => ({
        ...ing,
        total: +(ing.amountPerServing * servings).toFixed(2),
      })),
    [recipe, servings],
  )

  const currentMissing = useMemo(
    () => recipe.baseIngredients.filter((i) => i.missing).map((i) => i.item),
    [recipe],
  )

  const hasPendingChanges = useMemo(() => {
    const a = [...baselineMissing].sort().join('|')
    const b = [...currentMissing].sort().join('|')
    return a !== b
  }, [baselineMissing, currentMissing])

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5">
      {error ? (
        <p className="rounded-xl bg-nonveg/10 px-3 py-2 text-sm font-medium text-nonveg">
          {error}
        </p>
      ) : null}

      {isAdapting ? (
        <GeneratingWaitCard message="Updating recipe for missing ingredients..." />
      ) : null}

      <div className="flex gap-2">
        <PrimaryButton
          fullWidth
          variant={viewMode === 'list' ? 'primary' : 'secondary'}
          onClick={() => onViewModeChange('list')}
          disabled={isAdapting}
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
          disabled={isAdapting}
        >
          Flashcards
        </PrimaryButton>
      </div>

      <article className="rounded-2xl border border-border bg-white p-4">
        <h1 className="text-2xl font-bold text-ink">{recipe.title}</h1>
        <p className="mt-1 text-base text-muted">
          {recipe.prepTimeMinutes} min · ~{recipe.proteinPerServingGrams}g
          protein/serving · {recipe.category.replace('_', '-')}
        </p>
        <p className="mt-2 text-base text-ink">{recipe.flavorComplementNote}</p>
        {recipe.substitutionNote ? (
          <p className="mt-2 rounded-lg bg-fish/10 px-3 py-2 text-sm font-medium text-fish">
            {recipe.substitutionNote}
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
                    onClick={() => onToggleIngredient(recipe.id, ing.item)}
                    disabled={isAdapting}
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
              Tap ingredients you do not have. When ready, regenerate the
              recipe.
            </p>
            {hasPendingChanges ? (
              <div className="mt-3">
                <PrimaryButton
                  onClick={() => onRegenerate(recipe.id)}
                  disabled={isAdapting}
                >
                  Regenerate Recipe
                </PrimaryButton>
              </div>
            ) : null}
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-ink">Steps</h2>
            <ol className="flex flex-col gap-3">
              {recipe.steps.map((step, i) => (
                <li
                  key={`${recipe.id}-step-${i}`}
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
              {recipe.steps[flashStep] ?? 'Done!'}
            </p>
          </div>
          <p className="text-center text-sm font-semibold text-muted">
            Step {Math.min(flashStep + 1, recipe.steps.length)} of{' '}
            {recipe.steps.length}
          </p>
          <div className="flex gap-2">
            <PrimaryButton
              variant="secondary"
              onClick={() => setFlashStep((s) => Math.max(0, s - 1))}
              disabled={flashStep === 0 || isAdapting}
            >
              Previous
            </PrimaryButton>
            <PrimaryButton
              onClick={() =>
                setFlashStep((s) => Math.min(recipe.steps.length - 1, s + 1))
              }
              disabled={flashStep >= recipe.steps.length - 1 || isAdapting}
            >
              Next Step
            </PrimaryButton>
          </div>
        </section>
      )}

      <div className="safe-bottom pt-2">
        <PrimaryButton onClick={() => onCooked(recipe)} disabled={isAdapting}>
          Cooked This! (Save to Calendar)
        </PrimaryButton>
      </div>
    </div>
  )
}
