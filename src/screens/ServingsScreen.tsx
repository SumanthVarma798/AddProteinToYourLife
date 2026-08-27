import { Minus, Plus } from '@phosphor-icons/react'
import { PrimaryButton } from '../components/PrimaryButton'

type Props = {
  baseMeal: string
  proteins: string[]
  servings: number
  onServingsChange: (n: number) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function ServingsScreen({
  baseMeal,
  proteins,
  servings,
  onServingsChange,
  onGenerate,
  isGenerating,
}: Props) {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-ink">
          How many people are eating?
        </h1>
        <p className="mt-1 text-base text-muted">
          Default is 3 servings for a family plate.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 rounded-2xl border border-border bg-surface px-4 py-6">
        <button
          type="button"
          className="touch-target inline-flex items-center justify-center rounded-xl border-2 border-primary text-primary"
          onClick={() => onServingsChange(Math.max(1, servings - 1))}
          aria-label="Decrease servings"
        >
          <Minus size={28} weight="bold" />
        </button>
        <div className="min-w-20 text-center">
          <p className="text-5xl font-bold text-ink">{servings}</p>
          <p className="text-sm font-medium text-muted">servings</p>
        </div>
        <button
          type="button"
          className="touch-target inline-flex items-center justify-center rounded-xl border-2 border-primary text-primary"
          onClick={() => onServingsChange(Math.min(12, servings + 1))}
          aria-label="Increase servings"
        >
          <Plus size={28} weight="bold" />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 text-left">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">
          Summary
        </p>
        <p className="mt-2 text-lg text-ink">
          <span className="font-semibold">Base meal:</span>{' '}
          {baseMeal.trim() || 'Not specified'}
        </p>
        <p className="mt-1 text-lg text-ink">
          <span className="font-semibold">Proteins:</span>{' '}
          {proteins.join(', ')}
        </p>
      </div>

      {isGenerating ? (
        <div
          className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center text-base font-semibold text-primary"
          role="status"
          aria-live="polite"
        >
          Generating protein dishes...
        </div>
      ) : null}

      <div className="mt-auto safe-bottom pt-4">
        <PrimaryButton onClick={onGenerate} disabled={isGenerating}>
          Generate Protein Dishes
        </PrimaryButton>
      </div>
    </div>
  )
}
