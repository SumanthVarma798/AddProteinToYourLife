export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export function buildMonthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // Monday-first week
  const mondayIndex = (first.getDay() + 6) % 7
  const cells: Array<number | null> = Array(mondayIndex).fill(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function listRecentMonths(count: number): Array<{ year: number; month: number }> {
  const out: Array<{ year: number; month: number }> = []
  const now = new Date()
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ year: d.getFullYear(), month: d.getMonth() })
  }
  return out
}

/** Current month + next 11 months, then past months newest-first back to earliest log. */
export function listCalendarMonths(earliestIso: string | null): Array<{
  year: number
  month: number
  section: 'upcoming' | 'history'
}> {
  const now = new Date()
  const upcoming: Array<{ year: number; month: number; section: 'upcoming' }> =
    []
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    upcoming.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      section: 'upcoming',
    })
  }

  const history: Array<{ year: number; month: number; section: 'history' }> = []
  if (earliestIso) {
    const earliest = new Date(
      Number(earliestIso.slice(0, 4)),
      Number(earliestIso.slice(5, 7)) - 1,
      1,
    )
    const current = new Date(now.getFullYear(), now.getMonth(), 1)
    const cursor = new Date(current)
    cursor.setMonth(cursor.getMonth() - 1)
    while (cursor >= earliest) {
      history.push({
        year: cursor.getFullYear(),
        month: cursor.getMonth(),
        section: 'history',
      })
      cursor.setMonth(cursor.getMonth() - 1)
    }
  }

  return [...upcoming, ...history]
}

export function parseBaseMeals(value: string): string[] {
  return value
    .split(/,|\+|\/|\band\b/gi)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function joinBaseMeals(meals: string[]): string {
  return meals.join(', ')
}
