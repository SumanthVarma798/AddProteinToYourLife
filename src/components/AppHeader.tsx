import { CalendarBlank, CaretLeft, GearSix } from '@phosphor-icons/react'

type Props = {
  title?: string
  stepLabel?: string
  showBack?: boolean
  onBack?: () => void
  onCalendar?: () => void
  onSettings?: () => void
  showCalendar?: boolean
}

export function AppHeader({
  title = 'Add Protein',
  stepLabel,
  showBack = false,
  onBack,
  onCalendar,
  onSettings,
  showCalendar = true,
}: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-cream/95 px-3 py-2 backdrop-blur">
      <div className="grid grid-cols-[56px_1fr_56px] items-center gap-1">
        <div className="flex justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="touch-target inline-flex items-center justify-center rounded-xl text-ink"
              aria-label="Go back"
            >
              <CaretLeft size={28} weight="bold" />
            </button>
          ) : (
            <span className="touch-target" />
          )}
        </div>

        <div className="min-w-0 text-center">
          <p className="truncate text-lg font-bold text-ink">{title}</p>
          {stepLabel ? (
            <p className="text-sm font-medium text-muted">{stepLabel}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-0.5">
          {onSettings ? (
            <button
              type="button"
              onClick={onSettings}
              className="touch-target inline-flex items-center justify-center rounded-xl text-header-icon"
              aria-label="Open settings"
            >
              <GearSix size={26} weight="bold" />
            </button>
          ) : null}
          {showCalendar ? (
            <button
              type="button"
              onClick={onCalendar}
              className="touch-target inline-flex items-center justify-center rounded-xl text-header-icon"
              aria-label="Open calendar"
            >
              <CalendarBlank size={28} weight="bold" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
