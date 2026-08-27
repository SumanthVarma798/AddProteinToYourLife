import { PrimaryButton } from '../components/PrimaryButton'
import { PROTEIN_OPTIONS } from '../data/proteins'
import type { ProteinCategory } from '../types'

type Props = {
  selected: string[]
  onToggle: (label: string) => void
  onNext: () => void
}

const GROUPS: Array<{ title: string; category: ProteinCategory; tone: string }> =
  [
    { title: 'Vegetarian', category: 'VEG', tone: 'text-veg border-veg' },
    {
      title: 'Non-Vegetarian',
      category: 'NON_VEG',
      tone: 'text-nonveg border-nonveg',
    },
    { title: 'Seafood', category: 'FISH', tone: 'text-fish border-fish' },
  ]

export function ProteinSelectScreen({ selected, onToggle, onNext }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-ink">
          Which proteins do you have at home?
        </h1>
        <p className="mt-1 text-base text-muted">Tap to select all that apply.</p>
      </div>

      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => {
          const items = PROTEIN_OPTIONS.filter(
            (p) => p.category === group.category,
          )
          return (
            <section key={group.category}>
              <h2 className={`mb-2 text-sm font-bold uppercase tracking-wide ${group.tone.split(' ')[0]}`}>
                {group.title}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => {
                  const isOn = selected.includes(item.label)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggle(item.label)}
                      className={`touch-target rounded-xl border-2 px-3 text-left text-base font-semibold ${
                        isOn
                          ? `${group.tone} bg-white`
                          : 'border-border bg-surface text-ink'
                      }`}
                      aria-pressed={isOn}
                    >
                      {isOn ? '✓ ' : ''}
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-auto safe-bottom pt-4">
        <PrimaryButton onClick={onNext} disabled={selected.length === 0}>
          Next: Servings
        </PrimaryButton>
      </div>
    </div>
  )
}
