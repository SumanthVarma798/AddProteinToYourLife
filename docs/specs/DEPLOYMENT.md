# Deployment & Installation Guide
## App Name: Add Protein to Your Life

## 1. Master AI Prompt for Full Code Generation

Copy and paste the prompt below into **Cursor**, **v0.dev**, **Claude Code**, or **Bolt.new**:

```text
You are an expert full-stack developer. Build a complete React + Vite + Tailwind CSS Progressive Web App (PWA) named "Add Protein to Your Life" using the attached PRD.md, TRD.md, and DESIGN.md specifications.

Key Execution Rules:
1. Header Calendar Button: Place a calendar icon (📅) at the top-right of the header on screens 1-4 (similar to Instagram's old DM icon).
2. Vertically Scrollable Calendar Screen:
   - Contains a vertically scrollable monthly view with colored dots on date tiles (🟢 Veg, 🟠 Non-Veg, 🔵 Seafood, ⚪ None).
   - Features a FIXED bottom navigation bar with a large "🏠 HOME" button that returns the user to Screen 1.
3. Multi-Screen Setup Flow with "← Back" buttons on every step.
4. Use IndexedDB with Dexie.js for 100% offline local data storage.
5. Configure vite-plugin-pwa for iOS home screen installation.
6. Use 56px minimum touch targets and the exact high-contrast color palette defined in DESIGN.md.
```

## 2. Deploying to Vercel (100% Free)

1. Push your generated code repository to GitHub.
2. Log into [Vercel](https://vercel.com) using your GitHub account.
3. Click **Add New Project**, select your GitHub repository, and click **Deploy**.
4. Vercel will create a live URL (e.g., `https://add-protein-to-your-life.vercel.app`).

## 3. Installing on Mom's iPhone (No Apple Developer Account Required)

1. Open **Safari** on her iPhone and go to your Vercel deployment URL.
2. Tap the **Share** button (the square with an arrow pointing up at the bottom toolbar).
3. Scroll down the menu and tap **Add to Home Screen**.
4. Set the app name to **"Add Protein"** and tap **Add**.
5. Launch the app directly from her iPhone Home Screen.
6. Tap the Settings icon on the Calendar or Home screen and enter your OpenAI / Gemini API key once. It will be stored safely inside her iPhone's local IndexedDB!