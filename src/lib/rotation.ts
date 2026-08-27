import { getMealLogsInRange } from '../db'
import type { MealLog } from '../db'

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function getSuppressedProteins(): Promise<string[]> {
  const start = daysAgoIso(2)
  const end = daysAgoIso(0)
  const logs = await getMealLogsInRange(start, end)
  const counts = new Map<string, number>()
  for (const log of logs) {
    if (log.category === 'NONE') continue
    const key = log.proteinItem
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([item]) => item)
}

export async function getRollingWeekLogs(): Promise<MealLog[]> {
  return getMealLogsInRange(daysAgoIso(6), daysAgoIso(0))
}

export function buildRotationBanner(logs: MealLog[]): string {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted.find((l) => l.category !== 'NONE')
  if (!latest) {
    return 'No protein logged yet - a veg side is a gentle start today.'
  }

  const yesterday = daysAgoIso(1)
  const today = daysAgoIso(0)
  const when =
    latest.date === today
      ? 'today'
      : latest.date === yesterday
        ? 'yesterday'
        : `on ${latest.date}`

  if (latest.category === 'NON_VEG' || latest.category === 'FISH') {
    return `${latest.proteinItem} cooked ${when} - Veg recommended today!`
  }
  if (latest.category === 'VEG') {
    const fishGap = !sorted.some((l) => l.category === 'FISH')
    const weekend = [0, 6].includes(new Date().getDay())
    if (weekend && fishGap) {
      return `${latest.proteinItem} cooked ${when} - Fish is a nice weekend idea.`
    }
    return `${latest.proteinItem} cooked ${when} - Keep rotating proteins this week.`
  }
  return 'Add a protein side today to start your calendar streak.'
}

export function rankProteinsForSuggestion(
  available: string[],
  weekLogs: MealLog[],
): string[] {
  const lastCooked = new Map<string, string>()
  for (const log of weekLogs) {
    if (log.category === 'NONE') continue
    const prev = lastCooked.get(log.proteinItem)
    if (!prev || log.date > prev) lastCooked.set(log.proteinItem, log.date)
  }

  const score = (label: string) => {
    const lower = label.toLowerCase()
    const last = [...lastCooked.entries()].find(
      ([k]) => k.toLowerCase() === lower,
    )?.[1]
    let points = 10
    if (['paneer', 'soya chunks', 'chana/sprouts', 'tofu'].includes(lower)) {
      points += 5
    }
    if (['chicken', 'mutton', 'eggs'].includes(lower)) {
      const recentNonVeg = weekLogs.some(
        (l) =>
          l.category === 'NON_VEG' &&
          l.date >= daysAgoIso(3),
      )
      points += recentNonVeg ? -2 : 8
    }
    if (lower === 'fish') {
      const recentFish = weekLogs.some(
        (l) => l.category === 'FISH' && l.date >= daysAgoIso(7),
      )
      const weekend = [0, 6].includes(new Date().getDay())
      points += recentFish ? -5 : weekend ? 12 : 3
    }
    if (last) {
      const age =
        (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
      points += age
    } else {
      points += 10
    }
    return points
  }

  return [...available].sort((a, b) => score(b) - score(a))
}
