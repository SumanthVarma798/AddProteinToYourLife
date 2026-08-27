import type { Recipe } from '../types'

const LIBRARY: Record<string, Recipe[]> = {
  Eggs: [
    {
      id: 'egg_pepper_roast',
      title: 'Egg Pepper Roast',
      prepTimeMinutes: 15,
      proteinPerServingGrams: 18,
      category: 'NON_VEG',
      baseIngredients: [
        { item: 'Eggs', amountPerServing: 2, unit: 'whole', isProteinSource: true },
        { item: 'Black Pepper', amountPerServing: 0.5, unit: 'tsp', isProteinSource: false },
        { item: 'Curry Leaves', amountPerServing: 1, unit: 'sprig', isProteinSource: false },
        { item: 'Oil', amountPerServing: 1, unit: 'tbsp', isProteinSource: false },
      ],
      steps: [
        'Hard boil eggs, peel and slice in halves.',
        'Heat oil in a pan, toss curry leaves and black pepper powder.',
        'Roast egg halves cut-side down for 3 minutes until golden brown.',
      ],
      flavorComplementNote:
        'Pairs perfectly with rice and Pappu by adding a peppery dry crunch.',
    },
  ],
  Paneer: [
    {
      id: 'paneer_pepper_fry',
      title: 'Paneer Pepper Fry',
      prepTimeMinutes: 20,
      proteinPerServingGrams: 16,
      category: 'VEG',
      baseIngredients: [
        { item: 'Paneer', amountPerServing: 80, unit: 'g', isProteinSource: true },
        { item: 'Onion', amountPerServing: 0.5, unit: 'medium', isProteinSource: false },
        { item: 'Black Pepper', amountPerServing: 0.5, unit: 'tsp', isProteinSource: false },
        { item: 'Curry Leaves', amountPerServing: 1, unit: 'sprig', isProteinSource: false },
      ],
      steps: [
        'Cube the paneer and lightly salt it.',
        'Saute onion and curry leaves until soft.',
        'Add paneer and pepper; roast until edges brown.',
      ],
      flavorComplementNote: 'A dry, peppery side that lifts soft dals and rice.',
    },
  ],
  'Soya Chunks': [
    {
      id: 'soya_gongura',
      title: 'Soya Gongura Curry',
      prepTimeMinutes: 25,
      proteinPerServingGrams: 20,
      category: 'VEG',
      baseIngredients: [
        { item: 'Soya Chunks', amountPerServing: 40, unit: 'g dry', isProteinSource: true },
        { item: 'Gongura leaves', amountPerServing: 1, unit: 'cup', isProteinSource: false },
        { item: 'Garlic', amountPerServing: 2, unit: 'cloves', isProteinSource: false },
        { item: 'Red chilli', amountPerServing: 1, unit: 'whole', isProteinSource: false },
      ],
      steps: [
        'Soak soya chunks in hot water, squeeze dry, and tear lightly.',
        'Cook gongura with garlic and chilli until soft and tangy.',
        'Mix soya into the gongura mash and simmer 5 minutes.',
      ],
      flavorComplementNote: 'Tangy Telangana flavour that cuts through plain rice.',
    },
  ],
  'Chana/Sprouts': [
    {
      id: 'sprouts_sundal',
      title: 'Sprouts Sundal',
      prepTimeMinutes: 15,
      proteinPerServingGrams: 14,
      category: 'VEG',
      baseIngredients: [
        { item: 'Sprouted chana', amountPerServing: 0.75, unit: 'cup', isProteinSource: true },
        { item: 'Mustard seeds', amountPerServing: 0.25, unit: 'tsp', isProteinSource: false },
        { item: 'Coconut', amountPerServing: 1, unit: 'tbsp', isProteinSource: false },
        { item: 'Green chilli', amountPerServing: 0.5, unit: 'whole', isProteinSource: false },
      ],
      steps: [
        'Steam sprouts for 5 minutes until tender.',
        'Temper mustard, chilli, and curry leaves in oil.',
        'Toss sprouts with tempering and grated coconut.',
      ],
      flavorComplementNote: 'Light, fresh protein that sits well beside pulusu or fry.',
    },
  ],
  Tofu: [
    {
      id: 'tofu_pepper_fry',
      title: 'Tofu Pepper Fry',
      prepTimeMinutes: 18,
      proteinPerServingGrams: 15,
      category: 'VEG',
      baseIngredients: [
        { item: 'Tofu', amountPerServing: 100, unit: 'g', isProteinSource: true },
        { item: 'Onion', amountPerServing: 0.5, unit: 'medium', isProteinSource: false },
        { item: 'Black Pepper', amountPerServing: 0.5, unit: 'tsp', isProteinSource: false },
        { item: 'Soy sauce', amountPerServing: 0.5, unit: 'tsp', isProteinSource: false },
      ],
      steps: [
        'Press tofu briefly and cube it.',
        'Pan-fry until golden on the outside.',
        'Toss with onion, pepper, and a splash of soy sauce.',
      ],
      flavorComplementNote: 'Mild dry fry that works with any rice-and-dal plate.',
    },
  ],
  Chicken: [
    {
      id: 'chicken_pepper_fry',
      title: 'Chicken Pepper Fry',
      prepTimeMinutes: 30,
      proteinPerServingGrams: 28,
      category: 'NON_VEG',
      baseIngredients: [
        { item: 'Chicken', amountPerServing: 120, unit: 'g', isProteinSource: true },
        { item: 'Onion', amountPerServing: 0.5, unit: 'medium', isProteinSource: false },
        { item: 'Black Pepper', amountPerServing: 1, unit: 'tsp', isProteinSource: false },
        { item: 'Ginger garlic paste', amountPerServing: 0.5, unit: 'tsp', isProteinSource: false },
      ],
      steps: [
        'Marinate chicken with salt, pepper, and ginger garlic paste for 10 minutes.',
        'Cook covered until nearly done, then open-roast to dry.',
        'Finish with more crushed pepper and fried curry leaves.',
      ],
      flavorComplementNote: 'Bold dry side that balances soft pappu or majjiga charu.',
    },
  ],
  Mutton: [
    {
      id: 'mutton_keema',
      title: 'Simple Mutton Keema',
      prepTimeMinutes: 40,
      proteinPerServingGrams: 26,
      category: 'NON_VEG',
      baseIngredients: [
        { item: 'Mutton mince', amountPerServing: 100, unit: 'g', isProteinSource: true },
        { item: 'Onion', amountPerServing: 0.5, unit: 'medium', isProteinSource: false },
        { item: 'Tomato', amountPerServing: 0.5, unit: 'medium', isProteinSource: false },
        { item: 'Garam masala', amountPerServing: 0.25, unit: 'tsp', isProteinSource: false },
      ],
      steps: [
        'Saute onion until golden, then add mince and brown well.',
        'Add tomato and cook until oil separates.',
        'Finish with garam masala and rest 5 minutes.',
      ],
      flavorComplementNote: 'Rich protein scoop that complements plain rice and dal.',
    },
  ],
  Fish: [
    {
      id: 'fish_pepper_fry',
      title: 'Fish Pepper Fry',
      prepTimeMinutes: 25,
      proteinPerServingGrams: 24,
      category: 'FISH',
      baseIngredients: [
        { item: 'Fish pieces', amountPerServing: 120, unit: 'g', isProteinSource: true },
        { item: 'Turmeric', amountPerServing: 0.25, unit: 'tsp', isProteinSource: false },
        { item: 'Red chilli powder', amountPerServing: 0.5, unit: 'tsp', isProteinSource: false },
        { item: 'Curry Leaves', amountPerServing: 1, unit: 'sprig', isProteinSource: false },
      ],
      steps: [
        'Rub fish with turmeric, chilli, and salt.',
        'Shallow fry until crisp on both sides.',
        'Temper curry leaves in the same pan and pour over fish.',
      ],
      flavorComplementNote: 'Crispy weekend-style side for rice and tangy pulusu.',
    },
  ],
}

