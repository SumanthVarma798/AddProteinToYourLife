# Add Protein to Your Life

Elderly-friendly, local-first Progressive Web App that helps South Indian families add high-protein side dishes to traditional carb-heavy meals.

## Features

- Single-job multi-screen flow: Base meal → Proteins → Servings → Recipes
- Top-right calendar access (Instagram DM-style)
- Vertically scrollable protein history with fixed Home button
- Dexie.js / IndexedDB offline storage
- Built-in starter recipes when no API key is set
- Optional OpenAI / Gemini / custom OpenAI-compatible recipe generation
- Large 56px touch targets and high-contrast Telangana Emerald palette

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Build & preview

```bash
npm run build
npm run preview
```

## Install on iPhone

1. Deploy to Vercel (or any static host).
2. Open the site in Safari.
3. Share → Add to Home Screen → name it **Add Protein**.
4. Open Settings in the app and paste an API key if you want AI recipes.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Dexie.js
- vite-plugin-pwa
- anime.js (screen enter + button press)
- Phosphor Icons

## Specs

Original product/tech/design docs live in `docs/specs/`.
