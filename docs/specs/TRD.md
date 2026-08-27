# Technical Requirements Document (TRD)
## App Name: Add Protein to Your Life

## 1. Tech Stack Architecture
* **Frontend Framework**: React 18+ (with Vite) or SvelteKit.
* **Styling**: Tailwind CSS.
* **Local Persistence Engine**: IndexedDB managed via `dexie.js`. Zero external cloud database required.
* **PWA Engine**: `vite-plugin-pwa` with web app manifest and offline service worker caching.
* **AI Generation API**: Client-side fetch to OpenAI / Gemini / Anthropic API (user inputs API key once in settings).

## 2. Multi-Screen State Navigation Engine

```typescript
export type ScreenStep = 
  | 'BASE_MEAL'       // Screen 1
  | 'PROTEIN_SELECT'  // Screen 2
  | 'SERVINGS_REVIEW' // Screen 3
  | 'RECIPE_RESULTS'  // Screen 4
  | 'CALENDAR'        // Screen 5 (Top-Right Icon Modal / Overlay Screen)
  | 'SETTINGS';       // Settings Modal

export interface AppState {
  currentStep: ScreenStep;
  previousStep: ScreenStep; // Used to return when closing Calendar
  baseMeal: string;
  selectedProteins: string[];
  servings: number;
  activeRecipeId: string | null;
}
```

## 3. Local IndexedDB Schema (Dexie.js)

```typescript
import Dexie, { Table } from 'dexie';

export interface MealLog {
  id?: number;
  date: string; // YYYY-MM-DD
  category: 'VEG' | 'NON_VEG' | 'FISH' | 'NONE';
  proteinItem: string; // e.g. "Paneer", "Egg", "Chicken"
  baseMeal?: string;   // e.g. "Tomato Pappu"
}

export interface AppSettings {
  key: string;
  value: string; // Stores API_KEY, default_servings, language_preference
}

export interface RecentBaseMeal {
  name: string;
  count: number;
  lastUsed: string;
}

export class ProteinCompanionDB extends Dexie {
  mealLogs!: Table<MealLog>;
  settings!: Table<AppSettings>;
  recentMeals!: Table<RecentBaseMeal>;

  constructor() {
    super('AddProteinToYourLifeDB');
    this.version(1).stores({
      mealLogs: '++id, date, category, proteinItem',
      settings: 'key',
      recentMeals: 'name, count, lastUsed'
    });
  }
}

export const db = new ProteinCompanionDB();
```

## 4. LLM Generation JSON Schema & Prompt

```text
SYSTEM PROMPT:
You are an expert Telangana South Indian culinary assistant specializing in high-protein meal pairings.
Return STRICT JSON matching the schema below. Do not output any markdown headers or text outside the JSON.

INPUT PARAMETERS:
- Today's Base Meal: {{BASE_MEAL_OR_"UNSPECIFIED"}}
- Available Proteins in Kitchen: {{AVAILABLE_PROTEINS}}
- Number of Servings: {{SERVINGS}}
- Suppressed Proteins (cooked in last 2 days): {{SUPPRESSED_PROTEINS}}

OUTPUT FORMAT (STRICT JSON):
{
  "recipes": [
    {
      "id": "recipe_1",
      "title": "Egg Pepper Roast",
      "prepTimeMinutes": 15,
      "proteinPerServingGrams": 18,
      "category": "NON_VEG",
      "baseIngredients": [
        { "item": "Eggs", "amountPerServing": 2, "unit": "whole", "isProteinSource": true },
        { "item": "Black Pepper", "amountPerServing": 0.5, "unit": "tsp", "isProteinSource": false },
        { "item": "Curry Leaves", "amountPerServing": 1, "unit": "sprig", "isProteinSource": false }
      ],
      "steps": [
        "Hard boil eggs, peel and slice in halves.",
        "Heat 1 tbsp oil in a pan, toss curry leaves and black pepper powder.",
        "Roast egg halves cut-side down for 3 minutes until golden brown."
      ],
      "flavorComplementNote": "Pairs perfectly with rice and Pappu by adding a peppery dry crunch."
    }
  ]
}
```

## 5. Ingredient Adaptation Prompt

```text
SYSTEM PROMPT:
The user is missing "{{MISSING_INGREDIENT}}" from the recipe "{{RECIPE_TITLE}}".
Return STRICT JSON with substitution advice and updated step instructions.

OUTPUT FORMAT (STRICT JSON):
{
  "substitutionNote": "No Curry Leaves? Use fresh coriander leaves or a pinch of garamasala at the end.",
  "updatedSteps": [ ... ]
}
```