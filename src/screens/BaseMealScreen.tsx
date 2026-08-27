import { useEffect, useMemo, useState } from 'react'
import { Microphone } from '@phosphor-icons/react'
import { PrimaryButton } from '../components/PrimaryButton'
import { DEFAULT_BASE_MEAL_CHIPS } from '../data/proteins'
import { getRecentBaseMeals } from '../db'
import { joinBaseMeals, parseBaseMeals } from '../lib/dates'

type Props = {
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

export function BaseMealScreen({ value, onChange, onNext }: Props) {
  const [chips, setChips] = useState(DEFAULT_BASE_MEAL_CHIPS)
  const selected = useMemo(() => parseBaseMeals(value), [value])

  useEffect(() => {
    void getRecentBaseMeals(3).then((rows) => {
      if (rows.length > 0) {
        setChips(rows.map((r) => r.name))
      }
    })
  }, [])

  const toggleChip = (chip: string) => {
    const current = parseBaseMeals(value)
    const exists = current.some(
      (item) => item.toLowerCase() === chip.toLowerCase(),
    )
    const next = exists
      ? current.filter((item) => item.toLowerCase() !== chip.toLowerCase())
      : [...current, chip]
    onChange(joinBaseMeals(next))
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-ink">
          What did you cook for main meal today?
        </h1>
        <p className="mt-1 text-base text-muted">
          Optional. Tap one or more suggestions.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-ink">
          Dish name
        </span>
        <div className="relative">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Speak or type dish name..."
            className="touch-target w-full rounded-xl border-2 border-border bg-surface px-4 pr-14 text-lg text-ink outline-none focus:border-primary"
            enterKeyHint="done"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <Microphone size={24} weight="bold" />
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          On iPhone, tap the mic on the keyboard to dictate.
        </p>
      </label>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">
          Quick tap last cooked (multi-select)
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const isOn = selected.some(
              (item) => item.toLowerCase() === chip.toLowerCase(),
            )
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                aria-pressed={isOn}
                className={`touch-target rounded-xl border-2 px-4 text-base font-semibold ${
                  isOn
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-ink'
                }`}
              >
                {isOn ? '✓ ' : '+ '}
                {chip}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto safe-bottom pt-4">
        <PrimaryButton onClick={onNext}>Next: Choose Proteins</PrimaryButton>
      </div>
    </div>
  )
}
