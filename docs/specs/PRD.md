# Product Requirements Document (PRD)
## App Name: Add Protein to Your Life

## 1. Product Summary
**Add Protein to Your Life** is an elderly-friendly, local-first Progressive Web App (PWA) designed to help South Indian families easily select and prepare high-protein side dishes that complement traditional carb-heavy base meals (e.g., Pappu, Pachi Pulusu, Fry Curries, Majjiga Charu). 

The app features a single-responsibility multi-screen workflow with clear "Back" navigation at every step and an Instagram-style top header calendar button for instant access to protein tracking history.

## 2. Target User Persona
* **Primary User**: Mom (elderly, non-technical, native Telangana English/Telugu speaker).
* **Key UX Principles**:
  * **Single Job per Screen**: No cluttered screens with multiple competing decisions.
  * **Top-Header Navigation**: Quick calendar access via a top-right icon (similar to old Instagram DMs icon).
  * **Always Allow Going Back**: Prominent `← Back` button on main setup screens, and a **fixed bottom `Home` button** on the calendar view.
  * **Zero Typing Required**: Supports voice dictation and quick-tap chips.
  * **High Accessibility**: Large touch targets (minimum 56px), high contrast text, and explicit progress loading indicators.

## 3. Screen Architecture & Navigation Flow

```
[Top Header Calendar Icon (📅)] ---> Opens [Vertically Scrollable Calendar Screen]
                                                   |
                                           (Fixed Bottom [🏠 HOME] Button returns to flow)

Workflow:
[Screen 1: Base Meal] ---> [Screen 2: Protein Inventory] ---> [Screen 3: Servings] ---> [Screen 4: Recipes]
```

### Top Bar (Present on Screens 1, 2, 3, & 4)
* **Left**: `← Back` button (or Step indicator).
* **Center**: App Title ("Add Protein").
* **Top Right**: **Calendar Icon (`📅`)** (Instagram DM style trigger). Tapping it directly opens the Vertically Scrollable Calendar Screen from anywhere in the app.

---

### Screen 1: Today's Base Meal (Optional)
* **Single Job**: Capture what was cooked for the main meal today.
* **UI Controls**:
  * Large text input box with iOS native microphone voice dictation.
  * Top 3 most frequently logged base meals displayed as quick-tap chips (e.g., `[Pappu]`, `[Pachi Pulusu]`, `[Bendakaya Fry]`).
* **Navigation**:
  * Header: `Step 1 of 3` | Top-Right `📅 Calendar` Icon.
  * Primary Action: `Next: Choose Proteins →`

### Screen 2: Kitchen Protein Inventory
* **Single Job**: Select which proteins are available in the house today.
* **UI Controls**:
  * Large grid of toggle cards grouped into 3 visual categories:
    * **Vegetarian**: Paneer, Soya Chunks, Chana/Sprouts, Tofu.
    * **Non-Vegetarian**: Eggs, Chicken, Mutton.
    * **Seafood**: Fish.
* **Navigation**:
  * Header: `← Back to Step 1` | Top-Right `📅 Calendar` Icon.
  * Primary Action: `Next: Servings →`

### Screen 3: Servings & Review
* **Single Job**: Set how many people are eating and trigger recipe generation.
* **UI Controls**:
  * Large `+` and `-` target buttons to set number of servings (Default = **3 servings**).
  * Summary box showing selected base meal and available proteins.
* **Navigation**:
  * Header: `← Back to Proteins` | Top-Right `📅 Calendar` Icon.
  * Primary Action: **`GENERATE PROTEIN DISHES`**

### Screen 4: Recipe Suggestions & Cooking View
* **Single Job**: Display tailored protein recipes and guide cooking.
* **UI Controls**:
  * **View Mode Toggle**: List View or Flashcard View (24px bold single-step cards).
  * **Ingredient Adaptability**: Tapping/unchecking an ingredient marks it missing and triggers inline AI substitution/recipe adaptation.
  * **Action Button**: "Cooked This! (Save to Calendar)" logs the dish and opens the Calendar Screen.

### Screen 5: Vertically Scrollable Calendar Screen
* **Single Job**: View full cooking history across months.
* **UI Controls**:
  * **Vertically Scrollable View**: Continuous scroll through months (Current Month, Previous Months).
  * **Color-Coded Status Dots** on date numbers:
    * 🟢 **Green**: Vegetarian (Paneer, Soya, Chana)
    * 🟠 **Orange**: Non-Veg (Egg, Chicken, Mutton)
    * 🔵 **Blue**: Seafood (Fish)
    * ⚪ **Gray**: No protein logged
  * **Rotation Summary Banner**: Top sticky indicator showing last cooked protein (e.g., *"Chicken cooked yesterday - Veg recommended today!"*).
* **Fixed Navigation**:
  * **Fixed Bottom Bar**: A large, full-width **`[ 🏠 HOME ]`** button pinned to the bottom of the screen that returns mom directly to Screen 1.

## 4. Protein Rotation Engine Rules
* **Rolling 7-Day Window**: Saved locally in IndexedDB.
* **No Triple Repeats**: If a specific protein item (e.g., Paneer) was cooked 2 days in a row, suppress it from top suggestions.
* **Dynamic Category Weighting**:
  * *Vegetarian*: High default frequency baseline.
  * *Non-Veg (Chicken/Mutton)*: Boosted if not cooked in the last 3 days.
  * *Fish*: Surfaced as a special weekend recommendation if not cooked in 7+ days.