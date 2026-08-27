# Add Protein to Your Life

Elderly-friendly, local-first Progressive Web App that helps South Indian families add high-protein side dishes to traditional carb-heavy meals.

## Features

- Single-job multi-screen flow: Base meal → Proteins → Servings → Recipes
- Top-right calendar access (Instagram DM-style)
- Vertically scrollable protein history with fixed Home button
- Dexie.js / IndexedDB offline storage
- Dynamic Gemini recipes using base meal + selected proteins + cooking history
- Server-side API key (`.env` / Vercel env) so Mom never types a key on her phone
- Offline starter recipes if the API is unavailable
- Large 56px touch targets and high-contrast Telangana Emerald palette

## Quick start

```bash
cp .env.example .env
# put GEMINI_API_KEY=... in .env
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Secrets

- `GEMINI_API_KEY` lives in `.env` locally and in Vercel Project Env vars in production.
- The phone app calls `/api/recipes` and `/api/adapt`; the key never ships in the client bundle.
- Optional Settings override exists only as a personal backup.

## Build & preview

```bash
npm run build
npm run preview
```

## Install on iPhone

1. Deploy to Vercel.
2. Open the site in Safari.
3. Share → Add to Home Screen → name it **Add Protein**.
4. Use the app; Gemini runs through the server automatically.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Dexie.js
- vite-plugin-pwa
- Vercel serverless `/api/*` (Gemini proxy)
- anime.js (screen enter + button press)
- Phosphor Icons

## Specs

Original product/tech/design docs live in `docs/specs/`.
