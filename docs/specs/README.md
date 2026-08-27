# Add Protein to Your Life - Project Specification Package

Welcome to the complete specification package for **Add Protein to Your Life**, an elderly-friendly, local-first Progressive Web App (PWA) designed to help South Indian families seamlessly integrate high-protein side dishes into traditional carb-heavy meals.

## Package Contents

1. **`PRD.md`** - Product Requirements Document detailing user persona, single-job multi-screen architecture, top-header calendar trigger, and vertically scrollable calendar layout.
2. **`TRD.md`** - Technical Requirements Document defining the tech stack (React + Vite + Tailwind + Dexie.js + PWA), local IndexedDB schema, and LLM JSON prompts.
3. **`DESIGN.md`** - Design Specs & Wireframes covering high-contrast color palettes, 56px touch targets, top-right calendar icon placement, and the fixed bottom Home button on the calendar screen.
4. **`DEPLOYMENT.md`** - Step-by-step guide to generating the code using AI tools (Cursor, v0, Bolt.new), deploying for free on Vercel, and installing on iPhone without an Apple Developer subscription.

## Quick Start for AI Coders
To generate the full application, copy the prompt below and feed it into **Cursor**, **v0.dev**, **Claude Code**, or **Bolt.new** along with these markdown files:

> *"Build a complete React + Vite + Tailwind CSS Progressive Web App (PWA) named 'Add Protein to Your Life' based on the attached PRD.md, TRD.md, and DESIGN.md files. Follow the single-job multi-step screen flow with explicit 'Back' navigation, persistent top-header Calendar icon (like Instagram DMs), vertically scrollable Calendar view with a fixed bottom 'Home' button, local IndexedDB persistence with Dexie.js, and PWA setup with vite-plugin-pwa."*