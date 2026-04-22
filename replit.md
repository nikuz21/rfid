# TermiPay Admin Consol

## Overview

TermiPay is a web-based administrative dashboard for a transit fare collection system. It manages RFID card payments, user registration, transaction logging, fare routes, and revenue reporting.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Recharts + Lucide icons
- **Backend**: Express 5 (Node.js)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session + connect-pg-simple)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- **users** — id, card_uid, full_name, contact_number, balance, gcash_loaded_total, status, created_at
- **transactions** — id, timestamp, card_uid, type (Fare/Top-up), amount, status
- **fare_routes** — id, origin, destination, fare_amount, is_active
- **session** — auto-created by connect-pg-simple for session management

## Authentication

- Admin login: username `admin`, password `admin123`
- Session-based with express-session + PostgreSQL session store
- Login returns session cookie; /api/auth/me checks authentication

## Pages

- `/login` — Admin login
- `/` — Dashboard with stats + 7-day revenue trend chart
- `/card-registration` — Register RFID cards + recently registered table
- `/transactions` — Searchable/filterable transaction logs with edit/delete
- `/users` — User management with edit/delete
- `/fare-matrix` — Route management with activate toggle, add/edit/delete
- `/reports` — 7-day analytics with print PDF button

## API Endpoints

All endpoints prefixed with `/api`:
- POST `/auth/login`, POST `/auth/logout`, GET `/auth/me`
- GET/POST `/users`, GET/PATCH/DELETE `/users/:id`, GET `/users/recent`
- GET/POST `/transactions`, PATCH/DELETE `/transactions/:id`
- GET/POST `/routes`, PATCH/DELETE `/routes/:id`, PATCH `/routes/:id/toggle`
- GET `/dashboard/stats`, GET `/dashboard/revenue-trend`
- GET `/reports/summary`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
