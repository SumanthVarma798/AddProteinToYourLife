import type { ProteinOption } from '../types'

export const PROTEIN_OPTIONS: ProteinOption[] = [
  { id: 'paneer', label: 'Paneer', category: 'VEG' },
  { id: 'soya', label: 'Soya Chunks', category: 'VEG' },
  { id: 'chana', label: 'Chana/Sprouts', category: 'VEG' },
  { id: 'tofu', label: 'Tofu', category: 'VEG' },
  { id: 'eggs', label: 'Eggs', category: 'NON_VEG' },
  { id: 'chicken', label: 'Chicken', category: 'NON_VEG' },
  { id: 'mutton', label: 'Mutton', category: 'NON_VEG' },
  { id: 'fish', label: 'Fish', category: 'FISH' },
]

export const DEFAULT_BASE_MEAL_CHIPS = [
  'Pappu',
  'Pachi Pulusu',
  'Bendakaya Fry',
]

export function categoryForProtein(label: string) {
  const match = PROTEIN_OPTIONS.find(
    (p) => p.label.toLowerCase() === label.toLowerCase(),
  )
  return match?.category ?? 'VEG'
}
