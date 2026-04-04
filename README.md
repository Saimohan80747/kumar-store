# Kumar Store Commerce Platform

> A fast wholesale + retail commerce experience with customer storefront, shop-owner onboarding, and admin operations in one unified web app.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase&logoColor=white)

Original design source:  
https://www.figma.com/design/iECVv2Xqi46cAbwXBlYWTI/Build-Extraordinary-Website

## Table of Contents

- [Why This Project Is Strong](#why-this-project-is-strong)
- [Experience Map](#experience-map)
- [Architecture Snapshot](#architecture-snapshot)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Routing Reference](#routing-reference)
- [Backend and Data Strategy](#backend-and-data-strategy)
- [Deployment](#deployment)
- [Security and Reliability](#security-and-reliability)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Why This Project Is Strong

- Multi-role commerce in one app: customer, shop owner, admin
- Route-level lazy loading for large screens and admin flows
- Supabase-powered backend with graceful fallback to seeded data
- Production-ready hosting setup for both Netlify and Vercel

## Experience Map

| Persona | What They Can Do | Core Routes |
| --- | --- | --- |
| Customer | Browse products, manage cart, checkout, track orders, save wishlist | `/`, `/products`, `/product/:id`, `/cart`, `/checkout`, `/orders`, `/wishlist`, `/account` |
| Shop Owner | Request onboarding, access dashboard after approval, monitor operations | `/register`, `/shop-dashboard` |
| Admin | Manage orders, products, customers, approvals, coupons, analytics, settings | `/admin`, `/admin/orders`, `/admin/products`, `/admin/customers`, `/admin/analytics` |

## Architecture Snapshot

```text
src/
  app/
    components/      -> Storefront + Admin UI views
    services/        -> Supabase + speech service clients
    api.ts           -> Request orchestration layer
    routes.ts        -> Public/Admin route map
    store.ts         -> App state and business logic
  main.tsx

supabase/
  functions/
    make-server-8a0a2a06/   -> Edge function handlers
  migrations/               -> SQL schema updates

styles/                     -> Theme and global styling
utils/                      -> Shared runtime utilities
```

Data flow at a glance:

1. UI events trigger actions in store/API modules.
2. API layer calls Supabase Edge Functions and PostgREST.
3. Responses update app state and reactive UI.
4. If backend is unavailable, seeded product data keeps the app usable.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Routing | React Router 7 |
| State | Zustand |
| Styling | Tailwind CSS 4, custom theme layers |
| UI Primitives | Radix UI, custom component system |
| Visualization | Recharts |
| Backend | Supabase Auth, Edge Functions, PostgREST |
| Motion | Motion |

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Create .env

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SARVAM_API_KEY=your-sarvam-key
```

Notes:

- `VITE_SARVAM_API_KEY` is optional unless speech features are enabled.
- Missing Supabase values will block auth and live backend operations.

### 3) Run locally

```bash
npm run dev
```

### 4) Build for production

```bash
npm run build
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Client-side anon key for auth and data calls |
| `VITE_SARVAM_API_KEY` | Optional | Enables speech/voice-related features |

## Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build production assets into `dist/`

## Routing Reference

### Public and Customer

- `/`
- `/products`
- `/product/:id`
- `/cart`
- `/checkout`
- `/login`
- `/register`
- `/orders`
- `/orders/:id`
- `/wishlist`
- `/savings`
- `/account`
- `/shop-dashboard`

### Admin

- `/admin`
- `/admin/orders`
- `/admin/products`
- `/admin/shop-approvals`
- `/admin/customers`
- `/admin/coupons`
- `/admin/analytics`
- `/admin/product-requests`
- `/admin/settings`

## Backend and Data Strategy

The app uses a hybrid model:

- Supabase Edge Functions for core business operations (users, orders, products, coupons, analytics)
- Supabase PostgREST for direct table-driven workflows (cart items, notifications, reviews, product requests)

Edge function base pattern:

- `https://<project-id>.supabase.co/functions/v1/make-server-8a0a2a06`

## Deployment

### Netlify

Configured in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback redirect to `index.html`

### Vercel

Configured in `vercel.json`:

- SPA rewrite rules route all paths to `index.html`

## Security and Reliability

- Login attempts are rate-limited in client logic
- Input sanitization is applied to critical auth/form paths
- Request timeout protection prevents long-hanging API calls
- Global error boundary protects route rendering failures

## Troubleshooting

### Login fails

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

### Speech actions not available

- Add `VITE_SARVAM_API_KEY` in `.env`.

### Deep links return 404 on deploy

- Confirm SPA rewrites are enabled (already configured for Netlify and Vercel).

### Build passes but data appears empty

- Validate Supabase tables, policies, and Edge Function deployment.

## Contributing

1. Create a dedicated feature branch.
2. Keep UI and logic changes focused and atomic.
3. Run a local production build before opening a PR.
4. Add screenshots for visual changes.

## License

No license file is currently defined.  
If this repository will be shared publicly, add a license before distribution.
