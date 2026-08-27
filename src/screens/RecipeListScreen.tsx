import { CaretRight } from '@phosphor-icons/react'
import type { Recipe } from '../types'

type Props = {
  recipes: Recipe[]
  usedMockHint?: boolean
  error?: string | null
  onSelect: (recipeId: string) => void
}

const CATEGORY_LABEL: Record<string, string> = {
  VEG: 'Vegetarian',
  NON_VEG: 'Non-veg',
  FISH: 'Seafood',
}

const CATEGORY_TONE: Record<string, string> = {
  VEG: 'text-veg',
  NON_VEG: 'text-nonveg',
  FISH: 'text-fish',
}

export function RecipeListScreen({
  recipes,
  usedMockHint,
  error,
  onSelect,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Choose a protein dish</h1>
        <p className="mt-1 text-base text-muted">
          {recipes.length} suggestion{recipes.length === 1 ? '' : 's'} ready.
          Tap one to open.
        </p>
      </div>

      {usedMockHint ? (
        <p className="mb-3 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          Showing starter recipes offline. Live Gemini suggestions appear when
          the server API key is configured.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl bg-nonveg/10 px-3 py-2 text-sm font-medium text-nonveg">
          {error}
        </p>
      ) : null}

      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <button
              type="button"
              onClick={() => onSelect(recipe.id)}
              className="touch-target flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-white px-4 py-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-ink">{recipe.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {recipe.prepTimeMinutes} min · ~
                  {recipe.proteinPerServingGrams}g protein
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${CATEGORY_TONE[recipe.category] || 'text-muted'}`}
                >
                  {CATEGORY_LABEL[recipe.category] || recipe.category}
                </p>
                {recipe.flavorComplementNote ? (
                  <p className="mt-2 line-clamp-2 text-sm text-ink/80">
                    {recipe.flavorComplementNote}
                  </p>
                ) : null}
              </div>
              <CaretRight
                size={24}
                weight="bold"
                className="shrink-0 text-header-icon"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
