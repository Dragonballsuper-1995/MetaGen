# MetaGen - AI-Powered Video Metadata Generation

## Tech Stack
- **Framework:** Next.js 16.2 (Turbopack)
- **Styling:** Tailwind CSS 4, Vanilla CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Theming:** Next Themes (Oklch-based dynamic colors)
- **State Management:** React Hooks

## Architecture
- **Primary Page:** `app/page.tsx` - Orchestrates the app states (Input, Loading, Output).
- **Core Component:** `components/metagen/morphing-container.tsx` - Handles the main UI morphing and disintegration transitions.
- **Navigation:** `components/metagen/header.tsx` - Fixed glassmorphism header with logo and theme toggle.
- **History:** `components/metagen/history-sidebar.tsx` - Session-based history management.

## Key Features
- **Metadata Synthesis:** Generates Title, Description, and Tags from video scripts.
- **Particle Transitions:** Cinematic disintegration effects for AI-generated samples.
- **Premium Dark/Light Mode:** Full glassmorphism support across themes.
- **AI Samples:** One-click script population for testing.

## Local Development
```bash
npx next dev -p 3005
```

---
*Created by Gemini CLI on 2026-05-28*