export function buildMockRecipes(
  availableProteins: string[],
  suppressed: string[],
  baseMeal: string,
): Recipe[] {
  const preferred = availableProteins.filter(
    (p) => !suppressed.some((s) => s.toLowerCase() === p.toLowerCase()),
  )
  const pool = preferred.length > 0 ? preferred : availableProteins
  const recipes: Recipe[] = []

  for (const protein of pool) {
    const matches = LIBRARY[protein]
    if (matches) {
      recipes.push(
        ...matches.map((r) => ({
          ...r,
          id: `${r.id}_${Date.now()}`,
          flavorComplementNote: baseMeal
            ? r.flavorComplementNote.replace(/Pappu|dal|pulusu/i, baseMeal)
            : r.flavorComplementNote,
          baseIngredients: r.baseIngredients.map((i) => ({ ...i })),
          steps: [...r.steps],
        })),
      )
    }
  }

  if (recipes.length === 0) {
    return [
      {
        id: `fallback_${Date.now()}`,
        title: 'Quick Protein Stir',
        prepTimeMinutes: 15,
        proteinPerServingGrams: 15,
        category: 'VEG',
        baseIngredients: [
          {
            item: availableProteins[0] ?? 'Paneer',
            amountPerServing: 80,
            unit: 'g',
            isProteinSource: true,
          },
          { item: 'Onion', amountPerServing: 0.5, unit: 'medium', isProteinSource: false },
          { item: 'Oil', amountPerServing: 1, unit: 'tbsp', isProteinSource: false },
        ],
        steps: [
          'Heat oil and saute onion until soft.',
          'Add your protein and cook until heated through.',
          'Season with salt and pepper; serve beside the base meal.',
        ],
        flavorComplementNote: baseMeal
          ? `A simple side that works with ${baseMeal}.`
          : 'A simple high-protein side for rice meals.',
      },
    ]
  }

  return recipes.slice(0, 4)
}
