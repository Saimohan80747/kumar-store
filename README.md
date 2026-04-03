
  # Kumar Store Commerce Platform

  Fast, modern wholesale + retail commerce experience built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

  This repository includes:
  - A complete customer storefront
  - A dedicated admin control panel
  - Shop owner onboarding and approval workflows
  - Cart, checkout, order tracking, coupons, notifications, and reviews
  - Supabase-backed persistence with a resilient fallback to seed data

  Original design source:
  https://www.figma.com/design/iECVv2Xqi46cAbwXBlYWTI/Build-Extraordinary-Website

  ## Why This Project Stands Out

  - Multi-role commerce flow in one codebase: customer, shop owner, and admin
  - Route-level lazy loading for storefront and admin performance
  - Clean component architecture with reusable UI primitives
  - Serverless-first backend model using Supabase Edge + PostgREST
  - Production-friendly deployment setup for both Netlify and Vercel

  ## Core Experiences

  ### Storefront
  - Home, products, product detail, cart, checkout
  - Account, orders, order tracking, wishlist, savings
  - Category browsing, brand discovery, and featured collections

  ### Shop Owner
  - Registration request flow
  - Approval-driven access
  - Shop dashboard and role-based pricing behavior

  ### Admin
  - Overview dashboard
  - Orders management
  - Product management and stock updates
  - Customer and shop approvals
  - Coupons, analytics, product requests, settings

  ## Tech Stack

  - Framework: React 18 + TypeScript
  - Bundler: Vite 6
  - Routing: React Router 7
  - State: Zustand
  - Styling: Tailwind CSS 4 + custom theme layers
  - UI Primitives: Radix UI + custom components
  - Charts: Recharts
  - Backend: Supabase (Auth, Edge Functions, PostgREST)
  - Motion: Motion

  ## Project Structure

  ```text
  .
  |- src/
  |  |- app/
  |  |  |- components/        # storefront + admin UI
  |  |  |- services/          # Supabase + speech service clients
  |  |  |- api.ts             # backend request layer
  |  |  |- routes.ts          # app and admin routing
  |  |  |- store.ts           # global app state and business logic
  |  |- main.tsx
  |- supabase/
  |  |- functions/
  |  |  |- make-server-8a0a2a06/
  |  |- migrations/
  |- styles/
  |- utils/
  |- netlify.toml
  |- vercel.json
  |- vite.config.ts
  ```

  ## Quick Start

  ### 1. Install dependencies

  ```bash
  npm install
  ```

  ### 2. Create environment file

  Create a `.env` file in the project root:

  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  VITE_SARVAM_API_KEY=your-sarvam-key
  ```

  Notes:
  - `VITE_SARVAM_API_KEY` is optional unless you enable speech features.
  - If Supabase values are missing, auth-dependent features will not work.

  ### 3. Start development server

  ```bash
  npm run dev
  ```

  ### 4. Build for production

  ```bash
  npm run build
  ```

  ## Available Scripts

  - `npm run dev` - Launch Vite development server
  - `npm run build` - Create production build in `dist/`

  ## Routing Overview

  ### Public / Customer routes
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

  ### Admin routes
  - `/admin`
  - `/admin/orders`
  - `/admin/products`
  - `/admin/shop-approvals`
  - `/admin/customers`
  - `/admin/coupons`
  - `/admin/analytics`
  - `/admin/product-requests`
  - `/admin/settings`

  ## Data Layer and Backend

  The application uses a hybrid backend approach:

  - Supabase Edge Functions for core operations (users, orders, products, coupons, analytics)
  - Supabase PostgREST for direct table operations (cart items, notifications, reviews, product requests)

  Edge Function base path:
  - `https://<project-id>.supabase.co/functions/v1/make-server-8a0a2a06`

  If backend initialization fails, the app gracefully continues with seeded product data so the UI remains usable.

  ## Deployment

  ### Netlify

  `netlify.toml` is already configured:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - SPA fallback redirect to `index.html`

  ### Vercel

  `vercel.json` includes SPA rewrite rules:
  - All routes are rewritten to `index.html`

  ## Security and Reliability Notes

  - Login attempts are rate-limited in client logic to reduce brute-force abuse
  - Input sanitization utilities are applied in critical auth and form flows
  - Request timeout handling prevents long-hanging network calls
  - Global error boundary protects route rendering failures

  ## Database and Migrations

  SQL migrations are located in:

  - `supabase/migrations/`

  Before production release:
  - Apply migrations to your Supabase project
  - Verify Row Level Security and table policies
  - Confirm anon/public keys are appropriate for your environment

  ## Troubleshooting

  ### App loads but login fails
  - Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly.

  ### Speech actions are unavailable
  - Set `VITE_SARVAM_API_KEY` in `.env`.

  ### Deep links return 404 in hosting
  - Ensure SPA rewrites are enabled (already configured for Netlify and Vercel).

  ### Build succeeds but data is empty
  - Verify Supabase tables, policies, and Edge Function deployment.

  ## Contributing

  1. Create a feature branch.
  2. Keep UI and business logic changes scoped and atomic.
  3. Run a local build before opening a pull request.
  4. Include screenshots for visual updates.

  ## License

  No license file is currently defined in this repository.
  If this will be shared publicly, add a license before distribution.
  