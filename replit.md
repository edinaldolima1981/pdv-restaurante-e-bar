# PDV Restaurante

## Overview

Sistema de PDV (Ponto de Venda) completo para restaurante, com gestão de mesas, pedidos, cardápio, usuários e caixa.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (Tailwind CSS, Framer Motion, shadcn/ui, Recharts)
- **Backend**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild

## Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Employees**: created by admin through the Users panel

## Structure

```text
artifacts/
├── api-server/         # Express API server
└── pdv-restaurante/    # React frontend (PDV)
lib/
├── api-spec/           # OpenAPI spec + Orval codegen config
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas from OpenAPI
└── db/                 # Drizzle ORM schema + DB connection
scripts/
└── src/seed.ts         # DB seed script (creates admin + sample data)
```

## Features

- Login/auth (admin + employees)
- PDV main screen: tables grid + order management
- Menu management (categories + products CRUD) — admin only
- Table management — admin only
- User management (create/edit/delete employees) — admin only
- Cash register: open/close sessions, track totals
- Reports (order history, sales) — admin only

## Running

- API server: `pnpm --filter @workspace/api-server run dev`
- Frontend: `pnpm --filter @workspace/pdv-restaurante run dev`
- Seed: `pnpm --filter @workspace/scripts run seed`

## API Routes

All under `/api/`:
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST /users`, `PUT/DELETE /users/:id`
- `GET/POST /categories`, `PUT/DELETE /categories/:id`
- `GET/POST /products`, `PUT/DELETE /products/:id`
- `GET/POST /tables`, `PUT/DELETE /tables/:id`
- `GET/POST /orders`, `GET/PUT /orders/:id`, `POST /orders/:id/items`, `DELETE /orders/:id/items/:itemId`
- `GET/POST /cash/sessions`, `GET /cash/sessions/current`, `POST /cash/sessions/:id/close`
