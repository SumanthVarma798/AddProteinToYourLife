import { useEffect, useMemo, useState } from 'react'
import { getAllMealLogs, type MealLog } from '../db'
import {
  buildMonthGrid,
  formatMonthLabel,
  listCalendarMonths,
} from '../lib/dates'
import {
  buildRotationBanner,
  getRollingWeekLogs,
} from '../lib/rotation'
import type { MealCategory } from '../types'

const DOT: Record<MealCategory, string> = {
  VEG: 'bg-veg',
  NON_VEG: 'bg-nonveg',
  FISH: 'bg-fish',
  NONE: 'bg-slate-300',
}

function categoryForDate(logs: MealLog[], iso: string): MealCategory {
  const dayLogs = logs.filter((l) => l.date === iso)
  if (dayLogs.some((l) => l.category === 'FISH')) return 'FISH'
  if (dayLogs.some((l) => l.category === 'NON_VEG')) return 'NON_VEG'
  if (dayLogs.some((l) => l.category === 'VEG')) return 'VEG'
  return 'NONE'
}

export function CalendarScreen() {
  const [logs, setLogs] = useState<MealLog[]>([])
  const [banner, setBanner] = useState('Loading protein history...')
  const [earliestIso, setEarliestIso] = useState<string | null>(null)

  const months = useMemo(
    () => listCalendarMonths(earliestIso),
    [earliestIso],
  )

  useEffect(() => {
    void (async () => {
      const [allLogs, weekLogs] = await Promise.all([
        getAllMealLogs(),
        getRollingWeekLogs(),
      ])
      setLogs(allLogs)
      const earliest =
        allLogs.length > 0
          ? [...allLogs].sort((a, b) => a.date.localeCompare(b.date))[0]?.date ??
            null
          : null
      setEarliestIso(earliest)
      setBanner(buildRotationBanner(weekLogs))
    })()
  }, [])

  let sawHistoryHeading = false

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
      <p className="mb-4 text-sm font-medium text-primary">{banner}</p>

      {months.map(({ year, month, section }) => {
        const showHistoryHeading = section === 'history' && !sawHistoryHeading
        if (showHistoryHeading) sawHistoryHeading = true
        const cells = buildMonthGrid(year, month)
        return (
          <section key={`${year}-${month}`} className="mb-8">
            {showHistoryHeading ? (
              <h2 className="mb-4 text-base font-bold uppercase tracking-wide text-muted">
                History
              </h2>
            ) : null}
            <h2 className="mb-3 text-lg font-bold text-ink">
              {formatMonthLabel(year, month)}
            </h2>
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) {
                  return <span key={`e-${idx}`} className="h-12" />
                }
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const cat = categoryForDate(logs, iso)
                return (
                  <div
                    key={iso}
                    className="flex h-12 flex-col items-center justify-center rounded-lg bg-white"
                  >
                    <span className="text-sm font-semibold text-ink">
                      {day}
                    </span>
                    <span
                      className={`mt-0.5 h-2.5 w-2.5 rounded-full ${DOT[cat]}`}
                      aria-label={`${iso} ${cat}`}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <p className="mb-2 text-sm font-medium text-muted">
        Legend: <span className="text-veg">Veg</span> ·{' '}
        <span className="text-nonveg">Non-Veg</span> ·{' '}
        <span className="text-fish">Fish</span> · Gray = none
      </p>
    </div>
  )
}
