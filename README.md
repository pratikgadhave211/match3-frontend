# match3

React + TypeScript migration of the original Match3 UI.

## Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS (CDN runtime config in `index.html`)

## Scripts
- `npm run dev` - start local dev server
- `npm run build` - type-check + production build
- `npm run preview` - preview production build

## Structure
- `components/` - reusable UI shells (`header.tsx`, `sidebar.tsx`, `mobile-nav.tsx`, `modal.tsx`, `Toast.tsx`)
- `views/` - page views (`landing.tsx`, `home.tsx`, `matches.tsx`, `connections.tsx`, `saved.tsx`, `settings.tsx`, `team.tsx`, `solutions.tsx`, `blog.tsx`, `pricing.tsx`)
- `App.tsx` - app state and functionality wiring
- `main.tsx` - React entry
- `styles.css` - visual styling and animations

## Notes
- Matches filtering and sorting are state-driven.
- Connections persist via `localStorage`.
- Landing, modal, toasts, profile actions, and navigation are React-managed.
