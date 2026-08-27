# Add Protein to Your Life

An elderly-friendly Progressive Web App that helps South Indian families add high-protein side dishes to everyday rice-and-dal meals.

**Live app:** [add-protein-to-your-life.vercel.app](https://add-protein-to-your-life.vercel.app)

Built for moms who want clear steps, big buttons, and zero fuss. Choose what was cooked, tap the proteins in the kitchen, and get practical Indian protein sides you can cook today.

---

## What it does

1. **Base meal** – optional, multi-select chips like Pappu / Pachi Pulusu  
2. **Protein inventory** – Paneer, eggs, chicken, fish, and more  
3. **Servings** – family-sized defaults with one-tap generate  
4. **Recipe list → detail** – pick a suggestion, then cook with list or flashcard steps  
5. **Calendar history** – color-coded protein tracking across months  

Recipes are generated dynamically from:
- today’s base meal  
- selected proteins  
- recent cooking history (to avoid repeats)

Count scales with selection: **minimum = number of proteins**, **maximum = that number + 3**, fetched in parallel for speed.

---

## Highlights

- Large 56px touch targets and high-contrast Telangana Emerald palette  
- Local-first storage with Dexie.js / IndexedDB  
- Installable PWA on iPhone (Safari → Add to Home Screen)  
- Gemini API key stays on the server (never in the phone bundle)  
- Offline starter recipes if the API is unavailable  
- Ingredient “missing” toggles with a deliberate **Regenerate** action  

---

## Quick start

```bash
git clone https://github.com/SumanthVarma798/AddProteinToYourLife.git
cd AddProteinToYourLife
cp .env.example .env
npm install
npm run dev
```

Add your key to `.env`:

```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
LLM_MODEL=gemini-flash-lite-latest
```

Then open the local Vite URL (usually `http://localhost:5173`).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |

---

## Secrets (important)

- **Never commit** `.env`, `.env.local`, or real API keys  
- Production key lives in **Vercel Project Environment Variables**  
- The app calls `/api/recipes` and `/api/adapt`; the server talks to Gemini  
- `.env.example` is safe to commit (placeholders only)

---

## Install on iPhone

1. Open Safari → [https://add-protein-to-your-life.vercel.app](https://add-protein-to-your-life.vercel.app)  
2. Tap **Share** → **Add to Home Screen**  
3. Name it **Add Protein** → **Add**  
4. Launch from the Home Screen like a normal app  

No Apple Developer account required.

---

## Stack

- React + Vite + TypeScript  
- Tailwind CSS v4  
- Dexie.js (IndexedDB)  
- vite-plugin-pwa  
- Vercel serverless API routes  
- Gemini (`gemini-flash-lite-latest`)  
- anime.js + Phosphor Icons  

---

## Project docs

Product / tech / design specs: [`docs/specs/`](docs/specs/)

---

## License

Personal / family project. Feel free to fork and adapt for your own kitchen.
