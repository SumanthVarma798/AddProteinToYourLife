# Design & UI/UX Specifications
## App Name: Add Protein to Your Life

## 1. Accessibility & Visual Palette

| Visual Token | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Action** | Telangana Emerald | `#059669` | Main action buttons ("Next", "Generate", "Home") |
| **Vegetarian Tag** | Forest Green | `#16A34A` | Paneer, Soya, Chana indicators |
| **Non-Veg Tag** | Spicy Rust | `#EA580C` | Chicken, Mutton, Egg indicators |
| **Seafood Tag** | Ocean Blue | `#0284C7` | Fish indicators |
| **Background** | Cream White | `#FAFAFA` | Glare-free, warm off-white background |
| **Text Primary** | Slate Black | `#0F172A` | Ultra-high contrast reading text |
| **Header Icon** | Deep Slate | `#334155` | Calendar top-right icon |

## 2. Touch Target & Navigation Layout Rules
* **Minimum Touch Target**: `56px x 56px` for all interactive buttons and toggle chips.
* **Top Header Calendar Button**: Placed on top-right of the header (Instagram DMs style `📅` button). Tapping it opens the Calendar View.
* **Fixed Bottom Home Button**: On the Calendar screen, the `[🏠 HOME]` button is **position: fixed** at the bottom viewport, ensuring mom can exit back to Step 1 with a single tap regardless of scroll position.

## 3. Screen Wireframes

### Screen 1: Base Meal Input (Header with Calendar Icon)
```
+------------------------------------------+
| Add Protein          Step 1 of 3   [📅] |
+------------------------------------------+
| What did you cook for main meal today?   |
| (Optional)                               |
|                                          |
| [ 🎤 Speak or type dish name...        ] |
|                                          |
| Quick Tap Last Cooked:                   |
| [ + Pappu ]  [ + Pachi Pulusu ]          |
|                                          |
| [ NEXT: CHOOSE PROTEINS →              ] |
+------------------------------------------+
```

### Screen 2: Kitchen Protein Inventory
```
+------------------------------------------+
| [← Back]             Step 2 of 3   [📅] |
+------------------------------------------+
| Which proteins do you have at home?      |
|                                          |
| VEGETARIAN                               |
| [🟢 Paneer (✓)]   [🟢 Soya Chunks]      |
| [🟢 Chana/Sprouts] [🟢 Tofu]             |
|                                          |
| NON-VEGETARIAN                           |
| [🟠 Eggs (✓)]      [🟠 Chicken]           |
| [🟠 Mutton]                              |
|                                          |
| SEAFOOD                                  |
| [🔵 Fish]                                |
|                                          |
| [ NEXT: SERVINGS →                     ] |
+------------------------------------------+
```

### Screen 5: Vertically Scrollable Calendar Screen (With Fixed Bottom Home Button)
```
+------------------------------------------+
|  Calendar & Protein History          [⚙️]|
+------------------------------------------+
|  ::: VERTICALLY SCROLLABLE AREA :::      |
|                                          |
|  August 2026                             |
|  Mon  Tue  Wed  Thu  Fri  Sat  Sun       |
|              1🟢   2🟠   3🟢   4⚪       |
|   5🟢  6🟠  7🔵   8🟢   9🟠  10🟢  11⚪  |
|  12🟢 13🟠 14🟢  15🔵  16🟢  17🟠  18🟢  |
|                                          |
|  July 2026                               |
|  Mon  Tue  Wed  Thu  Fri  Sat  Sun       |
|   1🟢  2⚪  3🟢   4🟠   5🟢   6🔵   7🟢  |
|                                          |
|  Legend: 🟢 Veg  🟠 Non-Veg  🔵 Fish     |
|                                          |
+------------------------------------------+
| [ 🏠 HOME (FIXED BOTTOM BUTTON)        ] |  <-- FIXED AT BOTTOM
+------------------------------------------+
```