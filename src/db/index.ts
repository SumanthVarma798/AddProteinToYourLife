import Dexie, { type Table } from 'dexie'
import type { MealCategory } from '../types'

export interface MealLog {
  id?: number
  date: string
  category: MealCategory
  proteinItem: string
  baseMeal?: string
}

export interface AppSettings {
  key: string
  value: string
}

export interface RecentBaseMeal {
  name: string
  count: number
  lastUsed: string
}

export class ProteinCompanionDB extends Dexie {
  mealLogs!: Table<MealLog>
  settings!: Table<AppSettings>
  recentMeals!: Table<RecentBaseMeal>

  constructor() {
    super('AddProteinToYourLifeDB')
    this.version(1).stores({
      mealLogs: '++id, date, category, proteinItem',
      settings: 'key',
      recentMeals: 'name, count, lastUsed',
    })
  }
}

export const db = new ProteinCompanionDB()

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.get(key)
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value })
}

export async function getRecentBaseMeals(limit = 3): Promise<RecentBaseMeal[]> {
  return db.recentMeals.orderBy('count').reverse().limit(limit).toArray()
}

export async function bumpRecentBaseMeal(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  const existing = await db.recentMeals.get(trimmed)
  const today = new Date().toISOString().slice(0, 10)
  if (existing) {
    await db.recentMeals.put({
      ...existing,
      count: existing.count + 1,
      lastUsed: today,
    })
  } else {
    await db.recentMeals.put({ name: trimmed, count: 1, lastUsed: today })
  }
}

export async function logCookedMeal(input: {
  proteinItem: string
  category: MealCategory
  baseMeal?: string
  date?: string
}): Promise<void> {
  const date = input.date ?? new Date().toISOString().slice(0, 10)
  await db.mealLogs.add({
    date,
    category: input.category,
    proteinItem: input.proteinItem,
    baseMeal: input.baseMeal,
  })
}

export async function getMealLogsInRange(
  startDate: string,
  endDate: string,
): Promise<MealLog[]> {
  return db.mealLogs
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray()
}

export async function getLogsForMonths(monthCount = 6): Promise<MealLog[]> {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - (monthCount - 1))
  start.setDate(1)
  return getMealLogsInRange(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  )
}
